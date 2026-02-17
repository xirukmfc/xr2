# xR2 SDK (Node.js)

Official Node.js SDK for xR2 - a platform for managing, testing, and analyzing AI prompts in production.

Website: https://xr2.uk/

## Installation

```bash
npm install xr2-sdk
```

## Quickstart

```ts
import { XR2Client } from "xr2-sdk";

const client = new XR2Client("YOUR_PRODUCT_API_KEY");

const keyResponse = await client.checkApiKey();
if (keyResponse.ok) {
  console.log(`API key valid for user: ${keyResponse.data.user}`);
}

const promptResponse = await client.getPrompt({ slug: "welcome" });
if (promptResponse.ok) {
  const prompt = promptResponse.data;
  console.log("trace_id:", prompt.trace_id);

  const eventResponse = await client.trackEvent({
    traceId: prompt.trace_id,
    eventName: "sign_up",
    userId: "user_123",
    metadata: {},
  });

  if (eventResponse.ok) {
    console.log("Event tracked:", eventResponse.data.event_id);
  }
}
```

## Configuration

- `baseUrl`: Override API base URL (default `https://xr2.uk` or `XR2_BASE_URL` env var)
- `timeoutMs`: Request timeout in ms (default 10000)
- `totalRetries`: Retry count for transient errors (default 3)
- `backoffFactor`: Exponential backoff base (default 0.5)
- `sourceName`: Source name for analytics (default `nodejs_sdk`)

Example:

```ts
const client = new XR2Client("YOUR_PRODUCT_API_KEY", {
  baseUrl: "https://your-xr2.com",
  timeoutMs: 15000,
  totalRetries: 2,
  sourceName: "my_backend",
});
```

## API Methods

### `checkApiKey()`

Validates API key and returns the associated username.

### `getPrompt()`

```ts
await client.getPrompt({
  slug: "welcome",
  versionNumber: 2,
  status: "production",
});
```

### `trackEvent()`

```ts
await client.trackEvent({
  traceId: "evt_...",
  eventName: "purchase_completed",
  userId: "user_123",
  value: 99.99,
  currency: "USD",
  metadata: { order_id: "order_67890" },
});
```

## Variable Rendering

When your prompt contains `{{variable}}` placeholders, use `renderPrompt()` to substitute them:

```ts
import { XR2Client, renderPrompt } from "xr2-sdk";

const client = new XR2Client("YOUR_PRODUCT_API_KEY");
const response = await client.getPrompt({ slug: "welcome" });
const prompt = response.data;

// Render variables into the prompt
const rendered = renderPrompt(prompt, {
  values: { customer_name: "Alice", language: "en" },
});

console.log(rendered.systemPrompt);   // Variables replaced
console.log(rendered.userPrompt);     // Variables replaced
console.log(rendered.traceId);        // Preserved from original prompt

// Use with OpenAI
import OpenAI from "openai";
const ai = new OpenAI();
const completion = await ai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: rendered.systemPrompt! },
    { role: "user", content: rendered.userPrompt! },
  ],
});
```

Missing required variables throw `VariableError`:

```ts
import { renderPrompt, VariableError } from "xr2-sdk";

try {
  const rendered = renderPrompt(prompt, { values: {} });
} catch (e) {
  if (e instanceof VariableError) {
    console.log(e.missingVariables); // ["customer_name"]
  }
}
```

### `renderPrompt()` Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `values` | object | `{}` | Variable values to substitute |
| `strict` | boolean | `true` | Throw `VariableError` on missing required variables |
| `useDefaults` | boolean | `true` | Apply default values from variable definitions |
| `arraySeparator` | string | — | Join arrays with this separator instead of JSON |

## Endpoints

- GET `/api/v1/check-api-key`
- POST `/api/v1/get-prompt`
- POST `/api/v1/events`
