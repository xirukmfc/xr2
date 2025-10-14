import json
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.analytics import PromptEvent, EventDefinition
from app.services.analytics import process_event
from app.services.redis import redis_client
from app.core.database import get_session as get_db


# Simple API key validation - replace with your actual auth system
def get_api_key():
    """Placeholder for API key validation"""
    return "valid"


router = APIRouter()


class EventRequest(BaseModel):
    trace_id: str = Field(..., description="Trace ID from prompt response")
    event_name: str = Field(..., description="Name of the event as defined in event definitions")
    category: str = Field(..., description="Event category")
    fields: Dict[str, Any] = Field(default_factory=dict, description="Event data fields (required and optional)")

    class Config:
        extra = "allow"  # Allow additional fields to be passed through




@router.post("/events")
async def track_event(
        event: EventRequest,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db)
):
    """
    Track a single event

    Required fields:
    - trace_id: Trace ID from prompt response
    - event_name: Name of the event as defined in event definitions
    - category: Event category
    - fields: Dynamic fields containing required and optional data

    Example request:
    {
        "trace_id": "evt_abc123_1634567890_xyz",
        "event_name": "user_signup",
        "category": "user_lifecycle",
        "fields": {
            "user_id": "user123",
            "source": "website"
        }
    }
    """

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
                EventDefinition.category == event.category,
                EventDefinition.is_active == True
            )
        )
        event_def = event_def.scalar_one_or_none()

        if not event_def:
            raise HTTPException(
                status_code=404,
                detail=f"Event definition not found for event_name='{event.event_name}' and category='{event.category}'"
            )

        # Validate required fields
        required_fields = event_def.required_fields or []
        for field_def in required_fields:
            field_name = field_def.get("name")
            if field_name not in event.fields:
                raise HTTPException(
                    status_code=400,
                    detail=f"Required field '{field_name}' is missing"
                )

        # Prepare event metadata
        event_metadata = {
            "event_name": event.event_name,
            "category": event.category,
            "fields": event.fields
        }

        # Check if event with this trace_id + event_name + category already exists
        existing_event = await db.execute(
            select(PromptEvent).where(
                PromptEvent.trace_id == event.trace_id,
                PromptEvent.event_metadata['event_name'].astext == event.event_name,
                PromptEvent.event_metadata['category'].astext == event.category
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
                session_id=event.fields.get("session_id"),
                user_id=event.fields.get("user_id"),
                event_metadata=event_metadata,
                business_metrics=event.fields.get("business_metrics"),
                error_details=None,
                created_at=datetime.now()
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
            "category": event.category,
            "timestamp": prompt_event.created_at.isoformat(),
            "is_duplicate": existing_event is not None
        }

    except Exception as e:
        import traceback
        print(f"Error in track_event: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


