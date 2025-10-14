# xR2 Salesforce Module (Users)

Call xR2 API from Salesforce (Apex callout, LWC via Apex, or Flow via invocable Apex).

## What it does
- Get Prompt: Calls POST /api/v1/get-prompt and returns prompt content + trace_id.

## Setup
- Apex Named Credentials/Remote Site for outbound callouts.
- Store xR2 Product API Key securely (Named Credential secret or Custom Metadata/Settings).
- Use `getPrompt` from server-side (Apex) and expose to LWC or Flows as needed.

Inputs:
- slug
- (optional) version_number, status (draft, testing, production, inactive, deprecated)

Note: The base URL is fixed by the publisher and not user-editable.

## Output
- Full prompt content including variables, model_config, and trace_id.
