---
icon: bolt
---

# Quickstart

Get started with xR2 in 5 minutes. This guide walks you through creating your first prompt and integrating it into your application.

## Step 1: Create an Account

1. Go to [xr2.uk](https://xr2.uk)
2. Click **Sign Up**
3. Register with Google or email/password
4. You'll be redirected to the dashboard

## Step 2: Create Your First Prompt

1. In the dashboard, click **+ New Prompt**
2. Fill in the details:
   * **Name**: A human-readable name (e.g., "Customer Support Assistant")
   * **Slug**: A unique identifier for API calls (e.g., `customer-support`)
3. Click **Create**

You'll be taken to the Prompt Editor.

## Step 3: Write Your Prompt

The editor has three sections:

### System Prompt
Instructions that define how the AI should behave:

```
You are a helpful customer support assistant for an e-commerce store.
Be friendly, concise, and always offer to help with returns or exchanges.
```

### User Prompt
The template for user messages. Use `{{variables}}` for dynamic content:

```
Customer name: {{customer_name}}
Order ID: {{order_id}}

Customer message: {{message}}

Please help this customer with their inquiry.
```

### Variables
The editor automatically detects variables like `{{customer_name}}`. Click on each to:
- Set the **type** (string, number, boolean)
- Add a **default value**
- Mark as **required**

## Step 4: Test Your Prompt

1. Click the **Test** button (or press `⌘T`)
2. In the Test Modal:
   * Select your LLM provider (OpenAI, Anthropic, etc.)
   * Choose a model
   * Fill in the variable values
   * Click **Run**
3. See the AI response in real-time with streaming

{% hint style="info" %}
You'll need to add your LLM API key in the test modal the first time.
{% endhint %}

## Step 5: Deploy to Production

Once you're happy with your prompt:

1. Click **Create Version** to save the current state
2. Click **Deploy** to make it live
3. The version status changes to **Production**

Your prompt is now accessible via the API.

## Step 6: Get Your API Key

1. Go to [API Keys](https://xr2.uk/api-keys) in the sidebar
2. Click **Create Keys**
3. Copy your **Product API Key** (starts with `xr2_prod_`)

{% hint style="warning" %}
Keep your API key secret. Never expose it in client-side code.
{% endhint %}

## Step 7: Integrate Into Your App

Call the xR2 API to get your prompt:

```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{"slug": "customer-support"}'
```

**Response:**

```json
{
  "slug": "customer-support",
  "system_prompt": "You are a helpful customer support assistant...",
  "user_prompt": "Customer name: {{customer_name}}...",
  "variables": [...],
  "trace_id": "evt_abc123_1234567890_xyz"
}
```

Use the prompts with your LLM and save the `trace_id` for analytics.

## Step 8: Track Events (Optional)

When something important happens (sign up, purchase, etc.), send an event:

```bash
curl -X POST https://xr2.uk/api/v1/events \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "evt_abc123_1234567890_xyz",
    "event_name": "purchase_completed",
    "user_id": "user_123",
    "value": 99.99,
    "currency": "USD"
  }'
```

This links the conversion to your prompt for analytics.

## What's Next?

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><strong>Prompt Editor</strong></td><td>Master the visual editor</td><td><a href="../prompts/overview.md">overview.md</a></td></tr><tr><td><strong>Analytics</strong></td><td>Set up event tracking</td><td><a href="../analytics/overview.md">overview.md</a></td></tr><tr><td><strong>A/B Testing</strong></td><td>Compare prompt versions</td><td><a href="../ab-testing/overview.md">overview.md</a></td></tr></tbody></table>
