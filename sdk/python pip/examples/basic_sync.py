from xr2_sdk.client import xR2Client


def main() -> None:
    client = xR2Client(api_key="YOUR_API_KEY")
    
    # Get a prompt
    prompt = client.get_prompt(slug="welcome")
    print("Prompt version:", prompt.version_number)
    
    # Get a specific version
    prompt_v2 = client.get_prompt(slug="welcome", version_number=2)
    
    # Get a prompt by status
    prompt_prod = client.get_prompt(slug="welcome", status="production")
    
    event = client.track_event(
        trace_id=prompt.trace_id,
        event_name="signup_success",
        category="user_lifecycle",
        fields={"user_id": "123"},
    )
    print("Event recorded:", event.event_id)


if __name__ == "__main__":
    main()


