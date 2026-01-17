---
icon: code-branch
---

# Versions & Deployment

xR2 uses a Git-like versioning system that lets you iterate on prompts safely while maintaining a stable production version.

## Version Lifecycle

Each version goes through these statuses:

```
Draft → Testing → Production → Deprecated
```

| Status | Meaning | API Access |
|--------|---------|------------|
| **Draft** | Work in progress | Not accessible |
| **Testing** | Ready for QA | Via `status: "testing"` param |
| **Production** | Live and active | Default response |
| **Inactive** | Paused | Via `status: "inactive"` param |
| **Deprecated** | Old version, replaced | Via `version_number` param |

## Creating Versions

### From Current Draft

1. Make your changes in the editor
2. Click **Create Version**
3. Add a version note (optional)
4. The version is saved with status **Draft**

### From Existing Version

1. Go to **Version History** in the left panel
2. Find the version you want to copy
3. Click **Create from this version**
4. A new draft is created with the same content

### Blank Version

1. Click **Create Version** → **Blank**
2. Start with empty prompts
3. Useful for major rewrites

## Version Numbers

Versions are numbered sequentially:
- v1, v2, v3...

The number is auto-assigned and cannot be changed.

## Deploying to Production

### Deploy a Version

1. Select the version in Version History
2. Click **Deploy to Production**
3. Confirm the deployment

**What happens:**
- Selected version status → **Production**
- Previous production version → **Deprecated**
- API now returns the new version by default

### One-Click Deploy

From the editor toolbar, click **Deploy** to deploy the currently viewed version instantly.

{% hint style="warning" %}
Deployment is immediate. There's no staging environment — the version goes live as soon as you click Deploy.
{% endhint %}

## Rollback

Made a mistake? Roll back in seconds:

1. Go to **Version History**
2. Find the previous working version
3. Click **Deploy to Production**

The old version is now live again.

## Comparing Versions

Compare any two versions side-by-side:

1. In Version History, select a version
2. Click **Compare**
3. Select the version to compare against
4. View the diff showing:
   - Added content (green)
   - Removed content (red)
   - Changed variables
   - Model config differences

## Version Details

Each version tracks:

| Field | Description |
|-------|-------------|
| **Version Number** | Sequential identifier (v1, v2...) |
| **Status** | Current lifecycle stage |
| **Created At** | When the version was created |
| **Created By** | Who created it |
| **Deployed At** | When it was deployed (if applicable) |
| **Deployed By** | Who deployed it |
| **Changelog** | Auto-generated change summary |

## Changelog

xR2 automatically generates changelogs when you create versions:

```
Version 3 - Created by john@company.com
- Updated system prompt: Added return policy instructions
- Modified variable: customer_tier (added default value)
- Removed variable: deprecated_field
```

## Performance Metrics per Version

Track how each version performs:

| Metric | Description |
|--------|-------------|
| **Requests** | Total API calls |
| **Avg Latency** | Response time in ms |
| **Avg Tokens** | Tokens per request |
| **Success Rate** | % of successful calls |
| **Conversions** | Linked event count |

Use these to compare version effectiveness.

## Best Practices

### 1. Version Before Big Changes

Always create a new version before:
- Major prompt rewrites
- Adding/removing variables
- Changing model configuration

### 2. Use Testing Status

Don't deploy directly to production:

```
Draft → Testing → Production
```

Test with the `status: "testing"` parameter in API calls.

### 3. Document Changes

Add descriptive notes when creating versions:
- "Added multilingual support"
- "Fixed tone issue with angry customers"
- "Optimized for GPT-4 Turbo"

### 4. Keep Production Stable

Avoid deploying during peak hours. Schedule deployments when traffic is low.

### 5. Monitor After Deploy

Check analytics for 15-30 minutes after deployment:
- Error rate spike?
- Latency increase?
- Conversion drop?

Roll back if metrics degrade.

## API Version Selection

By default, API returns the **Production** version. Override with parameters:

```bash
# Get production version (default)
curl -X POST .../get-prompt -d '{"slug": "support"}'

# Get specific version
curl -X POST .../get-prompt -d '{"slug": "support", "version_number": 2}'

# Get testing version
curl -X POST .../get-prompt -d '{"slug": "support", "status": "testing"}'
```

## Next Steps

- [Testing Prompts](testing.md) — Validate before deployment
- [A/B Testing](../ab-testing/overview.md) — Compare versions with real users
