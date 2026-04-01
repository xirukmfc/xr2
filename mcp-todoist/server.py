"""
MCP Server for Todoist with OAuth 2.0 authentication.
Deployed at https://xr2.uk/mcp-todoist

Uses the MCP SDK's built-in OAuth provider (FastMCP) for spec-compliant
authorization including Dynamic Client Registration (RFC 7591).
"""

import os
import json
import time
import secrets
import logging
from html import escape

import httpx
from starlette.requests import Request
from starlette.responses import JSONResponse, HTMLResponse, RedirectResponse

from mcp.server.fastmcp import FastMCP
from mcp.server.auth.provider import (
    OAuthAuthorizationServerProvider,
    AuthorizationCode,
    AuthorizationParams,
    OAuthToken,
    AccessToken,
    RefreshToken,
    OAuthClientInformationFull,
    construct_redirect_uri,
)
from mcp.server.auth.settings import AuthSettings, ClientRegistrationOptions

# ============================================================
# Configuration
# ============================================================

TODOIST_API_KEY = os.environ["TODOIST_API_KEY"]
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

TODOIST_API = "https://api.todoist.com/api/v1"


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
        if resp.status_code == 204:
            return {"success": True}
        data = resp.json()
        # API v1 wraps list responses in {"results": [...]}
        if isinstance(data, dict) and "results" in data and isinstance(data["results"], list):
            return data["results"]
        return data


# ============================================================
# OAuth 2.0 Provider (in-memory)
# ============================================================

# In-memory stores
_clients: dict[str, OAuthClientInformationFull] = {}
_auth_codes: dict[str, AuthorizationCode] = {}
_access_tokens: dict[str, AccessToken] = {}
_refresh_tokens: dict[str, RefreshToken] = {}
# Pending auth params (login_token -> auth params)
_pending_auth: dict[str, dict] = {}

TOKEN_LIFETIME = 86400 * 90  # 90 days


class TodoistOAuthProvider(OAuthAuthorizationServerProvider):
    """In-memory OAuth provider with password-based authorization."""

    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        return _clients.get(client_id)

    async def register_client(self, client_info: OAuthClientInformationFull) -> None:
        logger.info("Registering client: %s (name=%s)", client_info.client_id, client_info.client_name)
        _clients[client_info.client_id] = client_info

    async def authorize(
        self, client: OAuthClientInformationFull, params: AuthorizationParams
    ) -> str:
        # Generate a login token to track this auth session
        login_token = secrets.token_urlsafe(32)
        _pending_auth[login_token] = {
            "client_id": client.client_id,
            "redirect_uri": str(params.redirect_uri),
            "redirect_uri_provided_explicitly": params.redirect_uri_provided_explicitly,
            "state": params.state,
            "scopes": params.scopes or [],
            "code_challenge": params.code_challenge,
            "resource": params.resource,
            "created_at": time.time(),
        }
        logger.info("Authorize requested for client %s, redirecting to login", client.client_id)
        return f"{BASE_URL}/login?token={login_token}"

    async def load_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: str
    ) -> AuthorizationCode | None:
        return _auth_codes.get(authorization_code)

    async def exchange_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: AuthorizationCode
    ) -> OAuthToken:
        # Remove used auth code
        _auth_codes.pop(authorization_code.code, None)

        now = int(time.time())
        access_token = secrets.token_urlsafe(48)
        refresh_token = secrets.token_urlsafe(48)

        _access_tokens[access_token] = AccessToken(
            token=access_token,
            client_id=client.client_id,
            scopes=authorization_code.scopes,
            expires_at=now + TOKEN_LIFETIME,
            resource=authorization_code.resource,
        )
        _refresh_tokens[refresh_token] = RefreshToken(
            token=refresh_token,
            client_id=client.client_id,
            scopes=authorization_code.scopes,
            expires_at=now + TOKEN_LIFETIME * 2,
        )

        logger.info("Issued access token for client %s (stored=%d)", client.client_id, len(_access_tokens))
        return OAuthToken(
            access_token=access_token,
            token_type="Bearer",
            expires_in=TOKEN_LIFETIME,
            refresh_token=refresh_token,
        )

    async def load_access_token(self, token: str) -> AccessToken | None:
        info = _access_tokens.get(token)
        if not info:
            logger.info("Token lookup failed: not found (stored=%d)", len(_access_tokens))
            return None
        if info.expires_at and info.expires_at < int(time.time()):
            del _access_tokens[token]
            logger.info("Token expired, removed")
            return None
        return info

    async def load_refresh_token(
        self, client: OAuthClientInformationFull, refresh_token: str
    ) -> RefreshToken | None:
        return _refresh_tokens.get(refresh_token)

    async def exchange_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: RefreshToken,
        scopes: list[str],
    ) -> OAuthToken:
        # Revoke old tokens
        _refresh_tokens.pop(refresh_token.token, None)

        now = int(time.time())
        new_access = secrets.token_urlsafe(48)
        new_refresh = secrets.token_urlsafe(48)

        _access_tokens[new_access] = AccessToken(
            token=new_access,
            client_id=client.client_id,
            scopes=scopes,
            expires_at=now + TOKEN_LIFETIME,
        )
        _refresh_tokens[new_refresh] = RefreshToken(
            token=new_refresh,
            client_id=client.client_id,
            scopes=scopes,
            expires_at=now + TOKEN_LIFETIME * 2,
        )

        logger.info("Refreshed token for client %s", client.client_id)
        return OAuthToken(
            access_token=new_access,
            token_type="Bearer",
            expires_in=TOKEN_LIFETIME,
            refresh_token=new_refresh,
        )

    async def revoke_token(self, token: AccessToken | RefreshToken) -> None:
        if isinstance(token, AccessToken):
            _access_tokens.pop(token.token, None)
        else:
            _refresh_tokens.pop(token.token, None)
        logger.info("Token revoked")


