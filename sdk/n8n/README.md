# xR2 n8n Node (Users)

Use this n8n community node to fetch xR2 prompts and track events in your workflows.

## What it does
- **Get Prompt**: Calls POST /api/v1/get-prompt and returns prompt content + trace_id.
- **Track Event**: Calls POST /api/v1/events to send analytics events.

## Setup
1. Install the node in your n8n instance (community nodes).
2. Add xR2 credentials with your Product API Key.
3. Configure the node with:
   - slug
   - (optional) version_number, status (draft, testing, production, inactive, deprecated)

Note: The base URL is fixed by the publisher and not user-editable.

## Output
- Full prompt content including variables, model_config, and trace_id for subsequent event tracking.
