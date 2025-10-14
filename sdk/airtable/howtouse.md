# xR2 Airtable Module (Maintainer Guide)

How to build, update, publish, and test the Airtable helper.

## 1) Configure Production Endpoint
- Set `BASE_URL` in `src/shared/config.ts` to your production API URL.

## 2) Build
```
cd sdk/airtable
npm install
npm run build
```
Outputs in `dist/`.

## 3) Publish / Distribute
- Package the `dist` output with your Airtable extension (Scripting or Custom App) and publish via Airtable Marketplace submission.
- Follow Airtable Marketplace guidelines for app submission and updates.

## 4) Update
- Bump version in `package.json`.
- Rebuild and resubmit/update the marketplace listing or redeploy to your workspace.

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
- 401: Check Product API Key.
- 404: Verify `slug` belongs to API key owner.
- 429: Respect rate limits.

