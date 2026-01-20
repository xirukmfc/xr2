---
---

# Node.js SDK

Official Node.js SDK for xR2 with TypeScript support.

[![npm](https://img.shields.io/npm/v/xr2-sdk)](https://www.npmjs.com/package/xr2-sdk)

## Installation

```bash
npm install xr2-sdk
```

## Quickstart

```typescript
import { XR2Client } from "xr2-sdk";

const client = new XR2Client("YOUR_PRODUCT_API_KEY");

// Check API key
const keyResponse = await client.checkApiKey();
if (keyResponse.ok) {
  console.log(`API key valid for user: ${keyResponse.data.user}`);
}

// Get prompt
const promptResponse = await client.getPrompt({ slug: "welcome" });
if (promptResponse.ok) {
  const prompt = promptResponse.data;
  console.log("trace_id:", prompt.trace_id);

  // Track event
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

```typescript
const client = new XR2Client("YOUR_PRODUCT_API_KEY", {
  baseUrl: "https://xr2.uk",      // Override API URL
  timeoutMs: 15000,               // Request timeout
  totalRetries: 2,                // Retry count
  backoffFactor: 0.5,             // Exponential backoff
  sourceName: "my_backend",       // Source identifier
});
```

| Option | Description | Default |
|--------|-------------|---------|
| `baseUrl` | API base URL | `https://xr2.uk` |
| `timeoutMs` | Request timeout (ms) | 10000 |
| `totalRetries` | Retry count | 3 |
| `backoffFactor` | Backoff multiplier | 0.5 |
| `sourceName` | Analytics source | `nodejs_sdk` |

## API Methods

### `checkApiKey()`

Validates API key and returns the associated username.

```typescript
const response = await client.checkApiKey();
// { ok: true, data: { ok: true, user: "username" } }
```

### `getPrompt()`

Fetch a prompt by slug.

```typescript
const response = await client.getPrompt({
  slug: "welcome",
  versionNumber: 2,        // Optional: specific version
  status: "production",    // Optional: filter by status
});
```

**Response:**

```typescript
{
  ok: true,
  data: {
    slug: "welcome",
    version_number: 2,
    status: "production",
    system_prompt: "You are a helpful assistant",
    user_prompt: "Hello {{name}}",
    variables: [...],
    trace_id: "evt_xxx",
    model_config: { ... }
  }
}
```

### `trackEvent()`

Track an analytics event.

```typescript
const response = await client.trackEvent({
  traceId: "evt_xxx",           // Required
  eventName: "purchase",        // Required
  userId: "user_123",           // Optional
  sessionId: "session_456",     // Optional
  value: 99.99,                 // Optional: for revenue
  currency: "USD",              // Optional
  metadata: {                   // Optional: custom fields
    order_id: "order_67890"
  }
});
```

## TypeScript Types

The SDK exports all TypeScript types:

```typescript
import {
  XR2Client,
  PromptResponse,
  EventResponse,
  CheckApiKeyResponse
} from "xr2-sdk";
```

## Error Handling

```typescript
const response = await client.getPrompt({ slug: "unknown" });

if (response.ok) {
  console.log(response.data);
} else {
  console.error("Error:", response.error);
}
```

## Links

* npm: [https://www.npmjs.com/package/xr2-sdk](https://www.npmjs.com/package/xr2-sdk)
* GitHub: [https://github.com/channeler-ai/xr2-nodejs-sdk](https://github.com/channeler-ai/xr2-nodejs-sdk)
