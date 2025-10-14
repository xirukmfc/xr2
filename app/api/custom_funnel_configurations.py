from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.analytics import CustomFunnelConfiguration
from app.models.user import User
from app.core.database import get_session as get_db
from app.core.auth import get_current_user

router = APIRouter(prefix="/custom-funnel-configurations", tags=["custom-funnel-configurations"])


async def get_user_workspace(db: AsyncSession, user: User) -> UUID:
    """Get the workspace ID for a user (either as owner or member)"""
    from app.models.workspace import Workspace, workspace_members
    from typing import Optional

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
        raise HTTPException(404, "User has no workspace")

    return workspace.id


# Pydantic models
class CustomFunnelConfigurationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_steps: List[str] = Field(..., min_items=2, max_items=20)


class CustomFunnelConfigurationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_steps: Optional[List[str]] = Field(None, min_items=2, max_items=20)
    is_active: Optional[bool] = None


class CustomFunnelConfigurationResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    event_steps: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


# Test endpoints (no authentication required)
@router.get("/test")
async def get_test_custom_funnel_configurations(db: AsyncSession = Depends(get_db)):
    """Get custom funnel configurations for testing (no authentication)"""
    try:
        # Get first real workspace_id from the database
        from app.models.analytics import PromptEvent
        workspace_query = await db.execute(
            select(PromptEvent.workspace_id).limit(1)
        )
        workspace_row = workspace_query.first()

        if not workspace_row:
            return []

        workspace_id = workspace_row.workspace_id

        # Get all custom funnel configurations for this workspace
        result = await db.execute(
            select(CustomFunnelConfiguration).where(
                CustomFunnelConfiguration.workspace_id == workspace_id
            ).order_by(CustomFunnelConfiguration.name)
        )
        configurations = result.scalars().all()

        return [
            {
                "id": str(config.id),
                "name": config.name,
                "description": config.description,
                "event_steps": config.event_steps,
                "is_active": config.is_active,
                "created_at": config.created_at.isoformat(),
                "updated_at": config.updated_at.isoformat()
            }
            for config in configurations
        ]
    except Exception as e:
        return [{"error": str(e)}]


