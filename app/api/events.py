import json
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.analytics import PromptEvent, EventDefinition
from app.services.analytics import process_event
from app.services.redis import redis_client
from app.core.database import get_session as get_db
from app.core.product_auth import get_product_api_key
from app.models.product_api_key import ProductAPIKey


router = APIRouter()


class EventRequest(BaseModel):
    trace_id: str = Field(..., description="Trace ID from GET /get-prompt response", examples=["evt_abc123_1634567890_xyz"])
    event_name: str = Field(..., description="Event name as defined in dashboard event definitions", examples=["user_signup"])
    source_name: str = Field(..., description="Source identifier for tracking where events come from", examples=["web_app", "mobile_app", "john_doe"])

    # Standard fields (optional)
    user_id: str | None = Field(None, description="User identifier")
    session_id: str | None = Field(None, description="Session identifier")
    value: float | None = Field(None, description="Numeric value for analytics (revenue, order amount, etc.)")
    currency: str | None = Field(None, description="Currency code (USD, EUR, etc.)")

    # Custom fields go in metadata
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Custom event fields as defined in event definition metadata_schema",
        examples=[{"product_id": "prod_123", "subscription_tier": "premium"}]
    )

    model_config = {
        "extra": "allow",
        "json_schema_extra": {
            "examples": [
                {
                    "trace_id": "evt_abc123_1634567890_xyz",
                    "event_name": "user_signup",
                    "source_name": "john_doe",
                    "user_id": "user_12345",
                    "metadata": {
                        "plan": "premium",
                        "referral_code": "ABC123"
                    }
                },
                {
                    "trace_id": "evt_abc123_1634567890_xyz",
                    "event_name": "purchase_completed",
                    "source_name": "web_app",
                    "user_id": "user_12345",
                    "value": 99.99,
                    "currency": "USD",
                    "metadata": {
                        "order_id": "order_67890",
                        "product_id": "prod_456",
                        "subscription_tier": "premium"
                    }
                }
            ]
        }
    }




@router.post(
    "/events",
    summary="Track Custom Events",
    description="""Track custom events to measure business outcomes and enable conversion funnel analytics.

**Authentication:** Requires API key in header `Authorization': Bearer xr2_prod_YOUR_API_KEY

**Workflow:**
1. Call POST /get-prompt and save the `trace_id`
2. When a business event occurs (signup, purchase, etc.), send it here with the saved `trace_id`
3. This links the event to the specific prompt, enabling analytics and A/B testing

**Event Definitions Required:**
Before tracking events, define them at https://xr2.uk/analytics/events
- Set event name, category, and required/optional fields
- Field validation happens automatically based on definitions

**Use Cases:**
- Conversion tracking (signups, purchases after AI interactions)
- A/B testing (measure which prompt variant performs better)
- Funnel analysis (identify drop-off points)
- ROI measurement (revenue per prompt)

**Important:**
- Events are processed asynchronously
- Duplicate events (same trace_id + event_name + category) are automatically deduplicated
- Events can be tracked up to 30 days after prompt retrieval
- Missing required fields will return 400 error
""",
    responses={
        200: {
            "description": "Event tracked successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "event_id": "evt_def456_1634567899_abc",
                        "trace_id": "evt_abc123_1634567890_xyz",
                        "message": "Event tracked successfully"
                    }
                }
            }
        },
        404: {"description": "Event definition not found - create it in dashboard first"},
        400: {"description": "Missing required fields or invalid data"},
        401: {"description": "Invalid or missing API key"}
    }
)
async def track_event(
        event: EventRequest,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        api_key: ProductAPIKey = Depends(get_product_api_key)
):
    """Track custom events for prompt analytics and conversion funnels"""

    try:
        # Get trace context from Redis
        trace_data = await redis_client.get(f"trace:{event.trace_id}")
        if not trace_data:
            # For testing purposes, create a dummy workspace_id
            # In production, this should be a real trace_id from prompt API
            workspace_id = UUID("b6fc15b6-9ee7-448a-ae2d-0ef6a624bda7")  # Test workspace
            prompt_id = None  # No prompt ID for standalone events
            prompt_version_id = None
        else:
            trace_context = json.loads(trace_data)
            workspace_id = UUID(trace_context["workspace_id"])
            prompt_id = UUID(trace_context["prompt_id"])
            prompt_version_id = UUID(trace_context.get("prompt_version_id")) if trace_context.get("prompt_version_id") else None

        # Validate against event definition
        event_def = await db.execute(
            select(EventDefinition).where(
                EventDefinition.workspace_id == workspace_id,
                EventDefinition.event_name == event.event_name,
                EventDefinition.is_active == True
            )
        )
        event_def = event_def.scalar_one_or_none()

        if not event_def:
            raise HTTPException(
                status_code=404,
                detail=f"Event definition not found for event_name='{event.event_name}'"
            )

        # Validate required metadata fields from schema
        metadata_schema = event_def.metadata_schema or []
        for field_def in metadata_schema:
            field_name = field_def.get("name")
            is_required = field_def.get("required", False)

            if is_required and field_name not in event.metadata:
                raise HTTPException(
                    status_code=400,
                    detail=f"Required metadata field '{field_name}' is missing"
                )

            # Type validation
            if field_name in event.metadata:
                field_value = event.metadata[field_name]
                field_type = field_def.get("type", "string")

                if field_type == "number" and not isinstance(field_value, (int, float)):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Field '{field_name}' should be a number"
                    )
                elif field_type == "boolean" and not isinstance(field_value, bool):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Field '{field_name}' should be a boolean"
                    )
                elif field_type == "string" and not isinstance(field_value, str):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Field '{field_name}' should be a string"
                    )

        # Prepare event metadata (includes both source info and custom metadata)
        event_metadata = {
            "event_name": event.event_name,
            "source_name": event.source_name,
            "metadata": event.metadata
        }

        # Prepare business metrics from standard fields
        business_metrics = {}
        if event.value is not None:
            business_metrics["value"] = event.value
        if event.currency is not None:
            business_metrics["currency"] = event.currency

        # Check if event with this trace_id + event_name already exists
        existing_event = await db.execute(
            select(PromptEvent).where(
                PromptEvent.trace_id == event.trace_id,
                PromptEvent.event_metadata['event_name'].astext == event.event_name
            )
        )
        existing_event = existing_event.scalar_one_or_none()

        if existing_event:
            # Return existing event instead of creating duplicate
            prompt_event = existing_event
        else:
            # Create new event record
            prompt_event = PromptEvent(
                workspace_id=workspace_id,
                trace_id=event.trace_id,
                prompt_id=prompt_id,
                prompt_version_id=prompt_version_id,
                event_type="custom_event",
                outcome="success",  # Default outcome for custom events
                session_id=event.session_id,
                user_id=event.user_id,
                event_metadata=event_metadata,
                business_metrics=business_metrics if business_metrics else None,
                error_details=None,
                created_at=datetime.now(timezone.utc)
            )

            db.add(prompt_event)
            await db.commit()

        # Process event asynchronously (aggregations, alerts, etc.)
        background_tasks.add_task(process_event, str(prompt_event.id), workspace_id)

        return {
            "status": "success",
            "event_id": str(prompt_event.id),
            "trace_id": event.trace_id,
            "event_name": event.event_name,
            "timestamp": prompt_event.created_at.isoformat(),
            "is_duplicate": existing_event is not None
        }

    except Exception as e:
        import traceback
        print(f"Error in track_event: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


