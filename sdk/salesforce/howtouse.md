# xR2 Salesforce Module (Maintainer Guide)

How to configure, build, integrate, and publish the Salesforce helper.

## 1) Configure Production Endpoint
- Set `BASE_URL` in `src/shared/config.ts` to your production API URL.

## 2) Build
```
cd sdk/salesforce
npm install
npm run build
```
Outputs in `dist/`.

## 3) Integration Patterns
- Apex Callout: wrap `getPrompt` behavior in Apex (using Named Credentials) to call xR2 and return JSON.
- LWC: call an Apex method that uses the above.
- Flows: create an Invocable Apex method that calls xR2 and returns fields you need.

## 4) Update
- Bump `package.json` version.
- Rebuild and redeploy your Apex/LWC/Flow assets as needed.

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
- 401: Check Product API Key stored in Salesforce.
- 404: Verify `slug` belongs to API key owner.
- 429: Respect rate limits.

