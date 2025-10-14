# xR2 Bubble.io Module (Maintainer Guide)

How to build, update, and publish the Bubble helpers.

## 1) Configure Production Endpoint
- Set `BASE_URL` in `src/shared/config.ts` to your production API URL.

## 2) Build
```
cd sdk/bubble
npm install
npm run build
```
Outputs in `dist/`.

## 3) Use in Bubble
- API Connector: copy the fixed base URL and endpoint; instruct users to add API key header.
- Plugin: upload server-side action code or host the compiled helper and reference it.

## 4) Update
- Bump `package.json` version, rebuild, and update the Bubble setup (API Connector definition or plugin code).

## 5) Local Testing
```ts
import { getPrompt } from './dist/modules/getPrompt';
(async () => {
  const data = await getPrompt({ apiKey: process.env.XR2_API_KEY as string }, {
    slug: 'welcome',
    source_name: 'your_username',
  });
  console.log(data);
})();
```

## 6) Troubleshooting
- 401: Check API key.
- 404: Validate `slug` and ownership.
- 429: Rate limit hit.

