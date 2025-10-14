# xR2 Zapier App (Maintainer Guide)

How to configure, build, and deploy the Zapier app.

## 1) Configure Production Endpoint
- Set `BASE_URL` in `src/shared/config.ts` to your production API URL.

## 2) Build
```
cd sdk/zapier
npm install
npm run build
```
Outputs in `dist/`.

## 3) Deploy to Zapier Platform
- Use the Zapier CLI (or the online Platform UI) to create and upload a private app.
- With CLI:
```
npm install -g zapier-platform-cli
zapier login
zapier init
# Point or copy dist outputs, then:
zapier push
zapier promote
```
- Consult Zapier docs for detailed private app distribution steps.

## 4) Update
- Bump version in `package.json`.
- Rebuild and `zapier push` a new version; promote it when ready.

## 5) Local Testing
- Use `zapier test` if you add tests, or run a sample script against `dist` using Node + axios.
- Or install the private app to a test Zapier account and run a Zap.

## 6) Troubleshooting
- 401: Check API key.
- 404: Check `slug` ownership.
- 429: Respect rate limits.

