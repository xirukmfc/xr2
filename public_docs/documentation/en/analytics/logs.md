# API Logs

The API Logs page provides a complete history of all API requests made to your xR2 workspace. Monitor usage, debug integrations, and track activity in real-time.

## Accessing API Logs

Navigate to **API Logs** in the sidebar or go directly to [xr2.uk/logs](https://xr2.uk/logs).

## What's Logged

All requests to user-facing APIs are recorded:

### Get Prompt Requests

Every call to `/api/v1/get-prompt`:

- Request timestamp
- Prompt slug requested
- Source name
- Response status
- Returned prompt version
- Generated `trace_id`

### Event Tracking Requests

Every call to `/api/v1/events`:

- Request timestamp
- Event name
- Source name
- Linked `trace_id`
- Event data (value, currency, metadata)
- Response status

## Log Entry Details

Click on any log entry to see full details:

### Request Information

- **Timestamp**: When the request was made
- **Endpoint**: API endpoint called
- **Method**: HTTP method (POST)
- **Source**: `source_name` from the request
- **IP Address**: Origin of the request

### Request Body

The complete JSON payload sent:

```json
{
  "slug": "customer-support",
  "source_name": "web_app",
  "variables": {
    "customer_name": "John"
  }
}
```

### Response Body

The complete JSON response returned:

```json
{
  "slug": "customer-support",
  "system_prompt": "You are a helpful assistant...",
  "user_prompt": "Help {{customer_name}} with...",
  "trace_id": "evt_abc123_1234567890_xyz"
}
```

### Response Status

- **200**: Successful request
- **400**: Invalid request (missing fields, invalid slug)
- **401**: Authentication failed
- **404**: Prompt not found
- **500**: Server error

## Filtering Logs

Filter logs to find specific requests:

- **Date range**: Select start and end dates
- **Endpoint**: Filter by API endpoint
- **Prompt**: Filter by prompt slug
- **Source**: Filter by source_name
- **Status**: Show only errors or successes

## Use Cases

### Debugging Integrations

When your integration isn't working:

1. Make a test request from your app
2. Find it in API Logs
3. Check the request body for errors
4. Verify the response

### Monitoring Usage

Track how your prompts are being used:

- Which prompts are called most frequently
- Peak usage times
- Request sources distribution

### Audit Trail

API Logs provide a complete audit trail:

- Who accessed which prompts
- When events were tracked
- Full request/response history

## Next Steps

- [Event Tracking](events.md) — Track user actions
- [Analytics Overview](overview.md) — Analyze your data