# ============================================================
# FastMCP Application
# ============================================================

oauth_provider = TodoistOAuthProvider()

mcp = FastMCP(
    "todoist-mcp",
    auth_server_provider=oauth_provider,
    auth=AuthSettings(
        issuer_url=BASE_URL,
        resource_server_url=BASE_URL,
        client_registration_options=ClientRegistrationOptions(enabled=True),
        revocation_options=None,
    ),
    host="0.0.0.0",
    port=PORT,
    streamable_http_path="/mcp",
    json_response=False,
    stateless_http=False,
)


# ============================================================
# Custom Routes: Login Page + Health
# ============================================================

_LOGIN_HTML = """\
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
<input type="hidden" name="token" value="{token}">
<input type="password" name="password" placeholder="Access password" autofocus required>
<button type="submit">Authorize</button>
</form>
</div>
</body>
</html>"""


@mcp.custom_route("/login", methods=["GET", "POST"])
async def login(request: Request):
    if request.method == "GET":
        token = request.query_params.get("token", "")
        if token not in _pending_auth:
            return HTMLResponse("<h1>Invalid or expired login link</h1>", status_code=400)
        return HTMLResponse(_LOGIN_HTML.format(
            error="",
            action=f"{BASE_URL}/login",
            token=escape(token),
        ))

    # POST — validate password
    form = await request.form()
    login_token = str(form.get("token", ""))
    password = str(form.get("password", ""))

    pending = _pending_auth.get(login_token)
    if not pending:
        return HTMLResponse("<h1>Invalid or expired login link</h1>", status_code=400)

    # Expire old pending auths (10 min)
    if time.time() - pending["created_at"] > 600:
        _pending_auth.pop(login_token, None)
        return HTMLResponse("<h1>Login link expired</h1>", status_code=400)

    if not secrets.compare_digest(password, AUTH_PASSWORD):
        logger.warning("Login failed: wrong password")
        return HTMLResponse(_LOGIN_HTML.format(
            error='<div class="err">Invalid password</div>',
            action=f"{BASE_URL}/login",
            token=escape(login_token),
        ), status_code=403)

    # Password correct — issue auth code
    _pending_auth.pop(login_token, None)

    code = secrets.token_urlsafe(32)
    _auth_codes[code] = AuthorizationCode(
        code=code,
        scopes=pending["scopes"],
        expires_at=time.time() + 300,
        client_id=pending["client_id"],
        code_challenge=pending["code_challenge"],
        redirect_uri=pending["redirect_uri"],
        redirect_uri_provided_explicitly=pending["redirect_uri_provided_explicitly"],
        resource=pending.get("resource"),
    )

    redirect_uri = construct_redirect_uri(
        pending["redirect_uri"],
        code=code,
        state=pending.get("state"),
    )
    logger.info("Auth code issued, redirecting to %s...", pending["redirect_uri"][:60])
    return RedirectResponse(redirect_uri, status_code=302)


