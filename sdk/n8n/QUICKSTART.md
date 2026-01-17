# Quick Start Guide - xR2 n8n Node

Get up and running with the xR2 n8n node in 5 minutes.

## Installation

### Option 1: Via n8n GUI (Easiest)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter: `n8n-nodes-xr2`
5. Click **Install**
6. Restart n8n

### Option 2: Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-xr2
```

Then restart n8n.

## Get Your API Key

1. Visit https://xr2.uk
2. Log in to your account
3. Navigate to **API Keys**
4. Click **Create Product API Key**
5. Copy the key (format: `xr2_prod_xxx...`)

## Configure Credentials

1. In n8n, go to **Settings** → **Credentials**
2. Click **New**
3. Search for "xR2 API"
4. Paste your API key
5. Click **Save**

## Available Operations

The xR2 node supports 3 operations:

| Resource | Operation | Description |
|----------|-----------|-------------|
| API Key | Check | Validate API key and get username |
| Prompt | Get | Fetch a prompt by slug |
| Event | Track | Send an event with trace_id |

## Your First Workflow

### Step 1: Create a New Workflow

1. Click **+ New Workflow**
2. Add a **Manual Trigger** node

### Step 2: Check API Key (Optional)

1. Click **+** to add a node
2. Search for "xR2"
3. Configure:
   - **Resource**: API Key
   - **Operation**: Check
4. Run to verify your credentials work

Output:
```json
{
  "ok": true,
  "user": "your_username"
}
```

### Step 3: Add xR2 Get Prompt Node

1. Add another **xR2** node
2. Configure:
   - **Credentials**: Select your xR2 API credential
   - **Resource**: Prompt
   - **Operation**: Get
   - **Slug**: `welcome`

Output:
```json
{
  "slug": "your-prompt-slug",
  "user_prompt": "Your prompt content...",
  "trace_id": "evt_abc123_1634567890_xyz",
  "variables": [...],
  "model_config": {...}
}
```

### Step 4: Track an Event (sign_up)

1. Add another **xR2** node
2. Configure:
   - **Resource**: Event
   - **Operation**: Track
   - **Trace ID**: `{{ $('xR2').item.json.trace_id }}`
   - **Event Name**: `sign_up`
   - **User ID**: `user_123`
   - **Metadata**: `{}`

### Step 5: Track a Purchase Event

1. Add another **xR2** node
2. Configure:
   - **Resource**: Event
   - **Operation**: Track
   - **Trace ID**: `{{ $('xR2').item.json.trace_id }}`
   - **Event Name**: `purchase_completed`
   - **User ID**: `user_123`
   - **Value**: `99.99`
   - **Currency**: `USD`
   - **Metadata**: `{"order_id": "order_67890", "product_id": "prod_456"}`

## Event Tracking Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| Trace ID | Yes | From Get Prompt response |
| Event Name | Yes | Event name defined in dashboard |
| Source Name | No | Auto `n8n_sdk` (not editable) |
| User ID | No | User identifier for tracking |
| Session ID | No | Session identifier for analytics |
| Value | No | Numeric value for revenue tracking |
| Currency | No | Currency code (USD, EUR, etc.) |
| Metadata | No | Custom JSON metadata |

## Tips

### Accessing Prompt Data in Other Nodes

Use expressions to reference xR2 data:

```javascript
// Get the prompt content
{{ $('xR2').item.json.user_prompt }}

// Get the trace_id
{{ $('xR2').item.json.trace_id }}

// Get model config
{{ $('xR2').item.json.model_config.model_name }}
{{ $('xR2').item.json.model_config.temperature }}

// Get variables
{{ $('xR2').item.json.variables }}
```

### Error Handling

Add an **IF** node after xR2 to check for errors:

```
[xR2]
  → [IF: {{ $json.error === undefined }}]
      ├─ True → [Continue workflow]
      └─ False → [Send error notification]
```

## Troubleshooting

### Node not found
- Restart n8n after installation
- Check `~/.n8n/custom/node_modules/` for the package

### Authentication error
- Verify API key is correct
- Ensure key is active in xR2 dashboard
- Check key has proper permissions

### Prompt not found
- Verify the slug exists in xR2
- Check spelling of the slug
- Ensure prompt is published (has production version)

## Support

- **n8n Issues**: https://community.n8n.io
- **xR2 Issues**: https://github.com/channeler-ai/xr2/issues
- **API Documentation**: https://xr2.uk/docs
