# xR2 Make.com - Quick Start

## What You Need to Do

1. Go to https://eu2.make.com/apps
2. Create new app "xR2"
3. Copy JSON from files below
4. Test
5. Done!

---

## Step 1: Base

Go to **Base** -> paste:

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

## Step 2: Connection

Go to **Connections** -> Add Connection -> paste content from file:

**File:** `connections/xr2_api_key.json`

Or directly from here:

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

## Step 3: Module "Check API Key"

Go to **Modules** -> Add Module -> paste content from file:

**File:** `modules/checkApiKey.json`

```json
{
    "name": "checkApiKey",
    "label": "Check API Key",
    "description": "Validate your API key and get the username associated with it. Use this to verify credentials are working.",
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

## Step 4: Module "Get Prompt"

**Modules** -> Add Module -> paste content from file:

**File:** `modules/getPrompt.json`

---

## Step 5: Module "Track Event"

**Modules** -> Add Module -> paste content from file:

**File:** `modules/trackEvent.json`

---

## Testing

### Test Connection:
1. Connections -> xr2_api_key -> Test
2. Enter API key from https://xr2.uk/api-keys
3. Should see: Connection successful

### Test Modules:
1. Create new Scenario
2. Add xR2 -> Check API Key
3. Run once -> should return `{"ok": true, "user": "your_username"}`
4. Add xR2 -> Get Prompt
5. Enter slug of existing prompt (source_name is auto-filled as `make_sdk`)
6. Run once -> check output
7. Add xR2 -> Track Event
8. Map trace_id from Get Prompt
9. Enter event_name (from Analytics settings); source_name defaults to `make_sdk`
10. Fill user_id/session_id/value/currency/metadata if needed
11. Run once -> should return status success and event_id

---

## SDK Files

```
sdk/make/
├── app.json                    # Metadata (version, name)
├── base.json                   # Base configuration
├── connections/
│   └── xr2_api_key.json       # Connection JSON (copy to UI)
└── modules/
    ├── checkApiKey.json       # Module Check API Key (copy to UI)
    ├── getPrompt.json         # Module Get Prompt (copy to UI)
    └── trackEvent.json        # Module Track Event (copy to UI)
```

Open each `.json` file and copy content to corresponding Make.com UI section.

---

## Example Scenario

```
[Manual Trigger] -> [xR2: Check API Key] -> [xR2: Get Prompt] -> [xR2: Track Event]
```

1. **Check API Key**: Validates credentials
2. **Get Prompt**: slug = `welcome`
3. **Track Event**:
   - Trace ID: `{{2.trace_id}}` (from Get Prompt)
   - Event Name: `sign_up`
   - User ID: `user_123`

### Revenue Tracking Example

```
[Webhook] -> [xR2: Get Prompt] -> [OpenAI] -> [xR2: Track Event]
```

Track Event settings:
- Trace ID: `{{1.trace_id}}`
- Event Name: `purchase_completed`
- Value: `99.99`
- Currency: `USD`
- Metadata: `{"order_id": "order_67890", "product_id": "prod_456"}`

---

## Troubleshooting

### Connection test fails
- Check API key at https://xr2.uk/api-keys
- Ensure common.headers has: `"Authorization": "Bearer {{parameters.apiKey}}"`

### Module doesn't send JSON
- Add to communication.body: `"type": "json"`

### Optional parameters sent as null
- Use: `"{{if(parameters.field, parameters.field)}}"`

---

## Full Documentation

Read **MAKE_SETUP_GUIDE.md** for detailed explanations of each block.

---

## Done!

After setup you can use xR2 in any Make.com scenarios:

```
Webhook -> xR2 Get Prompt -> OpenAI -> xR2 Track Event -> Response
```
