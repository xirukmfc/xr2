import asyncio
from xr2_sdk.client import AsyncxR2Client


async def main() -> None:
    client = AsyncxR2Client(api_key="YOUR_API_KEY")
    try:
        # Get a prompt
        prompt = await client.get_prompt(slug="welcome")
        print("Prompt version:", prompt.version_number)
        
        # Get a specific version
        prompt_v2 = await client.get_prompt(slug="welcome", version_number=2)
        
        # Get a prompt by status
        prompt_prod = await client.get_prompt(slug="welcome", status="production")
        
        event = await client.track_event(
            trace_id=prompt.trace_id,
            event_name="cta_clicked",
            category="engagement",
            fields={"user_id": "u-1"},
        )
        print("Event recorded:", event.event_id)
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())


