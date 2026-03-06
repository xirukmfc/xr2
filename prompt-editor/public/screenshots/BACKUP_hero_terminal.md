# Backup of the original hero terminal block (from app/[lang]/page.tsx)

This was the right side of the hero section — a 3D-tilting terminal showing
a GET /v1/prompts/welcome-email curl request and JSON response.

## Request shown:
```
curl -X GET https://api.xr2.uk/v1/prompts/welcome-email \
  -H "Authorization: Bearer sk_live_..."
```

## Response shown:
```json
{
  "slug": "welcome-email",
  "status": "production",
  "version": 1,
  "system_prompt": "You are a friendly onboarding...",
  "user_prompt": "Generate a welcome email for...",
  "variables": [
    { "name": "customer_name", "required": true },
    { "name": "plan_name", "default": "Pro" }
  ],
  "deployed_at": "2026-02-18T02:20:29Z",
  "trace_id": "evt_693fe538_857c675d"
}
```

The terminal had macOS-style window buttons (red/yellow/green dots),
3D tilt effect on mouse hover, and syntax-highlighted JSON.
