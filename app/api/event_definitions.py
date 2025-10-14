# app/api/internal/event_definitions.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.analytics import EventDefinition
from app.models.user import User
from app.core.database import get_session as get_db
from app.core.auth import get_current_user

class EventDefinitionRequest(BaseModel):
    event_name: str
    category: str
    description: str
    required_fields: List[Dict[str, Any]]
    optional_fields: List[Dict[str, Any]]
    validation_rules: Optional[List[Dict[str, Any]]] = None
    success_criteria: Optional[Dict[str, Any]] = None
    alert_thresholds: Optional[Dict[str, Any]] = None

router = APIRouter(prefix="/event-definitions", tags=["event-definitions"])


async def get_user_workspace(db: AsyncSession, user: User) -> UUID:
    """Get the workspace ID for a user (either as owner or member)"""
    from app.models.workspace import Workspace, workspace_members

    # Find workspace where user is owner
    q_owner = select(Workspace).where(Workspace.owner_id == user.id).order_by(Workspace.created_at.asc())
    res = await db.execute(q_owner)
    workspace: Optional[Workspace] = res.scalars().first()

    # If not owner, check if user is member
    if not workspace:
        q_member = (
            select(Workspace)
            .join(workspace_members, Workspace.id == workspace_members.c.workspace_id)
            .where(workspace_members.c.user_id == user.id)
            .order_by(Workspace.created_at.asc())
        )
        res = await db.execute(q_member)
        workspace = res.scalars().first()

    if not workspace:
        raise HTTPException(status_code=404, detail="No workspace found for this user")

    return workspace.id


@router.get("")
async def get_event_definitions(
        category: Optional[str] = None,
        active_only: bool = True,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get event definitions for current user's workspace"""
    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    # Get event definitions for this workspace
    query = select(EventDefinition).where(
        EventDefinition.workspace_id == workspace_id
    )

    if category:
        query = query.where(EventDefinition.category == category)

    if active_only:
        query = query.where(EventDefinition.is_active == True)

    result = await db.execute(query)
    definitions = result.scalars().all()

    return [
        {
            "id": str(definition.id),
            "event_name": definition.event_name,
            "category": definition.category,
            "description": definition.description,
            "required_fields": definition.required_fields,
            "optional_fields": definition.optional_fields,
            "validation_rules": definition.validation_rules,
            "success_criteria": definition.success_criteria,
            "alert_thresholds": definition.alert_thresholds,
            "is_active": definition.is_active,
            "created_at": definition.created_at.isoformat() if definition.created_at else None
        }
        for definition in definitions
    ]


@router.post("")
async def create_event_definition(
        request: EventDefinitionRequest,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new event definition in current user's workspace"""
    try:
        # Get user's workspace
        workspace_id = await get_user_workspace(db, current_user)
        print(f"[EVENT_DEF] Creating event definition for workspace: {workspace_id}")
        print(f"[EVENT_DEF] Request data: {request.dict()}")

        # Create new event definition
        definition = EventDefinition(
            workspace_id=workspace_id,
            event_name=request.event_name,
            category=request.category,
            description=request.description,
            required_fields=request.required_fields,
            optional_fields=request.optional_fields,
            validation_rules=request.validation_rules or [],
            success_criteria=request.success_criteria or {},
            alert_thresholds=request.alert_thresholds or {},
            is_active=True
        )

        db.add(definition)
        await db.commit()
        await db.refresh(definition)

        print(f"[EVENT_DEF] Created successfully: {definition.id}")

        return {
            "id": str(definition.id),
            "status": "created",
            "event_name": definition.event_name,
            "category": definition.category,
            "created_at": definition.created_at.isoformat() if definition.created_at else None
        }
    except Exception as e:
        import traceback
        print(f"[EVENT_DEF] Error creating event definition: {e}")
        print(f"[EVENT_DEF] Traceback: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating event definition: {str(e)}"
        )


class UpdateEventDefinitionRequest(BaseModel):
    event_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    required_fields: Optional[List[Dict[str, Any]]] = None
    optional_fields: Optional[List[Dict[str, Any]]] = None
    validation_rules: Optional[List[Dict[str, Any]]] = None
    success_criteria: Optional[Dict[str, Any]] = None
    alert_thresholds: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


@router.put("/{definition_id}")
async def update_event_definition(
        definition_id: UUID,
        request: UpdateEventDefinitionRequest,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update an event definition in current user's workspace"""
    print(f"PUT request received for event {definition_id}")
    print(f"Request data: {request.dict()}")

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    definition = await db.get(EventDefinition, definition_id)
    if not definition or definition.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Event definition not found")

    # Update fields if provided
    if request.event_name is not None:
        definition.event_name = request.event_name
    if request.category is not None:
        definition.category = request.category
    if request.description is not None:
        definition.description = request.description
    if request.required_fields is not None:
        definition.required_fields = request.required_fields
    if request.optional_fields is not None:
        definition.optional_fields = request.optional_fields
    if request.validation_rules is not None:
        definition.validation_rules = request.validation_rules
    if request.success_criteria is not None:
        definition.success_criteria = request.success_criteria
    if request.alert_thresholds is not None:
        definition.alert_thresholds = request.alert_thresholds
    if request.is_active is not None:
        definition.is_active = request.is_active

    await db.commit()
    await db.refresh(definition)

    return {"id": str(definition.id), "status": "updated"}


@router.delete("/{definition_id}")
async def delete_event_definition(
        definition_id: UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Delete an event definition from current user's workspace"""
    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    definition = await db.get(EventDefinition, definition_id)
    if not definition or definition.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Event definition not found")

    await db.delete(definition)
    await db.commit()

    return {"id": str(definition.id), "status": "deleted"}


@router.get("/test")
async def get_test_event_definitions(db: AsyncSession = Depends(get_db)):
    """Get event definitions for testing (no authentication)"""
    try:
        # Get first workspace from the database for testing
        from app.models.workspace import Workspace
        workspace_query = await db.execute(
            select(Workspace).limit(1)
        )
        workspace = workspace_query.scalar_one_or_none()

        if not workspace:
            return []

        # Get event definitions for this workspace
        result = await db.execute(
            select(EventDefinition).where(
                EventDefinition.workspace_id == workspace.id,
                EventDefinition.is_active == True
            )
        )
        definitions = result.scalars().all()

        return [
            {
                "id": str(definition.id),
                "event_name": definition.event_name,
                "category": definition.category,
                "description": definition.description,
                "required_fields": definition.required_fields,
                "optional_fields": definition.optional_fields,
                "validation_rules": definition.validation_rules,
                "success_criteria": definition.success_criteria,
                "alert_thresholds": definition.alert_thresholds,
                "is_active": definition.is_active,
                "created_at": definition.created_at.isoformat() if definition.created_at else None
            }
            for definition in definitions
        ]
    except Exception as e:
        return [
            { "id": "start", "event_name": "start", "category": "User Onboarding", "description": "User started onboarding" },
            { "id": "end", "event_name": "end", "category": "User Onboarding", "description": "User completed onboarding" },
            { "id": "buy", "event_name": "buy", "category": "User Onboarding", "description": "User made a purchase" }
        ]