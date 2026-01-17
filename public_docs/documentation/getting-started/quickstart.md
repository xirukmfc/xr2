---
icon: bolt
---

# Quickstart

Get started with xR2 in 5 minutes. This guide walks you through setting up your first prompt and tracking events.

## Step 1: Create an Account

1. Go to [xr2.uk](https://xr2.uk)
2. Sign up with Google or email
3. Create your first workspace

## Step 2: Get Your API Key

1. Navigate to [API Keys](https://xr2.uk/api-keys)
2. Click **Create Keys**
3. Copy your **Product API Key** (starts with `xr2_prod_`)

{% hint style="warning" %}
Keep your API key secret. Never commit it to version control or expose it in client-side code.
{% endhint %}

## Step 3: Create Your First Prompt

1. Go to [Prompts](https://xr2.uk/prompts)
2. Click **Create Prompt**
3. Enter a **slug** (unique identifier, e.g., `welcome`)
4. Write your prompt content:
   * **System prompt**: Instructions for the AI
   * **User prompt**: Template with variables like `{{name}}`
5. Click **Save** and **Deploy**

## Step 4: Install an SDK

Choose your preferred SDK:

{% tabs %}
{% tab title="Python" %}
```bash
pip install xr2-sdk
```
{% endtab %}

{% tab title="Node.js" %}
```bash
npm install xr2-sdk
```
{% endtab %}

{% tab title="n8n" %}
1. Go to **Settings** → **Community Nodes**
2. Install `n8n-nodes-xr2`
{% endtab %}
{% endtabs %}

## Step 5: Fetch Your Prompt

{% tabs %}
{% tab title="Python" %}
```python
from xr2_sdk.client import xR2Client

client = xR2Client(api_key="xr2_prod_xxx")

response = client.get_prompt(slug="welcome")
if response.ok:
    print(response.data.user_prompt)
    print(response.data.trace_id)
```
{% endtab %}

{% tab title="Node.js" %}
```typescript
import { XR2Client } from "xr2-sdk";

const client = new XR2Client("xr2_prod_xxx");

const response = await client.getPrompt({ slug: "welcome" });
if (response.ok) {
  console.log(response.data.user_prompt);
  console.log(response.data.trace_id);
}
```
{% endtab %}
{% endtabs %}

## Step 6: Track an Event

Use the `trace_id` from the prompt response to track user actions:

{% tabs %}
{% tab title="Python" %}
```python
client.track_event(
    trace_id=response.data.trace_id,
    event_name="sign_up",
    user_id="user_123"
)
```
{% endtab %}

{% tab title="Node.js" %}
```typescript
await client.trackEvent({
  traceId: response.data.trace_id,
  eventName: "sign_up",
  userId: "user_123"
});
```
{% endtab %}
{% endtabs %}

## What's Next?

* [Authentication](authentication.md) — Learn about API keys and security
* [API Reference](api-reference.md) — Explore all endpoints
* [SDKs](../sdks/python.md) — Deep dive into SDK features
