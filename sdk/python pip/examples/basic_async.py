import asyncio
from xr2_sdk.client import AsyncxR2Client


async def main() -> None:
    client = AsyncxR2Client(api_key="YOUR_API_KEY")
    try:
        # 1. Check API key validity
        key_response = await client.check_api_key()
        if key_response.ok:
            print("API key valid for user:", key_response.data.user)
        else:
            print("Invalid API key:", key_response.error)
            return

        # 2. Get a prompt
        prompt = await client.get_prompt(slug="welcome")
        if not prompt.ok:
            print("Error getting prompt:", prompt.error)
            return
        print("Prompt version:", prompt.data.version_number)
        
        # Get a specific version
        prompt_v2 = await client.get_prompt(slug="welcome", version_number=2)

        # Get a prompt by status
        prompt_prod = await client.get_prompt(slug="welcome", status="production")

        # 3. Track an event with the trace_id from the prompt
        event_response = await client.track_event(
            trace_id=prompt.data.trace_id,
            event_name="cta_clicked",
            source_name="python_async_example",
            user_id="user_001",
            session_id="session_xyz",
            metadata={"button_text": "Get Started", "page": "homepage"},
        )

        if event_response.ok:
            print("Event recorded:", event_response.data.event_id)
        else:
            print("Error tracking event:", event_response.error)

        # Track a conversion event with value
        conversion_response = await client.track_event(
            trace_id=prompt.data.trace_id,
            event_name="subscription_started",
            source_name="python_async_example",
            user_id="user_001",
            value=29.99,
            currency="USD",
            metadata={"subscription_tier": "pro", "billing_period": "monthly"},
        )

        if conversion_response.ok:
            print("Conversion event recorded:", conversion_response.data.event_id)
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())