@router.post("/test", response_model=CustomFunnelConfigurationResponse)
async def create_test_custom_funnel_configuration(
    config_data: CustomFunnelConfigurationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new custom funnel configuration for testing (no authentication)"""
    try:
        # Get first real workspace_id from the database
        from app.models.analytics import PromptEvent
        workspace_query = await db.execute(
            select(PromptEvent.workspace_id).limit(1)
        )
        workspace_row = workspace_query.first()

        if not workspace_row:
            raise HTTPException(404, "No workspace found")

        workspace_id = workspace_row.workspace_id

        # Check name uniqueness
        existing = await db.execute(
            select(CustomFunnelConfiguration).where(
                CustomFunnelConfiguration.workspace_id == workspace_id,
                CustomFunnelConfiguration.name == config_data.name
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(400, f"Custom funnel configuration with name '{config_data.name}' already exists")

        # Create configuration
        config = CustomFunnelConfiguration(
            workspace_id=workspace_id,
            created_by=None,  # No user for test endpoint
            **config_data.dict()
        )

        db.add(config)
        await db.commit()
        await db.refresh(config)

        return CustomFunnelConfigurationResponse(
            id=config.id,
            name=config.name,
            description=config.description,
            event_steps=config.event_steps,
            is_active=config.is_active,
            created_at=config.created_at,
            updated_at=config.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to create custom funnel configuration: {str(e)}")


@router.delete("/test/{config_id}")
async def delete_test_custom_funnel_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom funnel configuration for testing (no authentication)"""
    try:
        # Get first real workspace_id from the database
        from app.models.analytics import PromptEvent
        workspace_query = await db.execute(
            select(PromptEvent.workspace_id).limit(1)
        )
        workspace_row = workspace_query.first()

        if not workspace_row:
            raise HTTPException(404, "No workspace found")

        workspace_id = workspace_row.workspace_id

        # Find and delete the configuration
        result = await db.execute(
            select(CustomFunnelConfiguration).where(
                CustomFunnelConfiguration.id == config_id,
                CustomFunnelConfiguration.workspace_id == workspace_id
            )
        )
        config = result.scalar_one_or_none()

        if not config:
            raise HTTPException(404, "Custom funnel configuration not found")

        await db.delete(config)
        await db.commit()

        return {"message": "Custom funnel configuration deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete custom funnel configuration: {str(e)}")


# Authenticated endpoints
@router.post("/", response_model=CustomFunnelConfigurationResponse)
async def create_custom_funnel_configuration(
    config_data: CustomFunnelConfigurationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new custom funnel configuration"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    # Check name uniqueness
    existing = await db.execute(
        select(CustomFunnelConfiguration).where(
            CustomFunnelConfiguration.workspace_id == workspace_id,
            CustomFunnelConfiguration.name == config_data.name
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Custom funnel configuration with name '{config_data.name}' already exists")

    # Create configuration
    config = CustomFunnelConfiguration(
        workspace_id=workspace_id,
        created_by=current_user.id,
        **config_data.dict()
    )

    db.add(config)
    await db.commit()
    await db.refresh(config)

    return CustomFunnelConfigurationResponse(
        id=config.id,
        name=config.name,
        description=config.description,
        event_steps=config.event_steps,
        is_active=config.is_active,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.get("/", response_model=List[CustomFunnelConfigurationResponse])
async def list_custom_funnel_configurations(
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all custom funnel configurations for the workspace"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    query = select(CustomFunnelConfiguration).where(
        CustomFunnelConfiguration.workspace_id == workspace_id
    ).order_by(CustomFunnelConfiguration.name)

    if is_active is not None:
        query = query.where(CustomFunnelConfiguration.is_active == is_active)

    result = await db.execute(query)
    configurations = result.scalars().all()

    return [
        CustomFunnelConfigurationResponse(
            id=config.id,
            name=config.name,
            description=config.description,
            event_steps=config.event_steps,
            is_active=config.is_active,
            created_at=config.created_at,
            updated_at=config.updated_at
        )
        for config in configurations
    ]


@router.get("/{config_id}", response_model=CustomFunnelConfigurationResponse)
async def get_custom_funnel_configuration(
    config_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific custom funnel configuration"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    result = await db.execute(
        select(CustomFunnelConfiguration).where(
            CustomFunnelConfiguration.id == config_id,
            CustomFunnelConfiguration.workspace_id == workspace_id
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(404, "Custom funnel configuration not found")

    return CustomFunnelConfigurationResponse(
        id=config.id,
        name=config.name,
        description=config.description,
        event_steps=config.event_steps,
        is_active=config.is_active,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.put("/{config_id}", response_model=CustomFunnelConfigurationResponse)
async def update_custom_funnel_configuration(
    config_id: UUID,
    config_data: CustomFunnelConfigurationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a custom funnel configuration"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    # Get existing configuration
    result = await db.execute(
        select(CustomFunnelConfiguration).where(
            CustomFunnelConfiguration.id == config_id,
            CustomFunnelConfiguration.workspace_id == workspace_id
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(404, "Custom funnel configuration not found")

    # Update fields
    update_data = config_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    config.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(config)

    return CustomFunnelConfigurationResponse(
        id=config.id,
        name=config.name,
        description=config.description,
        event_steps=config.event_steps,
        is_active=config.is_active,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.delete("/{config_id}")
async def delete_custom_funnel_configuration(
    config_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom funnel configuration"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    result = await db.execute(
        select(CustomFunnelConfiguration).where(
            CustomFunnelConfiguration.id == config_id,
            CustomFunnelConfiguration.workspace_id == workspace_id
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(404, "Custom funnel configuration not found")

    await db.delete(config)
    await db.commit()

    return {"message": "Custom funnel configuration deleted successfully"}