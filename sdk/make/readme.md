# xR2 Make.com Module (Users)

This module lets you call xR2 API from Make.com scenarios.

## What it does
- Get Prompt: Calls POST /api/v1/get-prompt and returns prompt content + trace_id.

## Setup
1. Ensure the module is built and available to your Make.com account (private app or custom connector).
2. Configure the connection with your xR2 Product API Key.
3. Use the Get Prompt action in your scenario and provide:
   - slug
   - (optional) version_number, status (draft, testing, production, inactive, deprecated)

Note: The base URL is fixed by the module publisher and not user-editable.

## Output
- Full prompt content including variables, model_config, and trace_id for subsequent event tracking.
