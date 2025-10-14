# xR2 HubSpot Module (Maintainer Guide)

How to build, update, publish, and test the HubSpot helper module.

## 1) Configure Production Endpoint
- Edit `src/shared/config.ts` and set `BASE_URL` to your production API URL.

## 2) Build
```
cd sdk/hubspot
npm install
npm run build
```
Outputs will be in `dist/`.

## 3) Integrate with HubSpot
- Private app or custom code action: import the built helpers from `dist` into your deployment pipeline and reference them in code snippets.
- Alternatively, publish to npm and consume via package if your setup supports it.

## 4) Update
- Bump version in `package.json`.
- Rebuild and redeploy to your HubSpot environment.

## 5) Local Testing
- Write a small Node script calling `getPrompt`:
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
- 401 Unauthorized: check Product API Key.
- 404 Not Found: verify `slug` belongs to API key owner.
- 429 Rate limit: wait for reset.
