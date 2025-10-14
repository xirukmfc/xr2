# xR2 Bubble.io Module (Users)

Helpers to call xR2 API from Bubble (via API Connector or plugin server-side action).

## What it does
- Get Prompt: Calls POST /api/v1/get-prompt and returns prompt content + trace_id.

## Setup (API Connector)
1. Create a new API called "xR2".
2. Add an API call:
   - Name: Get Prompt
   - Method: POST
   - URL: <fixed by publisher> `/api/v1/get-prompt`
   - Headers: `Authorization: Bearer <your API key>`, `Content-Type: application/json`
  - Body JSON: `{ "slug": "...", "version_number": 1, "status": "production" }`
3. Initialize the call.

## Setup (Plugin server-side action)
- Use the helper from this module (built to `dist`) and pass:
  - `apiKey`
  - `slug` (+ optional params: version_number, status)
  - Status values: `draft`, `testing`, `production`, `inactive`, `deprecated`

Note: The base URL is fixed by the publisher and not user-editable.

## Output
- Full prompt content including variables, model_config, and trace_id.
