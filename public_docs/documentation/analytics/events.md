---
icon: bolt
---

# Event Tracking

Events are the foundation of xR2 analytics. They let you track user actions and link them back to specific prompts.

## What is an Event?

An event represents something that happened:
- User signed up
- Purchase completed
- Content generated
- Support ticket resolved

Each event is linked to a prompt via the `trace_id`.

## Event Structure

```json
{
  "trace_id": "evt_abc123_1234567890_xyz",
  "event_name": "purchase_completed",
  "source_name": "web_app",
  "user_id": "user_123",
  "session_id": "session_456",
  "value": 99.99,
  "currency": "USD",
  "metadata": {
    "order_id": "order_789",
    "product_id": "prod_abc"
  }
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `trace_id` | string | From get-prompt response |
| `event_name` | string | Event identifier (defined in dashboard) |
| `source_name` | string | Where the event came from |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Unique user identifier |
| `session_id` | string | Session identifier |
| `value` | number | Monetary value |
| `currency` | string | Currency code (USD, EUR, etc.) |
| `metadata` | object | Custom fields |

## Defining Events

Before tracking, define your events in the dashboard:

1. Go to **Analytics** → **Event Definitions**
2. Click **+ New Event**
3. Configure:
   - **Event Name**: Unique identifier (e.g., `purchase_completed`)
   - **Category**: Grouping (e.g., "Conversion", "Engagement")
   - **Description**: What this event represents
4. Define the **metadata schema**:
   - Required fields (must be present)
   - Optional fields (can be included)
   - Field types (string, number, boolean)
5. Click **Save**

### Example Event Definition

**Event: `purchase_completed`**

```yaml
Name: purchase_completed
Category: Conversion
Description: User completed a purchase

Required Fields:
  - order_id (string): Unique order identifier

Optional Fields:
  - product_id (string): Product purchased
  - quantity (number): Number of items
  - discount_applied (boolean): Whether discount was used
```

## Sending Events

### Single Event

```bash
curl -X POST https://xr2.uk/api/v1/events \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "evt_abc123_1234567890_xyz",
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

### Batch Events

Send up to 100 events at once:

```bash
curl -X POST https://xr2.uk/api/v1/events/batch \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "trace_id": "evt_abc123",
        "event_name": "page_viewed",
        "source_name": "web_app"
      },
      {
        "trace_id": "evt_def456",
        "event_name": "button_clicked",
        "source_name": "web_app"
      }
    ]
  }'
```

## Event Response

```json
{
  "status": "success",
  "event_id": "evt_unique_id",
  "trace_id": "evt_abc123_1234567890_xyz",
  "event_name": "purchase_completed",
  "timestamp": "2025-01-15T10:30:00Z",
  "is_duplicate": false
}
```

### Deduplication

Events are deduplicated by `trace_id` + `event_name`. Sending the same event twice returns:

```json
{
  "status": "success",
  "is_duplicate": true
}
```

This prevents double-counting.

## Common Event Patterns

### Signup Funnel

```
1. signup_started     — User clicked "Sign Up"
2. email_entered      — Email submitted
3. password_created   — Password set
4. signup_completed   — Account created
```

### Purchase Funnel

```
1. product_viewed     — User viewed product page
2. added_to_cart      — Product added to cart
3. checkout_started   — Began checkout process
4. payment_entered    — Payment info submitted
5. purchase_completed — Order confirmed
```

### Support Flow

```
1. support_requested  — User asked for help
2. ai_response_sent   — AI provided answer
3. feedback_given     — User rated response
4. issue_resolved     — Ticket closed
```

## Revenue Tracking

Track monetary value with `value` and `currency`:

```json
{
  "trace_id": "evt_xxx",
  "event_name": "purchase_completed",
  "value": 149.99,
  "currency": "USD",
  "metadata": {
    "order_id": "order_123",
    "items_count": 3
  }
}
```

xR2 aggregates revenue by:
- Prompt
- Version
- Time period
- A/B test variant

## Viewing Events

### Recent Events Tab

See events in real-time:
- Event name and timestamp
- User and session IDs
- Linked prompt and version
- Metadata details

### Filtering

Filter events by:
- Event name
- Date range
- Prompt slug
- User ID
- Value range

### Export

Export events as CSV for external analysis:
1. Apply filters
2. Click **Export**
3. Download CSV file

## Best Practices

### 1. Define Events Before Coding

Plan your event schema upfront:
- What actions matter?
- What data to capture?
- How will you analyze it?

### 2. Use Consistent Naming

Follow a convention:
- `noun_verb` format: `purchase_completed`, `signup_started`
- Lowercase with underscores
- Be specific: `blog_post_shared` not `shared`

### 3. Include Context

Add relevant metadata:

**Good:**
```json
{
  "event_name": "purchase_completed",
  "value": 99.99,
  "metadata": {
    "order_id": "123",
    "payment_method": "credit_card",
    "items_count": 2
  }
}
```

**Bad:**
```json
{
  "event_name": "purchase"
}
```

### 4. Track the Right Moment

Track when the action is confirmed, not when it's initiated:
- ✅ `purchase_completed` after payment succeeds
- ❌ `purchase_completed` when clicking "Pay"

### 5. Handle Errors

If event tracking fails, don't block the user flow:

```python
try:
    client.track_event(...)
except Exception as e:
    logger.error(f"Event tracking failed: {e}")
    # Continue with user flow
```

## Troubleshooting

### Event Not Appearing

1. Check trace_id is valid (from recent prompt request)
2. Verify event_name matches a defined event
3. Ensure metadata matches the schema
4. Check API key has tracking permissions

### Duplicate Events

- Expected behavior: same trace_id + event_name = deduplicated
- Check your code isn't sending the same event multiple times

### Missing Metadata

- Verify required fields are present
- Check field types match the schema

## Next Steps

- [Conversion Funnels](funnels.md) — Build multi-step analysis
- [A/B Testing](../ab-testing/overview.md) — Link events to experiments
