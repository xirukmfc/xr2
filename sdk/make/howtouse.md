# xR2 Make.com Module (Maintainer Guide)

This guide explains how to build, publish, update, and test the xR2 module for Make.com.

## 1) Configure Production Endpoint
- Edit `src/shared/config.ts` and set `BASE_URL` to your production API URL.

## 2) Build
```
cd sdk/make
npm install
npm run build
```
Outputs will be in `dist/`.

## 3) Publish / Distribute
- Private app: Use Make.com developer program tools to upload the built app (consult Make.com docs).
- NPM distribution (optional): `npm publish --access public` to share compiled SDK helpers if needed.

## 4) Update
- Bump version in `package.json`.
- Rebuild and republish per steps above.

## 5) Local Testing
- Create a small Node script that imports `getPrompt` and calls your API with a valid API key:
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
- Or wire it in a Make.com sandbox as a private app and run a scenario.

## 6) Troubleshooting
- 401 Unauthorized: verify Product API Key.
- 404 Not Found: check `slug` and API ownership; prompt must exist for API key owner.
- Rate limit 429: wait for reset or adjust usage.
