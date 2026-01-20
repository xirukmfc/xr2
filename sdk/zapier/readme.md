# xR2 Zapier Integration

Official Zapier integration for xR2 - AI Prompt Management Platform.

## Features

- **Check API Key** - Validate your API key and get the username
- **Get Prompt** - Retrieve prompt content by slug with version control and A/B testing support
- **Track Event** - Send usage events for analytics and conversion tracking

## Setup

1. Get your API Key at https://xr2.uk/api-keys
2. Click "Create Keys" and copy your Product API Key (starts with `xr2_prod_`)
3. In Zapier, connect xR2 using your API key

## Available Actions

### Check API Key
Validates your API key and returns the username.

**Output:** `{ ok: true, user: "your_username" }`

### Get Prompt
Fetches a prompt from xR2 by slug.

**Parameters:**
- **Slug** (required) - Unique prompt identifier
- **Version Number** (optional) - Specific version to fetch
- **Status** (optional) - Filter by status (production, testing, draft, etc.)

**Output:** System prompt, user prompt, assistant prompt, variables, trace_id, model config, A/B test info

### Track Event
Sends analytics events linked to a prompt request.

**Parameters:**
- **Trace ID** (required) - From Get Prompt response
- **Event Name** (required) - Event name defined in xR2 Analytics (e.g., sign_up, purchase_completed)
- **User ID** (optional) - User identifier
- **Session ID** (optional) - Session identifier
- **Value** (optional) - Numeric value for revenue tracking
- **Currency** (optional) - Currency code (USD, EUR, etc.)
- **Metadata** (optional) - JSON object with custom fields

## Example Zap

```
[Trigger] -> [xR2: Get Prompt] -> [OpenAI] -> [xR2: Track Event]
```

1. Trigger (e.g., new form submission)
2. Get Prompt: slug = `customer-support`
3. OpenAI: Use prompt content from xR2
4. Track Event: trace_id from step 2, event_name = `sign_up`

## Support

- Dashboard: https://xr2.uk
- Documentation: https://docs.xr2.uk/
- Email: hello@xr2.uk

## License

MIT
