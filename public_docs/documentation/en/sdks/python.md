
# Python SDK

Official Python SDK for xR2 with sync and async support.

[![PyPI](https://img.shields.io/pypi/v/xr2-sdk)](https://pypi.org/project/xr2-sdk/)

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
            print(f"trace_id: {prompt.trace_id}")

            # Track an event
            event_response = await client.track_event(
                trace_id=prompt.trace_id,
                event_name="sign_up",
                user_id="user_123",
            )
    finally:
        await client.aclose()

asyncio.run(main())
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `api_key` | Product API key | Required |
| `timeout` | Request timeout (seconds) | 10 |
| `total_retries` | Number of retries | 3 |
| `backoff_factor` | Exponential backoff | 0.5 |

## API Methods

### `check_api_key()`

Validate your API key and get the associated username.

**Returns:** `Response[CheckAPIKeyResponse]`

```python
response = client.check_api_key()
if response.ok:
    print(response.data.user)
```

### `get_prompt()`

Fetch a prompt by slug.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | str | Yes | Prompt identifier |
| `version_number` | int | No | Specific version |
| `status` | str | No | `draft`, `testing`, `production`, `inactive`, `deprecated` |

**Returns:** `Response[PromptContentResponse]`

```python
response = client.get_prompt(
    slug="welcome",
    version_number=2,
    status="production"
)
```

### `track_event()`

Track an analytics event.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `trace_id` | str | Yes | From get_prompt() response |
| `event_name` | str | Yes | Event name from dashboard |
| `user_id` | str | No | User identifier |
| `session_id` | str | No | Session identifier |
| `value` | float | No | Numeric value (revenue) |
| `currency` | str | No | Currency code |
| `metadata` | dict | No | Custom fields |

**Returns:** `Response[EventResponse]`

```python
response = client.track_event(
    trace_id=prompt.trace_id,
    event_name="purchase_completed",
    user_id="user_123",
    value=99.99,
    currency="USD",
    metadata={"order_id": "order_67890"}
)
```

### `prompt.render()`

Render a prompt template by replacing `{{variable}}` placeholders with values. Called on a `PromptContentResponse` object returned by `get_prompt()`.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `values` | dict | No | Variable values to substitute |
| `strict` | bool | No | Raise `VariableError` on missing required variables (default: `True`) |
| `use_defaults` | bool | No | Apply default values from variable definitions (default: `True`) |
| `array_separator` | str | No | Join arrays with this separator instead of JSON |

**Returns:** `RenderedPrompt`

- `system_prompt`, `user_prompt`, `assistant_prompt` — rendered text (or `None`)
- `trace_id` — preserved from the original prompt
- `variables_used` — dict of all resolved values including defaults

```python
from xr2_sdk import VariableError

response = client.get_prompt(slug="welcome")
prompt = response.data

# Render variables
rendered = prompt.render({"customer_name": "Alice"})
print(rendered.system_prompt)
print(rendered.variables_used)  # {"customer_name": "Alice", "language": "en"}

# Handle missing required variables
try:
    rendered = prompt.render({})
except VariableError as e:
    print(e.missing_variables)  # ["customer_name"]

# Non-strict mode: keep placeholders for missing vars
rendered = prompt.render({}, strict=False)
```

## Error Handling

```python
response = client.get_prompt(slug="unknown")

if response.ok:
    print(response.data)
else:
    print(f"Error: {response.error}")
```

## Links

* PyPI: [https://pypi.org/project/xr2-sdk/](https://pypi.org/project/xr2-sdk/)
* GitHub: [https://github.com/channeler-ai/xr2-python-sdk](https://github.com/channeler-ai/xr2-python-sdk)
