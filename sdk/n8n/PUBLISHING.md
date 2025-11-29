# Publishing Guide for n8n-nodes-xr2

This guide walks through the process of publishing the xR2 n8n community node to npm.

## Prerequisites

- [ ] npm account (create at https://www.npmjs.com/signup)
- [ ] Verified email address on npm
- [ ] npm CLI logged in (`npm login`)
- [ ] All tests passing
- [ ] Documentation complete

## Pre-Publishing Checklist

### 1. Verify Package Information

Check `package.json`:
- [ ] Package name is unique: `n8n-nodes-xr2`
- [ ] Version follows semver (e.g., `0.1.0` for first release)
- [ ] License is set (`MIT`)
- [ ] Repository URL is correct
- [ ] Keywords include `n8n-community-node`
- [ ] Main entry points are correct (`dist/index.js`)

### 2. Test the Build

```bash
# Clean previous builds
npm run clean

# Install dependencies
npm install

# Build the package
npm run build

# Verify dist/ contains all necessary files
ls -la dist/
```

Expected files in `dist/`:
- `index.js` and `index.d.ts`
- `credentials/XR2Api.credentials.js` and `.d.ts`
- `nodes/XR2/XR2.node.js` and `.d.ts`
- `helpers/http.js` and `.d.ts`

### 3. Test Installation Locally

```bash
# Pack the package locally
npm pack

# This creates n8n-nodes-xr2-0.1.0.tgz

# Test installation
cd ~/test-n8n
npm install /path/to/n8n-nodes-xr2-0.1.0.tgz
```

### 4. Verify in n8n

Follow the testing guide in [TESTING.md](./TESTING.md) to ensure:
- [ ] Node appears in n8n
- [ ] Credentials work
- [ ] Get Prompt operation works
- [ ] Track Event operation works

### 5. Review Documentation

- [ ] README.md is complete and accurate
- [ ] TESTING.md has clear instructions
- [ ] Code comments are helpful
- [ ] Examples are working

## Publishing Steps

### Step 1: Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### Step 2: Verify Package Contents

```bash
# Dry run to see what will be published
npm publish --dry-run
```

Review the output to ensure only necessary files are included.

### Step 3: Publish to npm

For first release:
```bash
npm publish
```

For subsequent releases (update version first):
```bash
# Update version in package.json (or use npm version)
npm version patch  # for bug fixes (0.1.0 -> 0.1.1)
npm version minor  # for new features (0.1.0 -> 0.2.0)
npm version major  # for breaking changes (0.1.0 -> 1.0.0)

# Publish
npm publish
```

### Step 4: Verify on npm

1. Check the package page: https://www.npmjs.com/package/n8n-nodes-xr2
2. Verify all files are present
3. Check that README renders correctly

### Step 5: Test Installation from npm

```bash
# In a fresh directory
npm install n8n-nodes-xr2

# Verify installation
ls node_modules/n8n-nodes-xr2/dist/
```

## Post-Publishing

### 1. Tag the Release on GitHub

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

### 2. Create GitHub Release

1. Go to repository on GitHub
2. Click "Releases" → "Create a new release"
3. Select the tag you just created
4. Add release notes describing:
   - New features
   - Bug fixes
   - Breaking changes (if any)

### 3. Update Documentation

Update any external documentation to reference the npm package:
- xR2 website
- Integration guides
- Blog posts

### 4. Announce

Consider announcing on:
- n8n community forum
- xR2 social media
- Documentation changelog

## Updating the Package

For future updates:

### Bug Fixes (Patch)
```bash
# 1. Fix the bug
# 2. Test thoroughly
# 3. Update version
npm version patch

# 4. Publish
npm publish

# 5. Push git tags
git push && git push --tags
```

### New Features (Minor)
```bash
# 1. Implement feature
# 2. Update documentation
# 3. Update version
npm version minor

# 4. Publish
npm publish

# 5. Push git tags
git push && git push --tags
```

### Breaking Changes (Major)
```bash
# 1. Implement changes
# 2. Update documentation with migration guide
# 3. Update version
npm version major

# 4. Publish
npm publish

# 5. Push git tags
git push && git push --tags
```

## Troubleshooting

### "Package name already exists"

If someone already published `n8n-nodes-xr2`:
1. Check if it's your organization's package
2. If not, consider a different name like `@yourorg/n8n-nodes-xr2`
3. Update package.json with the new name

### "Authentication failed"

```bash
# Re-login to npm
npm logout
npm login
```

### "Version already published"

You cannot overwrite published versions. Update the version:
```bash
npm version patch
npm publish
```

### Build fails before publish

The `prepublishOnly` script runs automatically before publishing. If it fails:
```bash
# Fix any TypeScript errors
npm run build

# Then retry
npm publish
```

## Security Best Practices

- [ ] Never commit API keys or secrets
- [ ] Review all files before publishing (`npm publish --dry-run`)
- [ ] Use `.npmignore` to exclude sensitive files
- [ ] Enable 2FA on your npm account
- [ ] Use scoped packages for private code

## Version Strategy

We use semantic versioning (semver):

- **MAJOR** (1.0.0): Breaking changes
  - API changes that break existing workflows
  - Removed features
  - Changed default behavior

- **MINOR** (0.1.0): New features
  - New operations or parameters
  - New functionality (backwards compatible)

- **PATCH** (0.0.1): Bug fixes
  - Bug fixes
  - Documentation updates
  - Performance improvements

## npm Package URLs

After publishing:
- Package page: https://www.npmjs.com/package/n8n-nodes-xr2
- Badge: `[![npm version](https://badge.fury.io/js/n8n-nodes-xr2.svg)](https://badge.fury.io/js/n8n-nodes-xr2)`

## Quick Reference

```bash
# Login
npm login

# Test locally
npm pack
npm install ./n8n-nodes-xr2-0.1.0.tgz

# Publish
npm publish

# Update version
npm version [patch|minor|major]

# View package info
npm info n8n-nodes-xr2
```

## n8n Community Node Requirements

n8n has specific requirements for community nodes:

✅ **Required:**
- `package.json` must have `n8n-community-node` in keywords
- Must export nodes in format n8n expects
- Credentials must implement `ICredentialType`
- Nodes must implement `INodeType`

✅ **Recommended:**
- Clear documentation
- Examples
- Icon file (SVG)
- Proper error handling

See: https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/

## Support

If you encounter issues:
1. Check [n8n community forum](https://community.n8n.io)
2. Review [n8n docs](https://docs.n8n.io)
3. Open an issue on GitHub
