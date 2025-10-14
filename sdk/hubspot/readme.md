# xR2 HubSpot Module (Users)

Helpers to call xR2 API from HubSpot (e.g., custom code in workflows or private app).

## What it does
- Get Prompt: Calls POST /api/v1/get-prompt and returns prompt content + trace_id.

## Setup
1. Ensure the module is available to your HubSpot (upload code assets or host as needed).
2. Configure usage with your xR2 Product API Key (store in secrets or env vars for custom code).
3. Use the helper in your custom code action with:
   - slug
   - (optional) version_number, status (draft, testing, production, inactive, deprecated)

Note: The base URL is fixed by the publisher and not user-editable.

## Output
- Full prompt content including variables, model_config, and trace_id.
