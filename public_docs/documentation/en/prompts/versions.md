
# Versions & Deployment

xR2 uses a Git-like versioning system that lets you iterate on prompts safely while maintaining a stable production version.

## Version Lifecycle

Each version goes through these statuses:

```
Draft → Production → Inactive
```

| Status | Meaning | API Access |
|--------|---------|------------|
| **Draft** | Work in progress | Not accessible |
| **Production** | Live and active | Default response |
| **Inactive** | Paused | Via `status: "inactive"` param |

## Creating Versions

### Copy Current Version

1. Go to **Version History** in the left panel
2. Click **New version**
3. Select **Start from scratch**
4. A new draft is created with empty content

### From Existing Version

1. Go to **Version History** in the left panel
2. Find the version you want to copy and navigate to it
3. Click **New version**
4. Select **Copy current version**
5. A new draft is created with the same content


## Version Numbers

Versions are numbered sequentially:

- v1, v2, v3...

The number is auto-assigned and cannot be changed.

## Deploying to Production

### Deploy a Version

1. Select the version in Version History
2. Click **Publish**

**What happens:**

- Selected version status → **Production**
- Previous production version → **Inactive**
- API now returns the new version by default

### One-Click Deploy

From the editor toolbar, click **Deploy** to deploy the currently viewed version instantly.

> ⚠️ **Warning:** Deployment is immediate. There's no staging environment — the version goes live as soon as you click Deploy.

## Rollback

Made a mistake? Roll back in seconds:

1. Go to **Version History**
2. Find the previous working version
3. Click **Publish**

The old version is now live again.

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

xR2 tracks changes when you update versions. The changelog field stores what changed:

- Status transitions (draft → testing → production)
- Variable configuration updates
- Model configuration changes
- Prompt content modifications (system, user, assistant)


## Performance Metrics per Version

Track how each version performs:

| Metric           | Description                              |
|------------------|------------------------------------------|
| **Requests**     | Total API calls                          |
| **Source name**  | Where version was requested most often   |
| **Avg Latency**  | Response time in ms                      |
| **Avg Tokens**   | Tokens per request                       |
| **Success Rate** | % of successful calls                    |
| **Conversions**  | Linked event count                       |

Use these to compare version effectiveness.

## Best Practices

### 1. Version Before Big Changes

Always create a new version before:

- Major prompt rewrites
- Adding/removing variables
- Changing model configuration

### 2. Use Draft Status or A/B Testing

1. You can specify the version number when requesting a prompt. This way you don't need to publish it. This allows you to do targeted tests
2. You can also add a new version and run A/B Testing with the production version and a new version in Draft status. In this case, all requests will be split 50/50 between 2 versions by default, and you can measure effectiveness and choose the best one.

Test with the `status: "draft"` parameter in API calls.

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
curl -X POST .../get-prompt -d '{"slug": "support", "source_name": "app"}'

# Get specific version
curl -X POST .../get-prompt -d '{"slug": "support", "source_name": "app", "version_number": 2}'

# Get testing version
curl -X POST .../get-prompt -d '{"slug": "support", "source_name": "app", "status": "testing"}'
```

## Next Steps

- [Testing Prompts](testing.md) — Validate before deployment
- [A/B Testing](../ab-testing/overview.md) — Compare versions with real users
