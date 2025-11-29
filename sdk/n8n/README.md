# xR2 n8n Community Node

[![npm version](https://badge.fury.io/js/n8n-nodes-xr2.svg)](https://badge.fury.io/js/n8n-nodes-xr2)

A community node for [n8n](https://n8n.io) that integrates with the [xR2 API](https://xr2.uk) to fetch prompts and track analytics events in your workflows.

## Features

- **Get Prompt**: Fetch prompt templates from xR2 by slug
  - Returns system, user, and assistant prompt components
  - Support for version and status filtering
  - Variables metadata with type information
  - Automatic trace_id generation for analytics
  - A/B testing support

- **Track Event**: Send analytics events with trace_id for monitoring and debugging
  - Track prompt usage across workflows
  - Custom event categories and fields
  - Full integration with xR2 analytics dashboard

## Installation

### In n8n GUI

1. Go to **Settings** → **Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-xr2`
4. Click **Install**

### Manual Installation

```bash
npm install n8n-nodes-xr2
```

## Setup

### 1. Get your xR2 API Key

1. Log in to your [xR2 account](https://xr2.uk)
2. Navigate to API Keys section
3. Create a new Product API key
4. Copy the key (starts with `xr2_prod_...`)

### 2. Configure Credentials in n8n

1. In n8n, go to **Settings** → **Credentials**
2. Click **New** → search for "xR2 API"
3. Paste your API key
4. Click **Save**

## Usage

### Get Prompt

Fetches a prompt from xR2 by slug.

**Parameters:**
- **Slug** (required): The unique identifier for your prompt
- **Version Number** (optional): Specific version number to fetch (0 = latest deployed version). Use this when you need a particular version of the prompt.
- **Status** (optional): Filter by version status. Options:
  - **Any (Default)**: Get the latest deployed version regardless of status (recommended)
  - **Production**: Only production versions
  - **Testing**: Only testing versions
  - **Draft**: Only draft versions
  - **Inactive**: Only inactive versions
  - **Deprecated**: Only deprecated versions

  ⚠️ **Note**: If you select a specific status and no version with that status exists, you'll get a 404 error. Leave as "Any" unless you specifically need a version with a particular status.

**Output:**
```json
{
  "slug": "my-prompt",
  "source_name": "n8n_sdk",
  "version_number": 2,
  "status": "production",
  "system_prompt": "You are a helpful assistant",
  "user_prompt": "Help me with {{task}}",
  "assistant_prompt": "",
  "variables": [
    {
      "name": "task",
      "type": "string",
      "default": "",
      "required": true
    }
  ],
  "deployed_at": "2025-11-28T14:46:01.812013Z",
  "created_at": "2025-11-16T08:37:48.891068Z",
  "updated_at": "2025-11-28T14:46:01.767124Z",
  "trace_id": "evt_550e8400_1234567890_abcd1234",
  "ab_test_id": null,
  "ab_test_name": null,
  "ab_test_variant": null
}
```

### Track Event

Sends an analytics event to xR2.

**Parameters:**
- **Trace ID** (required): UUID from Get Prompt response or custom identifier
- **Event Name** (required): Name of the event (e.g., "prompt_used", "api_called")
- **Category** (required): Event category (e.g., "workflow", "llm", "user_action")
- **Fields** (optional): JSON object with additional event data

**Output:**
```json
{
  "success": true,
  "event_id": "evt_123abc"
}
```

## Example Workflows

### Basic: Get and Use a Prompt

```
[Manual Trigger] → [xR2: Get Prompt] → [Code Node]
```

1. **xR2 Node** (Get Prompt):
   - Slug: `my-prompt`
2. **Code Node**: Access prompt data
   ```javascript
   const prompt = $input.item.json;
   return [{
     json: {
       system_prompt: prompt.system_prompt,
       user_prompt: prompt.user_prompt,
       trace_id: prompt.trace_id,
       variables: prompt.variables
     }
   }];
   ```

### Advanced: LLM Integration with Analytics

```
[Manual Trigger] → [xR2: Get Prompt] → [HTTP: OpenAI] → [xR2: Track Event]
```

1. **xR2 Node** (Get Prompt): Fetch prompt
2. **HTTP Request Node**: Call OpenAI
   - URL: `https://api.openai.com/v1/chat/completions`
   - Body:
   ```json
   {
     "model": "gpt-4",
     "messages": [
       {
         "role": "system",
         "content": "{{ $('xR2').item.json.system_prompt }}"
       },
       {
         "role": "user",
         "content": "{{ $('xR2').item.json.user_prompt }}"
       }
     ]
   }
   ```
3. **xR2 Node** (Track Event): Log the interaction
   - Trace ID: `{{ $('xR2').item.json.trace_id }}`
   - Event Name: `llm_completion`
   - Category: `llm`
   - Fields: `{"model": "gpt-4", "success": true}`

### With Error Handling

```
[Schedule Trigger]
  → [xR2: Get Prompt]
  → [Switch: Check if error]
      ├─ Success → [Process Data]
      └─ Error → [xR2: Track Event] (log error)
```

## API Reference

### Base URL
All requests go to: `https://xr2.uk/api/v1`

### Authentication
Bearer token authentication using your Product API key.

### Endpoints Used
- `POST /api/v1/get-prompt` - Get Prompt operation
- `POST /api/v1/events` - Track Event operation

## Troubleshooting

### 🔐 Authentication Failed

**Error message:**
```
Authentication failed. Please check your API key in credentials.
```

**Solutions:**
- ✓ Verify your API key is correct in n8n credentials
- ✓ Ensure the API key starts with `xr2_prod_`
- ✓ Check that the API key is active in your xR2 account
- ✓ Make sure you're using a Product API key (not a Management API key)

### ❌ Prompt Not Found

**Error message:**
```
Resource not found. Please verify:
- The prompt slug is correct (no typos)
- The prompt exists in your xR2 dashboard
- The prompt has at least one published version
- You have access to this prompt in your workspace
```

**Solutions:**
- ✓ Check that the slug exists in your xR2 account at https://xr2.uk/prompts
- ✓ Verify the prompt has a published version (production, testing, etc.)
- ✓ If using Status filter, ensure a version with that status exists
- ✓ Leave Status as "Any (Default)" to get the latest deployed version

### 🔧 Node Not Appearing in n8n

**Solutions:**
- ✓ Restart n8n after installation
- ✓ Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- ✓ Check n8n logs for errors: `n8n start --verbose`
- ✓ Verify the package is in `~/.n8n/custom/node_modules/n8n-nodes-xr2/`

### 📊 Understanding Response Fields

The API returns separate fields for different prompt components:
- `system_prompt`: The system/role instruction for the AI
- `user_prompt`: The user message template (may contain variables like `{{task}}`)
- `assistant_prompt`: Optional assistant response prefix
- `variables`: Array of variable definitions with type and requirements
- `trace_id`: Unique identifier for tracking this prompt request

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Clean build artifacts
npm run clean
```

## Contributing

Issues and pull requests are welcome at [github.com/channeler-ai/xr2](https://github.com/channeler-ai/xr2).

## License

MIT

## Support

For issues with:
- **This node**: Open an issue on GitHub
- **xR2 API**: Contact xR2 support
- **n8n**: Visit n8n community forum
