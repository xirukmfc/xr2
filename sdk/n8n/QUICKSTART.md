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

## Your First Workflow

### Step 1: Create a New Workflow

1. Click **+ New Workflow**
2. Add a **Manual Trigger** node

### Step 2: Add xR2 Get Prompt Node

1. Click **+** to add a node
2. Search for "xR2"
3. Select **xR2** node
4. Configure:
   - **Credentials**: Select your xR2 API credential
   - **Resource**: Prompt
   - **Operation**: Get
   - **Slug**: `your-prompt-slug` (replace with your actual prompt)

### Step 3: Test It

1. Click **Test workflow**
2. You should see output like:
```json
{
  "content": "Your prompt content...",
  "trace_id": "550e8400-e29b-...",
  "variables": {...},
  "model_config": {...}
}
```

## Example: Use with OpenAI

### Step 1: Get Prompt from xR2

Configure xR2 node as above.

### Step 2: Add HTTP Request Node

1. Add **HTTP Request** node
2. Configure:
   - **Method**: POST
   - **URL**: `https://api.openai.com/v1/chat/completions`
   - **Authentication**: Header Auth
     - Name: `Authorization`
     - Value: `Bearer YOUR_OPENAI_KEY`
   - **Body Parameters**:
     ```json
     {
       "model": "{{ $('xR2').item.json.model_config.model_name }}",
       "messages": [
         {
           "role": "system",
           "content": "{{ $('xR2').item.json.content }}"
         },
         {
           "role": "user",
           "content": "Hello!"
         }
       ]
     }
     ```

### Step 3: Track Event

1. Add another **xR2** node
2. Configure:
   - **Resource**: Event
   - **Operation**: Track
   - **Trace ID**: `{{ $('xR2').item.json.trace_id }}`
   - **Event Name**: `openai_completion`
   - **Category**: `llm`
   - **Fields**:
     ```json
     {
       "model": "{{ $('xR2').item.json.model_config.model_name }}",
       "success": true
     }
     ```

### Step 4: Test the Complete Flow

Click **Test workflow** and verify all nodes execute successfully.

## Common Use Cases

### 1. Scheduled Prompt Updates

```
[Schedule Trigger: Every 6 hours]
  → [xR2: Get Prompt]
  → [Database: Update Config]
```

### 2. Dynamic Content Generation

```
[Webhook Trigger]
  → [xR2: Get Prompt]
  → [HTTP: Call LLM]
  → [xR2: Track Event]
  → [Webhook Response]
```

### 3. Multi-Language Support

```
[Manual Trigger]
  → [xR2: Get Prompt slug="greeting-en"]
  → [Switch: Based on language]
      ├─ EN → [xR2: Get Prompt slug="greeting-en"]
      ├─ ES → [xR2: Get Prompt slug="greeting-es"]
      └─ FR → [xR2: Get Prompt slug="greeting-fr"]
```

### 4. A/B Testing

```
[Webhook]
  → [Function: Random selection]
  → [Switch]
      ├─ A → [xR2: Get Prompt slug="version-a"] → [Track: "version_a_used"]
      └─ B → [xR2: Get Prompt slug="version-b"] → [Track: "version_b_used"]
```

## Tips

### Accessing Prompt Data in Other Nodes

Use expressions to reference xR2 data:

```javascript
// Get the prompt content
{{ $('xR2').item.json.content }}

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

### Debugging

To see the full response:

1. Run the workflow
2. Click on the xR2 node
3. Check the **Output** tab
4. Expand the JSON to see all fields

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
- Ensure prompt is published

## Next Steps

- Read full documentation: [README.md](./README.md)
- Learn about testing: [TESTING.md](./TESTING.md)
- Explore xR2 dashboard: https://xr2.uk
- Join n8n community: https://community.n8n.io

## Support

- **n8n Issues**: https://community.n8n.io
- **xR2 Issues**: https://github.com/channeler-ai/xr2/issues
- **API Documentation**: https://xr2.uk/docs
