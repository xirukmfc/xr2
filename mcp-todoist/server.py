"""
MCP Server for Todoist with OAuth 2.0 authentication.
Deployed at https://xr2.uk/mcp-todoist
"""

import os
import json
import time
import secrets
import hashlib
import base64
import logging
from html import escape
from urllib.parse import urlencode, parse_qs

import httpx
import uvicorn
from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.requests import Request
from starlette.responses import JSONResponse, HTMLResponse, RedirectResponse, Response
from mcp.server import Server
from mcp.server.sse import SseServerTransport
import mcp.types as types

# ============================================================
# Configuration
# ============================================================

TODOIST_API_KEY = os.environ["TODOIST_API_KEY"]
OAUTH_CLIENT_ID = os.environ["MCP_OAUTH_CLIENT_ID"]
OAUTH_CLIENT_SECRET = os.environ["MCP_OAUTH_CLIENT_SECRET"]
AUTH_PASSWORD = os.environ["MCP_AUTH_PASSWORD"]
BASE_URL = os.environ.get("MCP_BASE_URL", "https://xr2.uk/mcp-todoist")
PORT = int(os.environ.get("MCP_PORT", "8808"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("mcp-todoist")


# ============================================================
# Todoist API Client
# ============================================================

TODOIST_API = "https://api.todoist.com/rest/v2"


async def _todoist(method: str, path: str, params=None, json_data=None):
    headers = {"Authorization": f"Bearer {TODOIST_API_KEY}"}
    if json_data is not None:
        headers["Content-Type"] = "application/json"
        headers["X-Request-Id"] = secrets.token_hex(16)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(
            method,
            f"{TODOIST_API}{path}",
            params=params,
            json=json_data,
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json() if resp.status_code != 204 else {"success": True}


# ============================================================
# OAuth 2.0 In-Memory Store
# ============================================================

_auth_codes: dict[str, dict] = {}
_access_tokens: dict[str, dict] = {}


def _hash(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def _verify_pkce(verifier: str, challenge: str, method: str = "S256") -> bool:
    if method != "S256":
        return False
    digest = hashlib.sha256(verifier.encode()).digest()
    computed = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return secrets.compare_digest(computed, challenge)


def _issue_token(client_id: str) -> str:
    token = secrets.token_urlsafe(48)
    _access_tokens[_hash(token)] = {
        "client_id": client_id,
        "created_at": time.time(),
    }
    logger.info("Issued access token for client %s", client_id)
    return token


def _token_valid(token: str) -> bool:
    h = _hash(token)
    entry = _access_tokens.get(h)
    if not entry:
        return False
    if time.time() - entry["created_at"] > 86400 * 90:  # 90 days
        del _access_tokens[h]
        return False
    return True


# ============================================================
# OAuth 2.0 Endpoints
# ============================================================


async def oauth_protected_resource(request: Request):
    """RFC 9728 — Protected Resource Metadata."""
    return JSONResponse({
        "resource": BASE_URL,
        "authorization_servers": [BASE_URL],
        "bearer_methods_supported": ["header"],
    })


async def oauth_server_metadata(request: Request):
    """RFC 8414 — Authorization Server Metadata."""
    return JSONResponse({
        "issuer": BASE_URL,
        "authorization_endpoint": f"{BASE_URL}/authorize",
        "token_endpoint": f"{BASE_URL}/token",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "client_credentials"],
        "token_endpoint_auth_methods_supported": ["client_secret_post"],
        "code_challenge_methods_supported": ["S256"],
    })


_AUTHORIZE_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize — Todoist MCP</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
background:#1a1a2e;color:#eee;display:flex;justify-content:center;
align-items:center;min-height:100vh}}
.card{{background:#16213e;border-radius:12px;padding:40px;max-width:420px;
width:90%;box-shadow:0 8px 32px rgba(0,0,0,.3)}}
h1{{font-size:22px;margin-bottom:8px}}
.sub{{color:#aaa;margin-bottom:24px;font-size:14px}}
input[type=password]{{width:100%;padding:12px;border:1px solid #333;
border-radius:8px;background:#0f3460;color:#fff;font-size:16px}}
button{{width:100%;padding:12px;border:none;border-radius:8px;
background:#e94560;color:#fff;font-size:16px;cursor:pointer;
margin-top:16px;font-weight:600}}
button:hover{{background:#c73850}}
.err{{background:rgba(233,69,96,.15);border:1px solid #e94560;
border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:14px;
color:#e94560}}
</style>
</head>
<body>
<div class="card">
<h1>Todoist MCP</h1>
<p class="sub">Enter your access password to authorize this connection.</p>
{error}
<form method="POST" action="{action}">
<input type="hidden" name="client_id" value="{client_id}">
<input type="hidden" name="redirect_uri" value="{redirect_uri}">
<input type="hidden" name="response_type" value="{response_type}">
<input type="hidden" name="state" value="{state}">
<input type="hidden" name="scope" value="{scope}">
<input type="hidden" name="code_challenge" value="{code_challenge}">
<input type="hidden" name="code_challenge_method" value="{code_challenge_method}">
<input type="password" name="password" placeholder="Access password" autofocus required>
<button type="submit">Authorize</button>
</form>
</div>
</body>
</html>"""


def _render_auth_page(params: dict, error: str = "") -> str:
    return _AUTHORIZE_HTML.format(
        error=f'<div class="err">{error}</div>' if error else "",
        action=f"{BASE_URL}/authorize",
        client_id=escape(params.get("client_id", "")),
        redirect_uri=escape(params.get("redirect_uri", "")),
        response_type=escape(params.get("response_type", "code")),
        state=escape(params.get("state", "")),
        scope=escape(params.get("scope", "")),
        code_challenge=escape(params.get("code_challenge", "")),
        code_challenge_method=escape(params.get("code_challenge_method", "")),
    )


async def authorize(request: Request):
    if request.method == "GET":
        return HTMLResponse(_render_auth_page(dict(request.query_params)))

    # POST — validate password, issue auth code
    form = await request.form()
    params = {k: str(v) for k, v in form.items()}
    password = params.pop("password", "")

    if not secrets.compare_digest(password, AUTH_PASSWORD):
        logger.warning("Authorization failed: wrong password")
        return HTMLResponse(_render_auth_page(params, "Invalid password"), status_code=403)

    client_id = params.get("client_id", "")
    redirect_uri = params.get("redirect_uri", "")
    state = params.get("state", "")
    code_challenge = params.get("code_challenge", "")
    code_challenge_method = params.get("code_challenge_method", "S256")

    if client_id != OAUTH_CLIENT_ID:
        return JSONResponse({"error": "invalid_client"}, status_code=400)

    code = secrets.token_urlsafe(32)
    _auth_codes[code] = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method,
        "created_at": time.time(),
    }

    sep = "&" if "?" in redirect_uri else "?"
    location = f"{redirect_uri}{sep}{urlencode({'code': code, 'state': state})}"
    logger.info("Auth code issued, redirecting to %s...", redirect_uri[:60])
    return RedirectResponse(location, status_code=302)


async def token_endpoint(request: Request):
    """OAuth 2.0 Token Endpoint — supports authorization_code and client_credentials."""
    ct = request.headers.get("content-type", "")
    if "application/json" in ct:
        data = await request.json()
    else:
        data = {k: str(v) for k, v in (await request.form()).items()}

    grant_type = data.get("grant_type")
    client_id = data.get("client_id", "")
    client_secret = data.get("client_secret", "")

    if client_id != OAUTH_CLIENT_ID or not secrets.compare_digest(
        str(client_secret), OAUTH_CLIENT_SECRET
    ):
        logger.warning("Token request: invalid client credentials (id=%s)", client_id)
        return JSONResponse({"error": "invalid_client"}, status_code=401)

    if grant_type == "client_credentials":
        tok = _issue_token(client_id)
        return JSONResponse(
            {"access_token": tok, "token_type": "bearer", "expires_in": 86400 * 90}
        )

    if grant_type == "authorization_code":
        code = data.get("code", "")
        code_verifier = data.get("code_verifier", "")
        redirect_uri = data.get("redirect_uri", "")

        auth_code = _auth_codes.pop(code, None)
        if not auth_code:
            return JSONResponse({"error": "invalid_grant", "error_description": "Invalid or expired code"}, status_code=400)

        if time.time() - auth_code["created_at"] > 600:
            return JSONResponse({"error": "invalid_grant", "error_description": "Code expired"}, status_code=400)

        if auth_code["client_id"] != client_id:
            return JSONResponse({"error": "invalid_grant"}, status_code=400)

        if auth_code["redirect_uri"] and redirect_uri != auth_code["redirect_uri"]:
            return JSONResponse({"error": "invalid_grant", "error_description": "redirect_uri mismatch"}, status_code=400)

        if auth_code["code_challenge"]:
            if not code_verifier:
                return JSONResponse({"error": "invalid_grant", "error_description": "code_verifier required"}, status_code=400)
            if not _verify_pkce(code_verifier, auth_code["code_challenge"], auth_code["code_challenge_method"]):
                return JSONResponse({"error": "invalid_grant", "error_description": "PKCE verification failed"}, status_code=400)

        tok = _issue_token(client_id)
        return JSONResponse(
            {"access_token": tok, "token_type": "bearer", "expires_in": 86400 * 90}
        )

    return JSONResponse({"error": "unsupported_grant_type"}, status_code=400)


# ============================================================
# MCP Server — Todoist tools
# ============================================================

mcp_server = Server("todoist-mcp")


@mcp_server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="list_projects",
            description="List all Todoist projects",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="list_tasks",
            description="List active tasks. Filter by project_id, section_id, label, or Todoist filter query.",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": {"type": "string", "description": "Filter by project ID"},
                    "section_id": {"type": "string", "description": "Filter by section ID"},
                    "label": {"type": "string", "description": "Filter by label name"},
                    "filter": {"type": "string", "description": "Todoist filter query (e.g. 'today', 'overdue', 'priority 1')"},
                },
            },
        ),
        types.Tool(
            name="get_task",
            description="Get a specific task by ID",
            inputSchema={
                "type": "object",
                "properties": {"task_id": {"type": "string", "description": "Task ID"}},
                "required": ["task_id"],
            },
        ),
        types.Tool(
            name="create_task",
            description="Create a new task in Todoist",
            inputSchema={
                "type": "object",
                "properties": {
                    "content": {"type": "string", "description": "Task title"},
                    "description": {"type": "string", "description": "Task description"},
                    "project_id": {"type": "string", "description": "Project ID"},
                    "section_id": {"type": "string", "description": "Section ID"},
                    "parent_id": {"type": "string", "description": "Parent task ID (subtask)"},
                    "labels": {"type": "array", "items": {"type": "string"}, "description": "Labels"},
                    "priority": {"type": "integer", "description": "Priority: 1=normal, 4=urgent", "enum": [1, 2, 3, 4]},
                    "due_string": {"type": "string", "description": "Due date in natural language (e.g. 'tomorrow', 'every monday')"},
                    "due_date": {"type": "string", "description": "Due date YYYY-MM-DD"},
                },
                "required": ["content"],
            },
        ),
        types.Tool(
            name="update_task",
            description="Update an existing task",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "Task ID"},
                    "content": {"type": "string", "description": "New title"},
                    "description": {"type": "string", "description": "New description"},
                    "labels": {"type": "array", "items": {"type": "string"}, "description": "Labels"},
                    "priority": {"type": "integer", "description": "Priority 1-4"},
                    "due_string": {"type": "string", "description": "Due date in natural language"},
                },
                "required": ["task_id"],
            },
        ),
        types.Tool(
            name="complete_task",
            description="Complete / close a task",
            inputSchema={
                "type": "object",
                "properties": {"task_id": {"type": "string"}},
                "required": ["task_id"],
            },
        ),
        types.Tool(
            name="reopen_task",
            description="Reopen a completed task",
            inputSchema={
                "type": "object",
                "properties": {"task_id": {"type": "string"}},
                "required": ["task_id"],
            },
        ),
        types.Tool(
            name="delete_task",
            description="Delete a task permanently",
            inputSchema={
                "type": "object",
                "properties": {"task_id": {"type": "string"}},
                "required": ["task_id"],
            },
        ),
        types.Tool(
            name="list_sections",
            description="List sections in a project",
            inputSchema={
                "type": "object",
                "properties": {"project_id": {"type": "string"}},
                "required": ["project_id"],
            },
        ),
        types.Tool(
            name="list_labels",
            description="List all personal labels",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="list_comments",
            description="List comments on a task",
            inputSchema={
                "type": "object",
                "properties": {"task_id": {"type": "string"}},
                "required": ["task_id"],
            },
        ),
        types.Tool(
            name="add_comment",
            description="Add a comment to a task (Markdown supported)",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {"type": "string"},
                    "content": {"type": "string", "description": "Comment text"},
                },
                "required": ["task_id", "content"],
            },
        ),
    ]


@mcp_server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        result = await _dispatch(name, arguments)
        text = json.dumps(result, indent=2, ensure_ascii=False) if isinstance(result, (dict, list)) else str(result)
        return [types.TextContent(type="text", text=text)]
    except httpx.HTTPStatusError as e:
        return [types.TextContent(type="text", text=f"Todoist API error {e.response.status_code}: {e.response.text}")]
    except Exception as e:
        logger.exception("Tool %s failed", name)
        return [types.TextContent(type="text", text=f"Error: {e}")]


async def _dispatch(name: str, a: dict):
    if name == "list_projects":
        return await _todoist("GET", "/projects")
    if name == "list_tasks":
        params = {k: a[k] for k in ("project_id", "section_id", "label", "filter") if a.get(k)}
        return await _todoist("GET", "/tasks", params=params or None)
    if name == "get_task":
        return await _todoist("GET", f"/tasks/{a['task_id']}")
    if name == "create_task":
        body = {k: v for k, v in a.items() if v is not None}
        return await _todoist("POST", "/tasks", json_data=body)
    if name == "update_task":
        body = {k: v for k, v in a.items() if k != "task_id" and v is not None}
        return await _todoist("POST", f"/tasks/{a['task_id']}", json_data=body)
    if name == "complete_task":
        return await _todoist("POST", f"/tasks/{a['task_id']}/close")
    if name == "reopen_task":
        return await _todoist("POST", f"/tasks/{a['task_id']}/reopen")
    if name == "delete_task":
        return await _todoist("DELETE", f"/tasks/{a['task_id']}")
    if name == "list_sections":
        return await _todoist("GET", "/sections", params={"project_id": a["project_id"]})
    if name == "list_labels":
        return await _todoist("GET", "/labels")
    if name == "list_comments":
        return await _todoist("GET", "/comments", params={"task_id": a["task_id"]})
    if name == "add_comment":
        return await _todoist("POST", "/comments", json_data={"task_id": a["task_id"], "content": a["content"]})
    raise ValueError(f"Unknown tool: {name}")


# ============================================================
# SSE Transport + Auth Middleware
# ============================================================

# The endpoint path must include the nginx prefix so the client
# constructs the correct external URL for POST messages.
sse_transport = SseServerTransport("/mcp-todoist/messages/")


async def handle_sse(request: Request):
    async with sse_transport.connect_sse(
        request.scope, request.receive, request._send
    ) as (read_stream, write_stream):
        await mcp_server.run(
            read_stream, write_stream, mcp_server.create_initialization_options()
        )


class AuthMiddleware:
    """Raw ASGI middleware — does not buffer responses, safe for SSE."""

    OPEN_PATHS = frozenset([
        "/.well-known/oauth-protected-resource",
        "/.well-known/oauth-authorization-server",
        "/authorize",
        "/token",
        "/health",
    ])

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope.get("path", "")
        if path in self.OPEN_PATHS:
            return await self.app(scope, receive, send)

        # Extract Bearer token from header or query string
        headers = dict(scope.get("headers", []))
        auth = headers.get(b"authorization", b"").decode()
        token = auth[7:] if auth.startswith("Bearer ") else None

        if not token:
            qs = scope.get("query_string", b"").decode()
            for pair in qs.split("&"):
                if pair.startswith("access_token="):
                    token = pair[13:]
                    break

        if token and _token_valid(token):
            return await self.app(scope, receive, send)

        response = JSONResponse(
            {"error": "unauthorized"},
            status_code=401,
            headers={
                "WWW-Authenticate": (
                    f'Bearer resource_metadata="{BASE_URL}/.well-known/oauth-protected-resource"'
                ),
            },
        )
        await response(scope, receive, send)


# ============================================================
# Starlette Application
# ============================================================

_inner_app = Starlette(
    routes=[
        # OAuth discovery
        Route("/.well-known/oauth-protected-resource", oauth_protected_resource),
        Route("/.well-known/oauth-authorization-server", oauth_server_metadata),
        # OAuth flow
        Route("/authorize", authorize, methods=["GET", "POST"]),
        Route("/token", token_endpoint, methods=["POST"]),
        # MCP (SSE)
        Route("/sse", handle_sse),
        Mount("/messages/", app=sse_transport.handle_post_message),
        # Health
        Route("/health", lambda r: JSONResponse({"status": "ok", "server": "todoist-mcp"})),
    ],
)

app = AuthMiddleware(_inner_app)


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    logger.info("Starting Todoist MCP server on port %d", PORT)
    logger.info("Base URL: %s", BASE_URL)
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
