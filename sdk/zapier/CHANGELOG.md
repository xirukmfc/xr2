## 1.3.0

Switch to z.request for better Zapier platform compatibility.

- Fix authentication to use z.request instead of axios
- Update all API calls to use native Zapier HTTP client

## 1.2.0

Fix module loading issue for Zapier platform.

- Fix entry point configuration for Zapier Lambda runtime

## 1.1.0

Major update with new actions and improved Track Event.

1. New action! create/check_api_key - Validate API key and get username
2. Update create/track_event - Added user_id, session_id, value, currency, metadata fields
3. Update create/get_prompt - Improved sample data and descriptions
4. Fix authentication to use /api/v1/check-api-key endpoint

## 1.0.0

Initial release with basic functionality.

- create/get_prompt - Fetch prompts by slug
- create/track_event - Basic event tracking