@mcp.custom_route("/health", methods=["GET"])
async def health(request: Request):
    return JSONResponse({"status": "ok", "server": "todoist-mcp"})


# ============================================================
# Todoist Tools
# ============================================================


@mcp.tool()
async def list_projects() -> str:
    """List all Todoist projects."""
    result = await _todoist("GET", "/projects")
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def list_tasks(
    project_id: str | None = None,
    section_id: str | None = None,
    label: str | None = None,
    filter: str | None = None,
) -> str:
    """List active tasks. Filter by project_id, section_id, label, or Todoist filter query."""
    params = {}
    if project_id:
        params["project_id"] = project_id
    if section_id:
        params["section_id"] = section_id
    if label:
        params["label"] = label
    if filter:
        params["filter"] = filter
    result = await _todoist("GET", "/tasks", params=params or None)
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def get_task(task_id: str) -> str:
    """Get a specific task by ID."""
    result = await _todoist("GET", f"/tasks/{task_id}")
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def create_task(
    content: str,
    description: str | None = None,
    project_id: str | None = None,
    section_id: str | None = None,
    parent_id: str | None = None,
    labels: list[str] | None = None,
    priority: int | None = None,
    due_string: str | None = None,
    due_date: str | None = None,
) -> str:
    """Create a new task in Todoist."""
    body: dict = {"content": content}
    if description:
        body["description"] = description
    if project_id:
        body["project_id"] = project_id
    if section_id:
        body["section_id"] = section_id
    if parent_id:
        body["parent_id"] = parent_id
    if labels:
        body["labels"] = labels
    if priority:
        body["priority"] = priority
    if due_string:
        body["due_string"] = due_string
    if due_date:
        body["due_date"] = due_date
    result = await _todoist("POST", "/tasks", json_data=body)
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def update_task(
    task_id: str,
    content: str | None = None,
    description: str | None = None,
    labels: list[str] | None = None,
    priority: int | None = None,
    due_string: str | None = None,
) -> str:
    """Update an existing task."""
    body: dict = {}
    if content:
        body["content"] = content
    if description:
        body["description"] = description
    if labels:
        body["labels"] = labels
    if priority:
        body["priority"] = priority
    if due_string:
        body["due_string"] = due_string
    result = await _todoist("POST", f"/tasks/{task_id}", json_data=body)
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def complete_task(task_id: str) -> str:
    """Complete / close a task."""
    result = await _todoist("POST", f"/tasks/{task_id}/close")
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def reopen_task(task_id: str) -> str:
    """Reopen a completed task."""
    result = await _todoist("POST", f"/tasks/{task_id}/reopen")
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def delete_task(task_id: str) -> str:
    """Delete a task permanently."""
    result = await _todoist("DELETE", f"/tasks/{task_id}")
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def list_sections(project_id: str) -> str:
    """List sections in a project."""
    result = await _todoist("GET", "/sections", params={"project_id": project_id})
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def list_labels() -> str:
    """List all personal labels."""
    result = await _todoist("GET", "/labels")
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def list_comments(task_id: str) -> str:
    """List comments on a task."""
    result = await _todoist("GET", "/comments", params={"task_id": task_id})
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool()
async def add_comment(task_id: str, content: str) -> str:
    """Add a comment to a task (Markdown supported)."""
    result = await _todoist("POST", "/comments", json_data={"task_id": task_id, "content": content})
    return json.dumps(result, indent=2, ensure_ascii=False)


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    logger.info("Starting Todoist MCP server on port %d", PORT)
    logger.info("Base URL: %s", BASE_URL)
    mcp.run(transport="streamable-http")
