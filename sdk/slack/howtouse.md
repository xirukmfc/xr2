# xR2 Slack Workflows Step (Maintainer Guide)

How to configure, run, and deploy the Slack app.

## 1) Configure Production Endpoint and Keys
- Set `BASE_URL` in `src/shared/config.ts`.
- Provide env vars: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN`, `XR2_API_KEY`.

## 2) Build & Run Locally
```
cd sdk/slack
npm install
npm run build
XR2_API_KEY=... SLACK_BOT_TOKEN=x SLACK_SIGNING_SECRET=y SLACK_APP_TOKEN=z npm start
```
Use a Slack workspace and Workflow Builder to test the step.

## 3) Deploy
- Host on a server with public URL (or use Socket Mode setup).
- Configure Slack app event subscriptions if needed.
- Distribute as a private or published app per Slack App Directory guidelines.

## 4) Update
- Bump version in `package.json`.
- Rebuild and redeploy.

## 5) Troubleshooting
- Ensure required scopes for Workflow Steps are set in the Slack app config.
- Check network and env vars if the step fails to call the API.

