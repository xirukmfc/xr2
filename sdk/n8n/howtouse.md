# n8n-nodes-xr2

Community node for n8n to integrate with xR2 API.

## Install (local n8n)

- Build this package:
```
cd sdk/n8n
npm install
npm run build
```
- Copy or symlink the `dist` folder into your n8n custom nodes directory or run `npm pack` and install the generated tgz via n8n UI.

## Credentials

Create credentials of type "xR2 API" and paste your Product API Key.

## Nodes

- XR2: Prompt → Get
  - Inputs: `slug`, `sourceName`, optional `versionNumber`, `status`
  - Output: JSON of PromptContentResponse including `trace_id`

## Configuration

Base URL is fixed inside the node at build time. Update `src/helpers/http.ts` `BASE_URL` before building to point to your production API.

## Publish / Update

These are community nodes; typically published to npm.

1) Set production base URL in `src/helpers/http.ts`.
2) Bump version in `package.json`.
3) Build and publish:
```
npm install
npm run build
npm publish --access public
```

To update, repeat with a new version.

## Test Locally

- Run n8n locally and install the built tgz:
```
npm pack
# in n8n UI → Settings → Community Nodes → Upload the generated .tgz
```
- Or place the `dist` into your n8n custom nodes directory and restart n8n.
