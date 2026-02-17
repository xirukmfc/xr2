
# Make.com Integration

Official Make.com (Integromat) integration for xR2.

## Installation

The xR2 app is currently under review at Make.com and will be available in the marketplace soon. Once published, you'll be able to find it by searching for "xR2" in Make.com apps.

In the meantime, you can set up the integration manually (see below).

### Manual Setup (Custom App)

1. Go to [eu2.make.com/apps](https://eu2.make.com/apps)
2. Create a new custom app named "xR2"
3. Configure Base, Connection, and Modules (see below)

## Configuration (for manual setup)

### Step 1: Base

Go to **Base** and paste:

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

### Step 2: Connection

Go to **Connections** → **Add Connection** and paste:

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
            "help": "Enter your xR2 Product API Key from https://xr2.uk/api-keys",
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

### Step 3: Modules

Add three modules from the JSON files in the SDK repository:

* `modules/checkApiKey.json` - Check API Key
* `modules/getPrompt.json` - Get Prompt
* `modules/trackEvent.json` - Track Event

## Available Modules

### Check API Key

Validates your API key.

**Output:**
```json
{
  "ok": true,
  "user": "your_username"
}
```

### Get Prompt

Retrieves prompt content by slug.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Prompt identifier |
| version_number | integer | No | Specific version |
| status | select | No | Filter by status |

**Output:**
```json
{
  "slug": "welcome",
  "system_prompt": "You are a helpful assistant",
  "user_prompt": "Hello {{name}}",
  "trace_id": "evt_xxx",
  "variables": [...]
}
```

### Rendering Variables

The Get Prompt module returns raw templates with `{variable}` placeholders. There are two ways to replace them with actual values before sending to an LLM.

#### Option 1: replace() function (recommended for few variables)

Use Make.com's `replace()` function directly in the OpenAI module's Content field. First, set your variable values in a **Tools: Set Multiple Variables** module, then use `replace()` in the LLM module mapping:

```
{{replace(replace(4.system_prompt; "{customer_name}"; 2.customer_name); "{plan_name}"; 2.plan_name)}}
```

Where `4` is the Get Prompt module number and `2` is the Set Variables module number.

![OpenAI module — User Prompt mapping](../../images/set_variable_make1.png)

![OpenAI module — System Prompt with replace() function](../../images/set_variable_make2.png)

#### Option 2: Text Parser modules (visual, no formulas)

Use **Text Parser: Replace** modules between Get Prompt and OpenAI. Each module replaces one variable. The text passes from module to module with one more variable replaced at each step.

```
[Tools] → [xR2: Get Prompt] → [Text Parser: Replace] → [Text Parser: Replace] → [OpenAI]
```

![Scenario flow with Text Parser modules](../../images/set_variable_make3.png)

**First Text Parser** — replaces `{customer_name}`:
- **Pattern**: `{customer_name}`
- **New value**: map `customer_name` from the Tools module
- **Text**: map `System Prompt` from the xR2 module

![Text Parser replacing customer_name](../../images/set_variable_make4.png)

**Second Text Parser** — replaces `{plan_name}`:
- **Pattern**: `{plan_name}`
- **New value**: map `plan_name` from the Tools module
- **Text**: map the output from the **first** Text Parser

![Text Parser replacing plan_name](../../images/set_variable_make5.png)

**OpenAI module** — uses the output from the **last** Text Parser as the System Prompt:

![OpenAI module with Text Parser output](../../images/set_variable_make6.png)

> **Tip:** Variable default values are available in the Get Prompt output under `variables[].defaultValue`.

### Track Event

Sends analytics events.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| trace_id | string | Yes | From Get Prompt |
| event_name | string | Yes | Event name |
| user_id | string | No | User identifier |
| session_id | string | No | Session identifier |
| value | number | No | Numeric value |
| currency | string | No | Currency code |
| metadata | collection | No | Custom fields |

## Example Scenarios

### Basic Flow

```
[Manual Trigger] → [xR2: Check API Key] → [xR2: Get Prompt] → [xR2: Track Event]
```

1. **Check API Key**: Validates credentials
2. **Get Prompt**: slug = `welcome`
3. **Track Event**:
   * Trace ID: `{{2.trace_id}}`
   * Event Name: `sign_up`
   * User ID: `user_123`

### With OpenAI

```
[Webhook] → [xR2: Get Prompt] → [OpenAI] → [xR2: Track Event]
```

1. Get prompt from xR2
2. Send to OpenAI using the prompt content
3. Track conversion event with revenue

**Track Event settings:**
* Trace ID: `{{1.trace_id}}`
* Event Name: `purchase_completed`
* Value: `99.99`
* Currency: `USD`

## Troubleshooting

### Connection test fails

* Check API key at [xr2.uk/api-keys](https://xr2.uk/api-keys)
* Ensure `Authorization: Bearer {{parameters.apiKey}}` in headers

### Module doesn't send JSON

* Add to communication.body: `"type": "json"`

### Optional parameters sent as null

* Use: `"{{if(parameters.field, parameters.field)}}"`

## Links

* Make.com: [https://make.com](https://make.com)
* xR2 Dashboard: [https://xr2.uk](https://xr2.uk)
