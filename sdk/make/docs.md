# xR2 Make.com SDK - Quick Reference

This file contains raw JSON configurations for Make.com custom app.
For proper JSON files, see the `connections/` and `modules/` directories.

---

## BASE (base.json)

```json
{
    "baseUrl": "https://xr2.uk/api/v1",
    "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    "log": {
        "sanitize": ["request.headers.authorization"]
    },
    "response": {
        "error": {
            "message": "{{body.detail.message}}",
            "type": "{{body.detail.error}}"
        }
    }
}
```

---

## CONNECTION (connections/xr2_api_key.json)

```json
{
    "name": "xr2_api_key",
    "label": "xR2 API Key Connection",
    "type": "apikey",
    "parameters": [
        {
            "name": "apiKey",
            "type": "text",
            "label": "API Key",
            "help": "Enter your xR2 Product API Key. Get it at: https://xr2.uk/api-keys",
            "required": true
        }
    ],
    "common": {
        "headers": {
            "Authorization": "Bearer {{parameters.apiKey}}"
        }
    },
    "test": {
        "request": {
            "url": "/check-api-key",
            "method": "GET"
        },
        "response": {
            "valid": "{{body.ok}}"
        }
    }
}
```

---

## MODULE: Check API Key (modules/checkApiKey.json)

```json
{
    "name": "checkApiKey",
    "label": "Check API Key",
    "description": "Validate your API key and get the username associated with it.",
    "connection": "xr2_api_key",
    "parameters": [],
    "expect": [],
    "interface": [
        {"name": "ok", "type": "boolean", "label": "Is Valid"},
        {"name": "user", "type": "text", "label": "Username"}
    ],
    "communication": {
        "url": "/check-api-key",
        "method": "GET",
        "response": {
            "output": "{{body}}"
        }
    },
    "samples": {}
}
```

---

## MODULE: Get Prompt (modules/getPrompt.json)

See `modules/getPrompt.json` for full configuration.

**Key points:**
- `source_name` is hardcoded as `make_sdk`
- Returns: slug, system_prompt, user_prompt, assistant_prompt, variables, trace_id, model_config, A/B test info

---

## MODULE: Track Event (modules/trackEvent.json)

See `modules/trackEvent.json` for full configuration.

**Key points:**
- `source_name` defaults to `make_sdk` (can be overridden)
- Required: trace_id, event_name
- Optional: user_id, session_id, value, currency, metadata

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check-api-key` | GET | Validate API key |
| `/get-prompt` | POST | Get prompt by slug |
| `/events` | POST | Track event |

---

## Source Name

All requests include `source_name: "make_sdk"` to identify traffic from Make.com integration.
