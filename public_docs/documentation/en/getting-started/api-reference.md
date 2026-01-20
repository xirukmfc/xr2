
# API Reference

Base URL: `https://xr2.uk/api/v1`

**Interactive Documentation:** [https://xr2.uk/docs](https://xr2.uk/docs) — Swagger UI for testing the API directly in your browser.

All requests require authentication via Bearer token. See [Authentication](authentication.md).

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check-api-key` | GET | Validate API key |
| `/get-prompt` | POST | Fetch prompt by slug |
| `/events` | POST | Track analytics event |

---

## Check API Key

Validate your API key and get the associated username.

```http
GET /api/v1/check-api-key
```

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | `Bearer xr2_prod_xxx` |

**Response (200 OK):**

```json
{
  "ok": true,
  "user": "your_username"
}
```

**Errors:**
- `401` — Invalid or missing API key

---

## Get Prompt

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
| `slug` | string | Yes | Unique prompt identifier |
| `source_name` | string | Yes | Source identifier (e.g., `web_app`, `mobile_app`) |
| `version_number` | integer | No | Specific version (omit for latest production) |
| `status` | string | No | Filter by status: `draft`, `testing`, `production`, `inactive`, `deprecated` |

**Example Request:**

```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "customer-support",
    "source_name": "web_app"
  }'
```

**Response (200 OK):**

```json
{
  "slug": "customer-support",
  "source_name": "web_app",
  "version_number": 2,
  "status": "production",
  "system_prompt": "You are a helpful customer support assistant.",
  "user_prompt": "Customer: {{customer_name}}\nQuestion: {{question}}",
  "assistant_prompt": null,
  "variables": [
    {
      "name": "customer_name",
      "type": "string",
      "defaultValue": ""
    },
    {
      "name": "question",
      "type": "string",
      "defaultValue": ""
    }
  ],
  "model_config": {},
  "deployed_at": "2025-01-15T10:30:00Z",
  "created_at": "2025-01-10T08:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "trace_id": "evt_abc123_1634567890_xyz",
  "ab_test_id": null,
  "ab_test_name": null,
  "ab_test_variant": null
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Prompt identifier |
| `source_name` | string | Source from request |
| `version_number` | integer | Version number |
| `status` | string | Version status |
| `system_prompt` | string | System prompt content |
| `user_prompt` | string | User prompt template |
| `assistant_prompt` | string | Assistant prompt (optional) |
| `variables` | array | Variable definitions |
| `model_config` | object | Model settings |
| `deployed_at` | datetime | When deployed to production |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `trace_id` | string | **Save this!** Use for event tracking |
| `ab_test_id` | string | A/B test ID (if test running) |
| `ab_test_name` | string | A/B test name (if test running) |
| `ab_test_variant` | string | Which variant: `version_a` or `version_b` |

{% hint style="warning" %}
**Important:** Save the `trace_id` from the response. You need it to track events linked to this prompt request.
{% endhint %}

**Errors:**
- `400` — Invalid status value
- `401` — Invalid or missing API key
- `404` — Prompt not found or no production version
- `429` — Rate limit exceeded

---

## Track Event

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
| `trace_id` | string | Yes | Trace ID from get-prompt response |
| `event_name` | string | Yes | Event name (must be defined in dashboard) |
| `source_name` | string | Yes | Source identifier |
| `user_id` | string | No | User identifier |
| `session_id` | string | No | Session identifier |
| `value` | number | No | Numeric value (for revenue tracking) |
| `currency` | string | No | Currency code (USD, EUR, etc.) |
| `metadata` | object | No | Custom fields (must match event definition) |

**Example Request:**

```bash
curl -X POST https://xr2.uk/api/v1/events \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "evt_abc123_1634567890_xyz",
    "event_name": "purchase_completed",
    "source_name": "web_app",
    "user_id": "user_123",
    "value": 99.99,
    "currency": "USD",
    "metadata": {
      "order_id": "order_789"
    }
  }'
```

**Response (200 OK):**

```json
{
  "status": "success",
  "event_id": "evt_def456_1634567899_abc",
  "trace_id": "evt_abc123_1634567890_xyz",
  "event_name": "purchase_completed",
  "timestamp": "2025-01-15T10:35:00Z",
  "is_duplicate": false
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"success"` on 200 |
| `event_id` | string | Unique event identifier |
| `trace_id` | string | The trace ID from request |
| `event_name` | string | Event name tracked |
| `timestamp` | datetime | When event was recorded |
| `is_duplicate` | boolean | `true` if same event already exists |

Events are deduplicated by `trace_id` + `event_name`. Sending the same event twice is safe — it will return `is_duplicate: true`.

**Errors:**
- `400` — Missing required fields or invalid metadata
- `401` — Invalid or missing API key
- `404` — Event definition not found (create in dashboard first)

---

## Workflow

The typical integration flow:

```
1. POST /get-prompt       → Get prompt content + trace_id
2. Use prompt with LLM    → Your application code
3. POST /events           → Track conversion with trace_id
```

**Example:**

```python
# Step 1: Get prompt
prompt = api.get_prompt(slug="onboarding")
trace_id = prompt["trace_id"]

# Step 2: Use with LLM
response = openai.chat.completions.create(
    messages=[
        {"role": "system", "content": prompt["system_prompt"]},
        {"role": "user", "content": prompt["user_prompt"]}
    ]
)

# Step 3: Track conversion
api.track_event(
    trace_id=trace_id,
    event_name="signup_completed",
    user_id="user_123"
)
```

---

## Rate Limits

API requests are rate-limited based on your subscription plan.

| Plan | Requests/minute |
|------|-----------------|
| Free | 60 |
| Pro | 600 |
| Enterprise | Custom |

When rate limited, you'll receive a `429` response.

---

## Error Format

All errors follow this structure:

```json
{
  "detail": {
    "error": "error_code",
    "message": "Human-readable error message"
  }
}
```
