# xR2 Make.com Integration

Official Make.com (Integromat) integration for xR2 - AI Prompt Management Platform.

## Features

- **Check API Key** - Validate your API key and get the username
- **Get Prompt** - Retrieve prompt content by slug with version control and A/B testing support
- **Track Event** - Send usage events for analytics and conversion tracking

## Quick Start

### Option 1: Make.com Marketplace (Coming Soon)

1. Go to your Make.com scenario
2. Search for "xR2" in the apps list
3. Add the xR2 module to your scenario
4. Connect with your API key from https://xr2.uk/api-keys

### Option 2: Custom App (Current Method)

Create xR2 as a custom app in Make.com:

1. Go to https://eu2.make.com/apps
2. Create a new custom app
3. Copy JSON configurations from this repository:
   - **Base** ← `base.json`
   - **Connection** ← `connections/xr2_api_key.json`
   - **Modules** ← `modules/getPrompt.json` and `modules/trackEvent.json`
4. Test and use!

📖 **See [QUICK_START.md](QUICK_START.md) for detailed step-by-step instructions**

## Modules

### Get Prompt

Retrieves prompt content by slug.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Unique prompt identifier |
| source_name | string | No | Auto-filled as `make_sdk` (identifier of the caller) |
| version_number | integer | No | Specific version to retrieve |
| status | select | No | Filter by status (production, testing, draft, etc.) |

**Output:**
- `slug` - Prompt slug
- `system_prompt` - System prompt content
- `user_prompt` - User prompt content  
- `assistant_prompt` - Assistant prompt content
- `variables` - Array of template variables
- `trace_id` - Unique ID for event tracking
- `ab_test_id`, `ab_test_name`, `ab_test_variant` - A/B test info (if active)

### Track Event

Sends usage events for analytics.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| trace_id | string | Yes | Trace ID from Get Prompt response |
| event_name | string | Yes | Event name defined in xR2 Analytics |
| source_name | string | No | Auto-filled as `make_sdk` (can override if needed) |
| user_id | string | No | Optional user identifier |
| session_id | string | No | Optional session identifier |
| value | number | No | Numeric value (e.g., revenue) |
| currency | string | No | Currency for value |
| metadata | collection | No | Custom fields defined in the event metadata schema |

## Example Scenario

1. **Trigger** (e.g., Webhook, Form submission)
2. **xR2 - Get Prompt** → Get your AI prompt by slug
3. **OpenAI/Claude** → Send prompt to AI
4. **xR2 - Track Event** → Track the usage for analytics

## Authentication

1. Go to https://xr2.uk/api-keys
2. Click "Create Keys"
3. Copy your Product API Key
4. Use it when connecting xR2 in Make.com

## Support

- Documentation: https://xr2.gitbook.io/docs
- Dashboard: https://xr2.uk
- Email: support@xr2.uk

## License

MIT
