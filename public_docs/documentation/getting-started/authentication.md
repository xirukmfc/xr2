---
icon: key
---

# Authentication

All xR2 API requests require authentication using a Product API key.

## Getting Your API Key

1. Log in to [xr2.uk](https://xr2.uk)
2. Navigate to [API Keys](https://xr2.uk/api-keys)
3. Click **Create Keys**
4. Copy your **Product API Key**

Your key will look like: `xr2_prod_xxxxxxxxxxxxxxxx`

## Using Your API Key

### HTTP Header

All API requests must include the API key as a Bearer token:

```http
Authorization: Bearer xr2_prod_xxxxxxxxxxxxxxxx
```

### Example Request

```bash
curl -X GET https://xr2.uk/api/v1/check-api-key \
  -H "Authorization: Bearer xr2_prod_xxxxxxxxxxxxxxxx"
```

### SDK Configuration

{% tabs %}
{% tab title="Python" %}
```python
from xr2_sdk.client import xR2Client

client = xR2Client(api_key="xr2_prod_xxx")
```

Or use environment variable:

```python
import os
client = xR2Client(api_key=os.environ["XR2_API_KEY"])
```
{% endtab %}

{% tab title="Node.js" %}
```typescript
import { XR2Client } from "xr2-sdk";

const client = new XR2Client("xr2_prod_xxx");
```

Or use environment variable:

```typescript
const client = new XR2Client(process.env.XR2_API_KEY);
```
{% endtab %}
{% endtabs %}

## API Key Types

| Type | Prefix | Purpose |
|------|--------|---------|
| Product API Key | `xr2_prod_` | For production use in your applications |
| Management API Key | `xr2_mgmt_` | For managing prompts and settings (coming soon) |

## Security Best Practices

{% hint style="danger" %}
**Never expose your API key in:**
- Client-side JavaScript
- Public repositories
- Log files
- Error messages
{% endhint %}

### Recommended practices:

1. **Use environment variables** — Store keys in `.env` files (not committed to git)
2. **Rotate keys regularly** — Generate new keys periodically
3. **Use separate keys** — Different keys for development and production
4. **Monitor usage** — Check the dashboard for unusual activity

## Validating Your Key

Use the Check API Key endpoint to verify your key is working:

```bash
curl -X GET https://xr2.uk/api/v1/check-api-key \
  -H "Authorization: Bearer xr2_prod_xxx"
```

**Response:**

```json
{
  "ok": true,
  "user": "your_username"
}
```

## Troubleshooting

### 401 Unauthorized

* Check that the key is correct (no extra spaces)
* Verify the key starts with `xr2_prod_`
* Ensure the key is active in your dashboard

### 403 Forbidden

* The key may have been revoked
* Check your account status at [xr2.uk](https://xr2.uk)
