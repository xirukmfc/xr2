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

## Endpoints

- GET `/api/v1/check-api-key`
- POST `/api/v1/get-prompt`
- POST `/api/v1/events`
