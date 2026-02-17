
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

Fetches a prompt from xR2 by slug. Can optionally render variables.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Slug | Yes | Unique prompt identifier |
| Version Number | No | Specific version to fetch |
| Status | No | Filter by status |
| Variable Values (JSON) | No | JSON with values to replace `{variable}` placeholders |

**Output:**
* System prompt (with variables replaced if Variable Values provided)
* User prompt (with variables replaced if Variable Values provided)
* Assistant prompt
* Variables
* trace_id
* variables_used (when Variable Values provided)
* Model config
* A/B test info

### Rendering Variables

The xR2 Zapier action can replace `{variable}` placeholders directly — no extra steps needed.

In the **Variable Values (JSON)** field, enter a JSON object mapping variable names to values:

```json
{"customer_name": "Alice", "plan_name": "Enterprise", "top_features": "deploy, analytics"}
```

You can use Zapier field mapping to insert dynamic values from previous steps by clicking **+** and selecting fields from earlier steps:

![xR2 Get Prompt with Variable Values mapping in Zapier](../../images/set_variable_zapier1.png)

Then map the rendered `System Prompt` and `User Prompt` from the xR2 step directly into the OpenAI Conversation step:

![OpenAI step using rendered prompts from xR2](../../images/set_variable_zapier2.png)

If a variable is not provided, its **default value** from the prompt definition is used automatically.

**Output with variables rendered:**

```json
{
  "system_prompt": "Write a welcome email for Alice on the Enterprise plan.",
  "user_prompt": "Generate a welcome email for the new user.",
  "variables_used": {
    "customer_name": "Alice",
    "plan_name": "Enterprise"
  },
  "trace_id": "evt_xxx"
}
```

> **Tip:** Leave Variable Values empty to get the raw template with `{placeholders}`.

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
