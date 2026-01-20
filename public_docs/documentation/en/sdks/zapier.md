
# Zapier Integration

Official Zapier integration for xR2.

## Installation

Install the xR2 Zapier integration using this invite link:

**[Install xR2 for Zapier](https://zapier.com/developer/public-invite/234012/76d33482ff8db5ed0f78871a90dfed37/)**

## Setup

1. Click the install link above and accept the invitation
2. Get your API Key at [xr2.uk/api-keys](https://xr2.uk/api-keys)
3. Click **Create Keys** and copy your Product API Key (starts with `xr2_prod_`)
4. In Zapier, connect xR2 using your API key

## Available Actions

### Check API Key

Validates your API key and returns the username.

**Output:**
```json
{
  "ok": true,
  "user": "your_username"
}
```

### Get Prompt

Fetches a prompt from xR2 by slug.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Slug | Yes | Unique prompt identifier |
| Version Number | No | Specific version to fetch |
| Status | No | Filter by status |

**Output:**
* System prompt
* User prompt
* Assistant prompt
* Variables
* trace_id
* Model config
* A/B test info

### Track Event

Sends analytics events linked to a prompt request.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Trace ID | Yes | From Get Prompt response |
| Event Name | Yes | Event name from dashboard |
| User ID | No | User identifier |
| Session ID | No | Session identifier |
| Value | No | Numeric value for revenue |
| Currency | No | Currency code (USD, EUR) |
| Metadata | No | JSON object with custom fields |

## Example Zap

### Basic: Form → AI Response → Track

```
[New Form Submission] → [xR2: Get Prompt] → [OpenAI] → [xR2: Track Event]
```

1. **Trigger**: New form submission (Typeform, Google Forms, etc.)
2. **xR2 Get Prompt**:
   * Slug: `customer-support`
3. **OpenAI**:
   * Use system_prompt and user_prompt from xR2
   * Fill in variables from form data
4. **xR2 Track Event**:
   * Trace ID: from step 2
   * Event Name: `ai_response_generated`
   * User ID: from form email

### Revenue Tracking

```
[New Order] → [xR2: Get Prompt] → [xR2: Track Event]
```

Track purchases linked to AI interactions:

1. **Trigger**: New Shopify/Stripe order
2. **xR2 Get Prompt**: Get the prompt used for this customer
3. **xR2 Track Event**:
   * Trace ID: stored from initial interaction
   * Event Name: `purchase_completed`
   * Value: order amount
   * Currency: `USD`
   * User ID: customer email

## Mapping Fields

Use Zapier's field mapper to connect data between steps:

```
Trace ID: {{steps.xr2_get_prompt.trace_id}}
User Prompt: {{steps.xr2_get_prompt.user_prompt}}
System Prompt: {{steps.xr2_get_prompt.system_prompt}}
```

## Troubleshooting

### Authentication Failed

* Verify API key is correct
* Ensure key starts with `xr2_prod_`
* Check key is active at [xr2.uk/api-keys](https://xr2.uk/api-keys)

### Prompt Not Found

* Check slug exists at [xr2.uk/prompts](https://xr2.uk/prompts)
* Verify prompt has a deployed version
* Check spelling of the slug

### Event Not Tracking

* Ensure event name is defined in [Analytics settings](https://xr2.uk/analytics/events)
* Verify trace_id is correctly mapped from Get Prompt step
* Check that required metadata fields are provided

## Links

* Zapier: [https://zapier.com](https://zapier.com)
* xR2 Dashboard: [https://xr2.uk](https://xr2.uk)
* Support: hello@xr2.uk
