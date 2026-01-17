from xr2_sdk.client import xR2Client

client = xR2Client(api_key="YOUR_API_KEY")

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
