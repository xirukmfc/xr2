---
icon: code
---

# API Reference

Base URL: `https://xr2.uk/api/v1`

All requests require authentication via Bearer token. See [Authentication](authentication.md).

## Endpoints

### Check API Key

Validate your API key and get the associated username.

```http
GET /api/v1/check-api-key
```

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | `Bearer xr2_prod_xxx` |

**Response:**

```json
{
  "ok": true,
  "user": "your_username"
}
```

---

### Get Prompt

Fetch a prompt by its slug.

```http
POST /api/v1/get-prompt
```

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | `Bearer xr2_prod_xxx` |
| Content-Type | `application/json` |

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Unique prompt identifier |
| version_number | integer | No | Specific version (0 = latest) |
| status | string | No | Filter by status: `production`, `testing`, `draft`, `inactive`, `deprecated` |
| source_name | string | No | SDK identifier (auto-filled by SDKs) |

**Example:**

```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{"slug": "welcome"}'
```

**Response:**

```json
{
  "slug": "welcome",
  "version_number": 2,
  "status": "production",
  "system_prompt": "You are a helpful assistant.",
  "user_prompt": "Hello {{name}}, how can I help you today?",
  "assistant_prompt": "",
  "variables": [
    {
      "name": "name",
      "type": "string",
      "default": "",
      "required": true
    }
  ],
  "model_config": {
    "model_name": "gpt-4",
    "temperature": 0.7
  },
  "trace_id": "evt_550e8400_1234567890_abcd1234",
  "deployed_at": "2025-01-15T10:30:00Z",
  "created_at": "2025-01-10T08:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "ab_test_id": null,
  "ab_test_name": null,
  "ab_test_variant": null
}
```

---

### Track Event

Record an analytics event linked to a prompt request.

```http
POST /api/v1/events
```

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | `Bearer xr2_prod_xxx` |
| Content-Type | `application/json` |

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| trace_id | string | Yes | Trace ID from Get Prompt response |
| event_name | string | Yes | Event name (defined in dashboard) |
| source_name | string | No | SDK identifier |
| user_id | string | No | User identifier |
| session_id | string | No | Session identifier |
| value | number | No | Numeric value (for revenue tracking) |
| currency | string | No | Currency code (USD, EUR, etc.) |
| metadata | object | No | Custom fields |

**Example:**

```bash
curl -X POST https://xr2.uk/api/v1/events \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "evt_550e8400_1234567890_abcd1234",
    "event_name": "purchase_completed",
    "user_id": "user_123",
    "value": 99.99,
    "currency": "USD",
    "metadata": {"order_id": "order_67890"}
  }'
```

**Response:**

```json
{
  "status": "success",
  "event_id": "evt_abc123",
  "trace_id": "evt_550e8400_1234567890_abcd1234",
  "event_name": "purchase_completed",
  "timestamp": "2025-01-15T10:35:00Z",
  "is_duplicate": false
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": {
    "error": "error_code",
    "message": "Human-readable error message"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request — Invalid parameters |
| 401 | Unauthorized — Invalid or missing API key |
| 404 | Not Found — Prompt not found |
| 429 | Too Many Requests — Rate limit exceeded |
| 500 | Internal Server Error |

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_api_key` | API key is invalid | Check your API key |
| `prompt_not_found` | Slug doesn't exist | Verify slug in dashboard |
| `no_deployed_version` | No published version | Deploy a version first |
| `event_not_defined` | Event name not configured | Define event in Analytics settings |
