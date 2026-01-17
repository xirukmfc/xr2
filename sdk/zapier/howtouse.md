# xR2 Zapier App - Maintainer Guide

How to configure, build, and deploy the Zapier app.

## Prerequisites

- Node.js 18+
- npm
- Zapier CLI: `npm install -g zapier-platform-cli`
- Zapier developer account

## 1. Configure

The production endpoint is set in `src/shared/config.ts`:
```typescript
export const BASE_URL = 'https://xr2.uk';
```

## 2. Build

```bash
cd sdk/zapier
npm install
npm run build
```

Output files will be in `dist/`.

## 3. Deploy to Zapier Platform

### First time setup:

```bash
# Login to Zapier CLI
zapier login

# Register the app (first time only)
zapier register "xR2"

# Push the app
zapier push
```

### Update existing app:

```bash
# Bump version in package.json
# Then rebuild and push
npm run build
zapier push
```

## 4. Promote Version

After testing, promote to make it available to users:

```bash
zapier promote 1.0.0
```

## 5. Manage Users (Private App)

To invite users to your private app:

```bash
zapier users:add user@example.com 1.0.0
```

Or share the invite link from the Zapier Developer Platform UI.

## 6. Testing

### Local testing:

```bash
zapier test
```

### Manual testing:

1. Push the app to Zapier
2. Create a test Zap with xR2 actions
3. Test each action:
   - Check API Key
   - Get Prompt (with valid slug)
   - Track Event (with trace_id from Get Prompt)

## 7. Troubleshooting

### 401 Unauthorized
- Check API key is valid at https://xr2.uk/api-keys
- Ensure key starts with `xr2_prod_`

### 404 Not Found
- Verify prompt slug exists in your xR2 dashboard
- Check prompt has a published version

### 429 Rate Limited
- Respect rate limits
- Add delays between requests if needed

### Build errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npx tsc --noEmit`

## Project Structure

```
sdk/zapier/
├── src/
│   ├── index.ts           # Entry point
│   ├── platform.ts        # Actions and authentication
│   └── shared/
│       └── config.ts      # BASE_URL configuration
├── dist/                  # Build output
├── package.json           # v1.0.0
├── tsconfig.json
├── readme.md              # User documentation
├── howtouse.md            # This file
└── PUBLISHING.md          # Publishing instructions
```

## Source Name

All API requests include `source_name: 'zapier_sdk'` to identify traffic from Zapier integration.

## Support

- Zapier Platform Docs: https://platform.zapier.com/docs
- xR2 Support: hello@xr2.uk
