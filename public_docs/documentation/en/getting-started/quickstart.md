# Quickstart

Get started with xR2 in 5 minutes. This guide walks you through creating your first prompt and integrating it into your application.

## Step 1: Create an Account

1. Go to [xr2.uk](https://xr2.uk)
2. Click **Sign Up**
3. Register with Google
4. You'll be redirected to the main screen

![xR2 Main Menu](../../images/main-menu.png)

## Step 2: Create Your First Prompt

1. On the page, click **+ New Prompt**
2. Fill in the details:
    - **Name**: A human-readable name (e.g., "Customer Support Assistant")
    - **Description**: Prompt description (optional)
3. Click **Create Prompt**
![Create Prompt](../../images/create-prompt.png)

## Step 3: Write Your Prompt
![Prompt Editor](../../images/prompt-editor.png)

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

The editor automatically detects variables like `{{customer_name}}`. Go to "Variables" in the left menu to:

- Set the **type** (string, number, boolean)
- Add a **default value**
- Mark as **required**

![Variable Editor](../../images/variable-editor.png)

## Step 4: Test Your Prompt (Optional)

1. Click the **Test with AI** button
2. In the test window:
    - Select your LLM provider (OpenAI, Anthropic, etc.)
    - Choose a model
    - Fill in the variable values
    - Click **Run**
3. See the AI response in real-time with streaming

> ℹ️ **Info:** You'll need to add your LLM API key on first test. You use your own settings for testing. We store your keys encrypted and don't have access to them.

## Step 5: Deploy to Production

Once your prompt is ready:

1. Click **Publish** to deploy
2. The version status changes to **Production**

Your prompt is now accessible via the API.

## Step 6: Get Your API Key

1. Go to [API Keys](https://xr2.uk/api-keys) in the sidebar
2. Click **+ New API Key**
3. Copy your **API Key** (starts with `xr2_prod_`)

## Step 7: Integrate Into Your App

Call the xR2 API to get your prompt:

```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "customer-support",
    "source_name": "web_app"
  }'
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
    "source_name": "web_app",
    "user_id": "user_123",
    "value": 99.99,
    "currency": "USD"
  }'
```

This links the conversion to your prompt for analytics.

## What's Next?

- [Prompt Editor](../prompts/overview.md) — Master the visual editor
- [Analytics](../analytics/overview.md) — Set up event tracking
- [A/B Testing](../ab-testing/overview.md) — Compare prompt versions
