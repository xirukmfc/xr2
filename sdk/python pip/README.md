# xR2 SDK (Python)

Official Python client for xR2 APIs.

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
    print(f"Prompt: {prompt.user_prompt}")

    # Track an event
    event_response = client.track_event(
        trace_id=prompt.trace_id,
        event_name="signup_success",
        source_name="web_app",
        user_id="user_123",
        metadata={"plan": "premium", "referral_code": "ABC123"},
    )

    if event_response.ok:
        print(f"Event tracked: {event_response.data.event_id}")

    # Track a purchase event with value
    purchase_response = client.track_event(
        trace_id=prompt.trace_id,
        event_name="purchase_completed",
        source_name="web_app",
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
    client = AsyncxR2Client(api_key="YOUR_KEY")
    try:
        # Check API key validity
        key_response = await client.check_api_key()
        if key_response.ok:
            print(f"API key valid for user: {key_response.data.user}")

        # Get prompt
        prompt_response = await client.get_prompt(slug="welcome")

        if prompt_response.ok:
            prompt = prompt_response.data

            # Track event
            event_response = await client.track_event(
                trace_id=prompt.trace_id,
                event_name="cta_clicked",
                source_name="mobile_app",
                user_id="user_001",
                session_id="session_xyz",
                metadata={"button_text": "Get Started", "page": "homepage"},
            )

            if event_response.ok:
                print(f"Event tracked: {event_response.data.event_id}")
    finally:
        await client.aclose()

asyncio.run(main())
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
- `event_name`: Event name as defined in dashboard (e.g., "signup_success", "purchase_completed")
- `source_name`: Source identifier (e.g., "web_app", "mobile_app", "john_doe")

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


