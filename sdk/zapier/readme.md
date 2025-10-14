# xR2 Zapier App (Users)

Use this app to fetch prompts from xR2 in your Zaps.

## What it does
- Get Prompt (Create action): Calls POST /api/v1/get-prompt; returns prompt content + trace_id.

## Setup
1. Install/connect the private Zapier app provided by the publisher.
2. Add an account using your xR2 Product API Key.
3. In your Zap, add the "Get Prompt" action and provide:
   - slug
   - (optional) version_number, status (draft, testing, production, inactive, deprecated)

Note: The base URL is fixed by the publisher and not user-editable.

## Output
- Full prompt content including variables, model_config, and trace_id for analytics/events.
