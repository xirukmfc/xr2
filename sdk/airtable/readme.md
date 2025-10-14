# xR2 Airtable Module (Users)

Use this helper to call xR2 API from Airtable (Scripting extension or Custom App).

## What it does
- Get Prompt: Calls POST /api/v1/get-prompt and returns prompt content + trace_id.
- Track Event: Calls POST /api/v1/events to send analytics events.

## Setup
1. Install or include the built helper (from `dist`) into your Airtable extension/app.
2. Store your xR2 Product API Key as a secret/config.
3. Call the `getPrompt` method with:
   - slug
   - (optional) version_number, status (draft, testing, production, inactive, deprecated)

4. Call the `trackEvent` method with:
   - trace_id
   - event_name
   - category
   - fields

Note: The base URL is fixed by the publisher and not user-editable.

## Output
- Full prompt content including variables, model_config, and trace_id.
