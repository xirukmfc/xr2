# xR2 Slack Workflows Step (Users)

Use this Slack app to add a workflow step that fetches an xR2 prompt.

## What it does
- Workflow step "Get Prompt" that returns `trace_id` and `version_number` for further steps.

## Setup
1. Install the app to your Slack workspace (private or published app).
2. In Workflow Builder, add step: xR2 → Get Prompt.
3. Provide `Slug` (and optionally version_number, status: draft, testing, production, inactive, deprecated).

Note: The base URL and API key are configured by the app publisher. Users cannot change them.

## Output
- `trace_id`, `version_number` available to subsequent steps.
