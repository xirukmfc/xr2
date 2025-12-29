from xr2_sdk.client import xR2Client


def main() -> None:
    client = xR2Client(api_key="YOUR_API_KEY")

    # 1. Check API key validity
    key_response = client.check_api_key()
    if key_response.ok:
        print("API key valid for user:", key_response.data.user)
    else:
        print("Invalid API key:", key_response.error)
        return

    # 2. Get a prompt
    prompt = client.get_prompt(slug="welcome")
    if not prompt.ok:
        print("Error getting prompt:", prompt.error)
        return
    print("Prompt version:", prompt.data.version_number)
    
    # Get a specific version
    prompt_v2 = client.get_prompt(slug="welcome", version_number=2)

    # Get a prompt by status
    prompt_prod = client.get_prompt(slug="welcome", status="production")

    # 3. Track an event with the trace_id from the prompt
    event_response = client.track_event(
        trace_id=prompt.data.trace_id,
        event_name="signup_success",
        source_name="python_sdk_example",
        user_id="user_123",
        metadata={"plan": "premium", "referral_code": "ABC123"},
    )

    if event_response.ok:
        print("Event recorded:", event_response.data.event_id)
    else:
        print("Error tracking event:", event_response.error)

    # Track a purchase event with value
    purchase_response = client.track_event(
        trace_id=prompt.data.trace_id,
        event_name="purchase_completed",
        source_name="python_sdk_example",
        user_id="user_123",
        value=99.99,
        currency="USD",
        metadata={"order_id": "order_67890", "product_id": "prod_456"},
    )

    if purchase_response.ok:
        print("Purchase event recorded:", purchase_response.data.event_id)


if __name__ == "__main__":
    main()


