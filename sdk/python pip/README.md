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

prompt = client.get_prompt(slug="welcome")

# Send an event
event = client.track_event(
    trace_id=prompt.trace_id,
    event_name="signup_success",
    category="user_lifecycle",
    fields={"user_id": "123", "source": "web"},
)
```

## Quickstart (Async)

```python
import asyncio
from xr2_sdk.client import AsyncxR2Client

async def main():
    client = AsyncxR2Client(api_key="YOUR_KEY")
    try:
        prompt = await client.get_prompt(slug="welcome")
        event = await client.track_event(
            trace_id=prompt.trace_id,
            event_name="cta_clicked",
            category="engagement",
            fields={"user_id": "u-1"},
        )
    finally:
        await client.aclose()

asyncio.run(main())
```

## Endpoints

- POST `/api/v1/get-prompt` → returns prompt content and `trace_id`
- POST `/api/v1/events` → records an event associated with `trace_id`

## Configuration

- `api_key`: Product API key (sent as `Authorization: Bearer <key>`)
- `timeout`: Request timeout (seconds)
- `total_retries`, `backoff_factor`: Retry policy (sync) / lightweight retry (async)

## Optional Parameters

For `get_prompt()`:
- `version_number`: Specific version number to fetch
- `status`: Version status filter - `draft`, `testing`, `production`, `inactive`, `deprecated`


