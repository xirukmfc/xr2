# Changelog

## [0.2.0] - 2025-12-06

### Added

- **New `check_api_key()` method** - Validate API key and get associated username
  - Available in both `xR2Client` (sync) and `AsyncxR2Client` (async)
  - Returns `Response[CheckAPIKeyResponse]` with `ok` and `user` fields
- New `CheckAPIKeyResponse` model for API key validation response
- `_get_with_retry()` helper for async GET requests with retry logic

### Updated

- Version bumped to 0.2.0
- Updated README with `check_api_key()` documentation and examples
- Updated examples in `basic_sync.py` and `basic_async.py`

---

## [0.1.0] - 2024-12-03

### Changed

#### Breaking Changes to `track_event()` method

The `track_event()` method signature has been updated to align with the latest xR2 API specification:

**Old signature (deprecated):**
```python
client.track_event(
    trace_id="...",
    event_name="...",
    category="...",      # REMOVED
    fields={...},        # RENAMED to metadata
)
```

**New signature:**
```python
client.track_event(
    trace_id="...",           # Required
    event_name="...",         # Required
    source_name="...",        # Required (NEW)
    user_id="...",           # Optional (NEW)
    session_id="...",        # Optional (NEW)
    value=99.99,             # Optional (NEW) - for revenue tracking
    currency="USD",          # Optional (NEW)
    metadata={...},          # Optional (renamed from fields)
)
```

**Key changes:**
1. **Removed:** `category` parameter - no longer used
2. **Renamed:** `fields` → `metadata` - better naming for custom event fields
3. **Added:** `source_name` (required) - identifies where events come from
4. **Added:** `user_id` (optional) - user identifier for tracking
5. **Added:** `session_id` (optional) - session identifier for analytics
6. **Added:** `value` (optional) - numeric value for revenue/business metrics
7. **Added:** `currency` (optional) - currency code (USD, EUR, etc.)

### Updated

- `EventRequest` model to match new API specification
- `EventResponse` model (removed `category` field)
- Both sync (`xR2Client`) and async (`AsyncxR2Client`) implementations
- Examples in `examples/basic_sync.py` and `examples/basic_async.py`
- README.md with comprehensive API documentation

### Migration Guide

If you're using the old `track_event()` method:

```python
# Old code
event = client.track_event(
    trace_id=trace_id,
    event_name="user_signup",
    category="user_lifecycle",
    fields={"user_id": "123", "plan": "premium"},
)

# New code
event = client.track_event(
    trace_id=trace_id,
    event_name="user_signup",
    source_name="web_app",  # Add this
    user_id="123",          # Extract from fields if needed
    metadata={"plan": "premium"},  # Rename fields to metadata
)
```

For revenue tracking events:

```python
# New purchase event with value tracking
event = client.track_event(
    trace_id=trace_id,
    event_name="purchase_completed",
    source_name="web_app",
    user_id="user_123",
    value=99.99,           # Monetary value
    currency="USD",        # Currency code
    metadata={
        "order_id": "order_67890",
        "product_id": "prod_456",
    },
)
```

### Requirements

Before tracking events, you must:
1. Define event names in the xR2 dashboard at https://xr2.uk/analytics/events
2. Set up required/optional fields in event definitions
3. Field validation happens automatically based on your definitions
