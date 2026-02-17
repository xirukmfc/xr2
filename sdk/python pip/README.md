# xR2 SDK (Python)

Official Python SDK for [xR2](https://xr2.uk/) — a platform for managing, testing, and analyzing AI prompts in production. Use it to ship prompt changes safely with experiments, track performance and user journeys, and integrate via API/SDKs.

Website: https://xr2.uk/

## What is xR2?

xR2 helps you manage, version, and optimize prompts for your AI-powered applications:

- **Prompt Management** — Store and organize all your prompts in one place
- **Version Control** — Track changes, test different versions, and roll back when needed
- **A/B Testing** — Run experiments to find the best performing prompts
- **Analytics** — Track events and measure the impact of your prompts on user behavior

## Installation

```bash
pip install xr2-sdk
```

## Quickstart (Sync)

```python
from xr2_sdk.client import xR2Client

client = xR2Client(api_key="YOUR_PRODUCT_API_KEY")

# Check API key validity
key_response = client.check_api_key()
if key_response.ok:
    print(f"API key valid for user: {key_response.data.user}")

# Get prompt
prompt_response = client.get_prompt(slug="welcome")

if prompt_response.ok:
    prompt = prompt_response.data
    print(f"slug: {prompt.slug}")
    print(f"version_number: {prompt.version_number}")
    print(f"system_prompt: {prompt.system_prompt}")
    print(f"user_prompt: {prompt.user_prompt}")
    print(f"variables: {prompt.variables}")
    print(f"trace_id: {prompt.trace_id}")

    # Track an event
    event_response = client.track_event(
        trace_id=prompt.trace_id,
        event_name="sign_up",
        user_id="user_123",
        metadata={},
    )

    if event_response.ok:
        print(f"Event tracked: {event_response.data.event_id}")

    # Track a purchase event with value
    purchase_response = client.track_event(
        trace_id=prompt.trace_id,
        event_name="purchase_completed",
        user_id="user_123",
        value=99.99,
        currency="USD",
        metadata={"order_id": "order_67890", "product_id": "prod_456"},
    )
```

## Quickstart (Async)

```python
import asyncio
from xr2_sdk.client import AsyncxR2Client

async def main():
    client = AsyncxR2Client(api_key="YOUR_PRODUCT_API_KEY")
    try:
        # Check API key validity
        key_response = await client.check_api_key()
        if key_response.ok:
            print(f"API key valid for user: {key_response.data.user}")

        # Get prompt
        prompt_response = await client.get_prompt(slug="welcome")

        if prompt_response.ok:
            prompt = prompt_response.data
            print(f"slug: {prompt.slug}")
            print(f"version_number: {prompt.version_number}")
            print(f"system_prompt: {prompt.system_prompt}")
            print(f"user_prompt: {prompt.user_prompt}")
            print(f"variables: {prompt.variables}")
            print(f"trace_id: {prompt.trace_id}")

            # Track an event
            event_response = await client.track_event(
                trace_id=prompt.trace_id,
                event_name="sign_up",
                user_id="user_123",
                metadata={},
            )

            if event_response.ok:
                print(f"Event tracked: {event_response.data.event_id}")

            # Track a purchase event with value
            purchase_response = await client.track_event(
                trace_id=prompt.trace_id,
                event_name="purchase_completed",
                user_id="user_123",
                value=99.99,
                currency="USD",
                metadata={"order_id": "order_67890", "product_id": "prod_456"},
            )
    finally:
        await client.aclose()

asyncio.run(main())
```

## Variable Rendering

When your prompt contains `{{variable}}` placeholders, use `render()` to substitute them:

```python
response = client.get_prompt(slug="welcome")
prompt = response.data

# Render variables into the prompt
rendered = prompt.render({"customer_name": "Alice", "language": "en"})

print(rendered.system_prompt)   # Variables replaced
print(rendered.user_prompt)     # Variables replaced
print(rendered.trace_id)        # Preserved from original prompt

# Use with OpenAI
from openai import OpenAI
ai = OpenAI()
completion = ai.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": rendered.system_prompt},
        {"role": "user", "content": rendered.user_prompt},
    ],
)
```

Missing required variables raise `VariableError`:

```python
from xr2_sdk import VariableError

try:
    rendered = prompt.render({})  # missing required vars
except VariableError as e:
    print(e.missing_variables)    # ["customer_name"]
```

## Endpoints

- GET `/api/v1/check-api-key` → validates API key and returns username
- POST `/api/v1/get-prompt` → returns prompt content and `trace_id`
- POST `/api/v1/events` → records an event associated with `trace_id`

## Configuration

- `api_key`: Product API key (sent as `Authorization: Bearer <key>`)
- `timeout`: Request timeout (seconds)
- `total_retries`, `backoff_factor`: Retry policy (sync) / lightweight retry (async)

## API Methods

### `check_api_key()`

Validate your API key and get the associated username.

**Parameters:** None

**Returns:** `Response[CheckAPIKeyResponse]`
- `response.data.ok`: Always `True` if valid
- `response.data.user`: Username of the API key owner

### `get_prompt()`

**Parameters:**
- `slug` (required): The prompt slug identifier
- `version_number` (optional): Specific version number to fetch
- `status` (optional): Version status filter - `draft`, `testing`, `production`, `inactive`, `deprecated`

**Returns:** `Response[PromptContentResponse]`
- Access data: `response.data.trace_id`, `response.data.user_prompt`, etc.
- Check success: `if response.ok:`

### `track_event()`

**Required Parameters:**
- `trace_id`: Trace ID from `get_prompt()` response
- `event_name`: Event name as defined in dashboard (e.g., "sign_up", "purchase_completed")

**Optional Parameters:**
- `user_id`: User identifier for tracking
- `session_id`: Session identifier for analytics
- `value`: Numeric value (for revenue tracking, order amounts, etc.)
- `currency`: Currency code (e.g., "USD", "EUR")
- `metadata`: Dictionary of custom fields as defined in event definition schema

**Returns:** `Response[EventResponse]`
- Access data: `response.data.event_id`, `response.data.timestamp`, etc.
- Check success: `if response.ok:`

**Important Notes:**
- Before tracking events, define them at https://xr2.uk/analytics/events
- Set event name and required/optional fields in the dashboard
- Field validation happens automatically based on your event definitions
- Events are deduplicated by `trace_id` + `event_name`

### `prompt.render()`

Render a prompt template by replacing variable placeholders with values. Called on a `PromptContentResponse` object returned by `get_prompt()`.

**Parameters:**
- `values` (dict, optional): Variable values to substitute
- `strict` (bool): Raise `VariableError` on missing required variables (default: `True`)
- `use_defaults` (bool): Apply default values from variable definitions (default: `True`)
- `array_separator` (str, optional): Join arrays with this separator instead of JSON

**Returns:** `RenderedPrompt`
- `system_prompt`, `user_prompt`, `assistant_prompt`: Rendered text (or `None`)
- `trace_id`: Preserved from the original prompt
- `variables_used`: Dict of all resolved variable values (including defaults)

## Links

- Website: https://xr2.uk/
- Documentation: https://xr2.uk/docs
