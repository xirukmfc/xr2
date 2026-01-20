
# n8n Integration

Community node for n8n that integrates with the xR2 API.

[![npm](https://img.shields.io/npm/v/n8n-nodes-xr2)](https://www.npmjs.com/package/n8n-nodes-xr2)

## Installation

### Via n8n GUI (Recommended)

1. Go to **Settings** → **Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-xr2`
4. Click **Install**
5. Restart n8n

### Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-xr2
```

## Setup Credentials

1. In n8n, go to **Settings** → **Credentials**
2. Click **New** → search for "xR2 API"
3. Paste your API key (from [xr2.uk/api-keys](https://xr2.uk/api-keys))
4. Click **Save**

## Available Operations

| Resource | Operation | Description |
|----------|-----------|-------------|
| API Key | Check | Validate API key |
| Prompt | Get | Fetch prompt by slug |
| Event | Track | Send analytics event |

## Get Prompt

Fetches a prompt from xR2.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Slug | Yes | Prompt identifier |
| Version Number | No | Specific version (0 = latest) |
| Status | No | `production`, `testing`, `draft`, etc. |

**Output:**

```json
{
  "slug": "welcome",
  "system_prompt": "You are a helpful assistant",
  "user_prompt": "Hello {{name}}",
  "variables": [...],
  "trace_id": "evt_xxx",
  "version_number": 2,
  "status": "production"
}
```

## Track Event

Sends an analytics event to xR2.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Trace ID | Yes | From Get Prompt response |
| Event Name | Yes | Event name from dashboard |
| User ID | No | User identifier |
| Session ID | No | Session identifier |
| Value | No | Numeric value |
| Currency | No | Currency code |
| Metadata | No | JSON object |

## Example Workflow

### Basic Flow

```
[Manual Trigger] → [xR2: Get Prompt] → [xR2: Track Event]
```

1. **xR2 Node** (Get Prompt):
   - Slug: `welcome`

2. **xR2 Node** (Track Event):
   - Trace ID: `{{ $('xR2').item.json.trace_id }}`
   - Event Name: `sign_up`
   - User ID: `user_123`

### With OpenAI

```
[Webhook] → [xR2: Get Prompt] → [OpenAI] → [xR2: Track Event]
```

1. Get the prompt from xR2
2. Use `system_prompt` and `user_prompt` in OpenAI node
3. Track conversion event

## Accessing Data in Expressions

```javascript
// Get prompt content
{{ $('xR2').item.json.user_prompt }}

// Get trace_id
{{ $('xR2').item.json.trace_id }}

// Get model config
{{ $('xR2').item.json.model_config.model_name }}

// Get variables
{{ $('xR2').item.json.variables }}
```

## Troubleshooting

### Node not appearing

* Restart n8n after installation
* Check `~/.n8n/custom/node_modules/` for the package
* Run `n8n start --verbose` to see errors

### Authentication error

* Verify API key is correct
* Ensure key starts with `xr2_prod_`
* Check key is active in dashboard

### Prompt not found

* Verify slug exists at [xr2.uk/prompts](https://xr2.uk/prompts)
* Ensure prompt has a deployed version
* Check spelling

## Links

* npm: [https://www.npmjs.com/package/n8n-nodes-xr2](https://www.npmjs.com/package/n8n-nodes-xr2)
* n8n Community: [https://community.n8n.io](https://community.n8n.io)
