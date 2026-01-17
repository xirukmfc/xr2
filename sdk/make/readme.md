# xR2 Make.com Integration

Official Make.com (Integromat) integration for xR2 - AI Prompt Management Platform.

## Features

- **Check API Key** - Validate your API key and get the username
- **Get Prompt** - Retrieve prompt content by slug with version control and A/B testing support
- **Track Event** - Send usage events for analytics and conversion tracking

## Installation

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
   - **Base** <- `base.json`
   - **Connection** <- `connections/xr2_api_key.json`
   - **Modules** <- `modules/checkApiKey.json`, `modules/getPrompt.json`, `modules/trackEvent.json`
4. Test and use!

See [QUICK_START.md](QUICK_START.md) for detailed step-by-step instructions.

## Modules

### Check API Key

Validates your API key and returns the username.

**Parameters:** None

**Output:**
```json
{
  "ok": true,
  "user": "your_username"
}
```

### Get Prompt

Retrieves prompt content by slug.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Unique prompt identifier |
| version_number | integer | No | Specific version to retrieve |
| status | select | No | Filter by status (production, testing, draft, etc.) |

Note: `source_name` is auto-filled as `make_sdk`.

**Output:**
```json
{
  "slug": "my-prompt",
  "source_name": "make_sdk",
  "version_number": 2,
  "status": "production",
  "system_prompt": "You are a helpful assistant",
  "user_prompt": "Help me with {{task}}",
  "assistant_prompt": "",
  "variables": [
    {
      "name": "task",
      "type": "string",
      "defaultValue": ""
    }
  ],
  "model_config": {},
  "trace_id": "evt_550e8400_1234567890_abcd1234",
  "deployed_at": "2025-11-28T14:46:01.812013Z",
  "created_at": "2025-11-16T08:37:48.891068Z",
  "updated_at": "2025-11-28T14:46:01.767124Z",
  "ab_test_id": null,
  "ab_test_name": null,
  "ab_test_variant": null
}
```

### Track Event

Sends usage events for analytics.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| trace_id | string | Yes | Trace ID from Get Prompt response |
| event_name | string | Yes | Event name defined in xR2 Analytics |
| source_name | string | No | Defaults to `make_sdk` |
| user_id | string | No | Optional user identifier |
| session_id | string | No | Optional session identifier |
| value | number | No | Numeric value (e.g., revenue) |
| currency | string | No | Currency for value |
| metadata | collection | No | Custom fields defined in the event metadata schema |

**Output:**
```json
{
  "status": "success",
  "event_id": "evt_123abc",
  "trace_id": "evt_550e8400_1234567890_abcd1234",
  "event_name": "sign_up",
  "timestamp": "2025-01-15T10:30:00Z",
  "is_duplicate": false
}
```

## Example Scenarios

### Basic: Check API Key, Get Prompt, Track Event

```
[Manual Trigger] -> [xR2: Check API Key] -> [xR2: Get Prompt] -> [xR2: Track Event]
```

1. **xR2 Module** (Check API Key):
   - Validates your credentials
2. **xR2 Module** (Get Prompt):
   - Slug: `welcome`
3. **xR2 Module** (Track Event):
   - Trace ID: `{{1.trace_id}}` (from Get Prompt)
   - Event Name: `sign_up`
   - User ID: `user_123`

### Revenue Tracking: Purchase Event

```
[Webhook] -> [xR2: Get Prompt] -> [OpenAI] -> [xR2: Track Event]
```

1. **xR2 Module** (Get Prompt):
   - Slug: `checkout-assistant`
2. **OpenAI Module**:
   - Use prompt content from xR2
3. **xR2 Module** (Track Event):
   - Trace ID: `{{1.trace_id}}`
   - Event Name: `purchase_completed`
   - User ID: `user_123`
   - Value: `99.99`
   - Currency: `USD`
   - Metadata: `{"order_id": "order_67890", "product_id": "prod_456"}`

## Authentication

1. Go to https://xr2.uk/api-keys
2. Click "Create Keys"
3. Copy your Product API Key (starts with `xr2_prod_`)
4. Use it when connecting xR2 in Make.com

## API Reference

### Base URL
All requests go to: `https://xr2.uk/api/v1`

### Endpoints Used
- `GET /api/v1/check-api-key` - Check API Key operation
- `POST /api/v1/get-prompt` - Get Prompt operation
- `POST /api/v1/events` - Track Event operation

## Troubleshooting

### Authentication Failed
- Verify your API key is correct
- Ensure the API key starts with `xr2_prod_`
- Check that the API key is active in your xR2 account

### Prompt Not Found
- Check that the slug exists at https://xr2.uk/prompts
- Verify the prompt has a published version
- If using Status filter, ensure a version with that status exists

### Connection Test Fails
- Check API key at https://xr2.uk/api-keys
- Ensure `Authorization: Bearer {{parameters.apiKey}}` is in connection headers

## Support

- Documentation: https://xr2.gitbook.io/docs
- Dashboard: https://xr2.uk
- Email: hello@xr2.uk

## License

MIT


0. Сделать SDK для PIP.
1. Сделать SDK для n8n. Review https://creators.n8n.io/nodes/n8n-nodes-xr2/integration
2. Сделать SDK для Make. Review https://eu2.make.com/apps/xr2-9pmj5r/1/review
3. Сделать SDK для Zapier.https://developer.zapier.com/app/234012/version/1.0.0/actions  /// https://zapier.com/developer/public-invite/234012/76d33482ff8db5ed0f78871a90dfed37/
5. Сделать SDK для Node.js https://www.npmjs.com/package/xr2-sdk
