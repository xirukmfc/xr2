# Event Tracking API Guide

## Overview

The Event Tracking API allows you to track custom business events (purchases, signups, etc.) linked to your AI prompts. This enables powerful analytics like conversion tracking, A/B testing, and ROI measurement.

## Event Structure

Events use a **hybrid approach** combining standard fields with flexible metadata:

### Standard Fields (Always Available)

These fields are built-in and available in all events:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_name` | string | ✅ Yes | Name of the event (must match Event Definition) |
| `trace_id` | string | ✅ Yes | Trace ID from `GET /get-prompt` response |
| `source_name` | string | ✅ Yes | Source identifier (e.g., "web_app", "mobile_app") |
| `user_id` | string | ❌ No | User identifier for tracking |
| `session_id` | string | ❌ No | Session identifier |
| `value` | number | ❌ No | Numeric value (revenue, amount, etc.) |
| `currency` | string | ❌ No | Currency code (USD, EUR, etc.) |

### Custom Metadata Fields

Custom fields are defined in your Event Definition and passed in the `metadata` object. This allows flexibility for any use case while maintaining validation.

## Example: Purchase Event

### 1. Define Event in Dashboard

Go to Analytics → Events and create:

**Event Name:** `purchase_completed`
**Description:** When user completes a purchase

**Custom Metadata Fields:**
- `product_id` (string, required)
- `subscription_tier` (string, optional)
- `quantity` (number, optional)

### 2. Track Event via API

```bash
curl -X POST 'https://api.xr2.uk/internal/events/events' \
  -H 'Authorization: Bearer xr2_prod_YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "trace_id": "evt_abc123_1634567890_xyz",
    "event_name": "purchase_completed",
    "source_name": "web_app",
    "user_id": "user_12345",
    "value": 99.99,
    "currency": "USD",
    "metadata": {
      "product_id": "prod_456",
      "subscription_tier": "premium",
      "quantity": 1
    }
  }'
```

### 3. Use in n8n

In your n8n workflow:

```json
{
  "event_name": "purchase_completed",
  "trace_id": "{{ $('Get Prompt').item.json.trace_id }}",
  "source_name": "n8n_automation",
  "user_id": "{{ $('Previous Step').item.json.userId }}",
  "value": {{ $('Previous Step').item.json.totalAmount }},
  "currency": "USD",
  "metadata": {
    "product_id": "{{ $('Previous Step').item.json.productId }}",
    "subscription_tier": "{{ $('Previous Step').item.json.tier }}",
    "quantity": {{ $('Previous Step').item.json.qty }}
  }
}
```

### 4. Use in Make.com

In your Make scenario:

```json
{
  "event_name": "purchase_completed",
  "trace_id": "{{1.trace_id}}",
  "source_name": "make_scenario",
  "user_id": "{{2.user_id}}",
  "value": {{2.order_total}},
  "currency": "USD",
  "metadata": {
    "product_id": "{{2.product_id}}",
    "subscription_tier": "{{2.subscription_tier}}",
    "quantity": {{2.quantity}}
  }
}
```

## More Examples

### User Signup Event

**Event Definition:**
- Event Name: `user_signup`
- Metadata Fields:
  - `referral_code` (string, optional)
  - `signup_method` (string, required) - "email", "google", "github"

**API Call:**
```json
{
  "event_name": "user_signup",
  "trace_id": "evt_xyz789_1634567890_abc",
  "source_name": "web_app",
  "user_id": "user_67890",
  "metadata": {
    "referral_code": "FRIEND123",
    "signup_method": "email"
  }
}
```

### Content Engagement Event

**Event Definition:**
- Event Name: `content_shared`
- Metadata Fields:
  - `content_id` (string, required)
  - `platform` (string, required) - "twitter", "facebook", etc.
  - `has_comment` (boolean, optional)

**API Call:**
```json
{
  "event_name": "content_shared",
  "trace_id": "evt_def456_1634567899_hij",
  "source_name": "mobile_app",
  "user_id": "user_11111",
  "session_id": "session_22222",
  "metadata": {
    "content_id": "article_789",
    "platform": "twitter",
    "has_comment": true
  }
}
```

## Best Practices

### 1. Standard vs. Metadata
- Use **standard fields** for common metrics (revenue, user tracking)
- Use **metadata** for domain-specific fields (product IDs, custom attributes)

### 2. Field Types
Choose the right type in Event Definition:
- `string` - Text values, IDs, categories
- `number` - Quantities, scores, counts
- `boolean` - Yes/no flags
- `object` - Nested data structures

### 3. Required Fields
Mark fields as required only if:
- They're essential for analytics
- They'll always be available at tracking time

### 4. Validation
The API automatically validates:
- Required metadata fields are present
- Field types match the definition
- Event name exists in your workspace

## Error Handling

### Missing Required Metadata Field
```json
{
  "detail": "Required metadata field 'product_id' is missing"
}
```

### Invalid Field Type
```json
{
  "detail": "Field 'quantity' should be a number"
}
```

### Event Definition Not Found
```json
{
  "detail": "Event definition not found for event_name='invalid_event'"
}
```

## Analytics

Once tracked, events appear in:
- **Recent Events** - Real-time event stream
- **Event Analytics** - Aggregated metrics by event type
- **Conversion Funnels** - Multi-step conversion tracking
- **A/B Testing** - Compare prompt variants by conversion

Custom metadata fields are automatically extracted and available for filtering and grouping in analytics dashboards.

## SDK Support

### n8n Node
Install the xR2 community node:
```bash
npm install n8n-nodes-xr2
```

### Make.com Module
Search for "xR2" in Make's app directory

### Direct API
Use any HTTP client with your API key in the `Authorization` header

## Questions?

- Documentation: https://docs.xr2.uk
- Support: https://github.com/yourorg/xr2/issues
- Examples: https://github.com/yourorg/xr2-examples
