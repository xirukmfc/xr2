# Publishing xR2 Zapier App

## Overview

Zapier apps can be published in two ways:
1. **Private App** - Only invited users can access (current state)
2. **Public App** - Listed in Zapier's App Directory (requires approval)

Your app is at: https://developer.zapier.com/app/234012/version/1.0.0/actions

---

## Option 1: Update Existing Private App

### Step 1: Build the App

```bash
cd /Users/pavelkuzko/Documents/channeler/xR2/sdk/zapier
npm install
npm run build
```

### Step 2: Login to Zapier CLI

```bash
zapier login
```

This will open a browser for authentication.

### Step 3: Link to Existing App

If you haven't linked yet:
```bash
zapier link
# Select your existing app from the list
```

### Step 4: Push New Version

```bash
zapier push
```

This uploads version 1.0.0 (from package.json).

### Step 5: Test the Actions

In Zapier Developer Platform UI:
1. Go to https://developer.zapier.com/app/234012
2. Create a test Zap
3. Test each action:
   - **Check API Key** - Should return `{ok: true, user: "..."}`
   - **Get Prompt** - With valid slug, should return prompt data
   - **Track Event** - With trace_id from Get Prompt, should return event_id

### Step 6: Promote Version

Once tested:
```bash
zapier promote 1.0.0
```

### Step 7: Invite Users

```bash
zapier users:add user@example.com 1.0.0
```

Or use the "Share" feature in the Developer Platform UI.

---

## Option 2: Submit for Public Listing

To make your app available in Zapier's public directory:

### Requirements

1. **App must work correctly** - All actions tested and functional
2. **Authentication must be secure** - Using API key properly
3. **Descriptive labels and help text** - Users can understand each field
4. **Sample data provided** - For each action
5. **Error handling** - Meaningful error messages

### Step 1: Prepare App Information

You'll need:
- **App Name**: xR2
- **Description**: AI prompt management platform with versioning, A/B testing, and analytics
- **Logo**: 256x256 PNG
- **Category**: Developer Tools / AI
- **Homepage**: https://xr2.uk
- **Support Email**: hello@xr2.uk
- **Documentation**: https://docs.xr2.uk/
- **Privacy Policy**: https://xr2.uk/privacy

### Step 2: Complete Publishing Checklist

In Zapier Developer Platform:
1. Go to your app
2. Click "Manage" → "Publishing"
3. Complete the publishing checklist:
   - [ ] App has at least 1 trigger OR 1 action
   - [ ] Authentication works correctly
   - [ ] All fields have labels and help text
   - [ ] Sample data is provided
   - [ ] App has been tested

### Step 3: Submit for Review

1. Click "Submit for Review"
2. Fill in required information
3. Wait for Zapier team review (usually 1-2 weeks)

### Step 4: After Approval

Once approved:
- App appears in Zapier App Directory
- Users can find and connect your app
- URL: `https://zapier.com/apps/xr2/integrations`

---

## Quick Commands Reference

```bash
# Install CLI
npm install -g zapier-platform-cli

# Login
zapier login

# Build
npm run build

# Push new version
zapier push

# Promote version
zapier promote 1.0.0

# List versions
zapier versions

# Add user to private app
zapier users:add user@example.com 1.0.0

# List users
zapier users:list

# View logs
zapier logs

# Run tests
zapier test
```

---

## Updating the App

When you need to update:

1. Make changes to `src/platform.ts`
2. Update version in `package.json`:
   - Bugfix: `1.0.0` → `1.0.1`
   - New feature: `1.0.0` → `1.1.0`
   - Breaking change: `1.0.0` → `2.0.0`
3. Build and push:
   ```bash
   npm run build
   zapier push
   ```
4. Test the new version
5. Promote when ready:
   ```bash
   zapier promote 1.1.0
   ```

---

## Checklist Before Publishing

### Code
- [ ] All 3 actions work: Check API Key, Get Prompt, Track Event
- [ ] `source_name: 'zapier_sdk'` is hardcoded in both actions
- [ ] Authentication uses `/api/v1/check-api-key`
- [ ] Error handling returns meaningful messages
- [ ] Sample data is accurate

### Documentation
- [ ] readme.md is up to date
- [ ] howtouse.md has clear instructions
- [ ] All fields have helpText

### Testing
- [ ] Tested with valid API key
- [ ] Tested Get Prompt with existing slug
- [ ] Tested Track Event with trace_id
- [ ] Tested error cases (invalid slug, invalid key)

---

## Support

- Zapier Platform Docs: https://platform.zapier.com/docs
- Zapier Developer Support: https://platform.zapier.com/contact
- xR2 Support: hello@xr2.uk
