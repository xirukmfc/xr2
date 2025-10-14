from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.orm import selectinload

from app.models.analytics import ConversionFunnel, PromptEvent, EventDefinition
from app.models.prompt import Prompt
from app.models.user import User
from app.core.database import get_session as get_db
from app.core.auth import get_current_user
from app.services.conversion_calculator import calculate_conversion_metrics

router = APIRouter(prefix="/conversion-funnels", tags=["conversion-funnels"])


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
class ConversionFunnelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

    # Source configuration
    source_type: str = Field(..., pattern="^(prompt_requests|event)$")
    source_event_name: Optional[str] = None
    source_prompt_id: Optional[UUID] = None

    # Target configuration
    target_event_name: str = Field(..., min_length=1)
    target_event_category: Optional[str] = None

    # Metric configuration
    metric_type: str = Field(default="count", pattern="^(count|sum)$")
    metric_field: Optional[str] = None

    # Settings
    conversion_window_hours: int = Field(default=24, ge=1, le=8760)  # Max 1 year
    color: str = Field(default="#3B82F6", pattern="^#[0-9A-Fa-f]{6}$")


class ConversionFunnelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    target_event_name: Optional[str] = None
    target_event_category: Optional[str] = None
    metric_type: Optional[str] = Field(None, pattern="^(count|sum)$")
    metric_field: Optional[str] = None
    conversion_window_hours: Optional[int] = Field(None, ge=1, le=8760)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    is_active: Optional[bool] = None


class ConversionFunnelResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    source_type: str
    source_event_name: Optional[str]
    source_prompt_id: Optional[UUID]
    source_prompt_name: Optional[str]  # For UI display
    target_event_name: str
    target_event_category: Optional[str]
    metric_type: str
    metric_field: Optional[str]
    conversion_window_hours: int
    is_active: bool
    color: str
    created_at: datetime
    updated_at: datetime


class ConversionMetrics(BaseModel):
    funnel_id: UUID
    funnel_name: str
    source_count: int
    target_count: int
    conversion_rate: float
    total_value: Optional[float] = None  # For sum metrics
    average_value: Optional[float] = None  # For sum metrics
    period_start: datetime
    period_end: datetime


# API Endpoints
@router.post("/", response_model=ConversionFunnelResponse)
async def create_conversion_funnel(
    funnel_data: ConversionFunnelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new conversion funnel"""

    # Validate source configuration
    if funnel_data.source_type == "prompt_requests" and not funnel_data.source_prompt_id:
        raise HTTPException(400, "source_prompt_id is required when source_type is 'prompt_requests'")

    if funnel_data.source_type == "event" and not funnel_data.source_event_name:
        raise HTTPException(400, "source_event_name is required when source_type is 'event'")

    # Validate metric configuration
    if funnel_data.metric_type == "sum" and not funnel_data.metric_field:
        raise HTTPException(400, "metric_field is required when metric_type is 'sum'")

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    # Validate prompt exists (if specified)
    if funnel_data.source_prompt_id:
        prompt = await db.execute(
            select(Prompt).where(
                Prompt.id == funnel_data.source_prompt_id,
                Prompt.workspace_id == workspace_id
            )
        )
        if not prompt.scalar_one_or_none():
            raise HTTPException(404, "Source prompt not found")

    # Validate target event exists
    target_event = await db.execute(
        select(EventDefinition).where(
            EventDefinition.workspace_id == workspace_id,
            EventDefinition.event_name == funnel_data.target_event_name,
            EventDefinition.is_active == True
        )
    )
    if not target_event.scalar_one_or_none():
        raise HTTPException(404, f"Event definition '{funnel_data.target_event_name}' not found")

    # Check name uniqueness
    existing = await db.execute(
        select(ConversionFunnel).where(
            ConversionFunnel.workspace_id == workspace_id,
            ConversionFunnel.name == funnel_data.name
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Funnel with name '{funnel_data.name}' already exists")

    # Create funnel
    funnel = ConversionFunnel(
        workspace_id=workspace_id,
        created_by=current_user.id,
        **funnel_data.dict()
    )

    db.add(funnel)
    await db.commit()
    await db.refresh(funnel)

    # Load relationships for response
    await db.execute(
        select(ConversionFunnel)
        .options(selectinload(ConversionFunnel.source_prompt))
        .where(ConversionFunnel.id == funnel.id)
    )

    return ConversionFunnelResponse(
        id=funnel.id,
        name=funnel.name,
        description=funnel.description,
        source_type=funnel.source_type,
        source_event_name=funnel.source_event_name,
        source_prompt_id=funnel.source_prompt_id,
        source_prompt_name=funnel.source_prompt.name if funnel.source_prompt else None,
        target_event_name=funnel.target_event_name,
        target_event_category=funnel.target_event_category,
        metric_type=funnel.metric_type,
        metric_field=funnel.metric_field,
        conversion_window_hours=funnel.conversion_window_hours,
        is_active=funnel.is_active,
        color=funnel.color,
        created_at=funnel.created_at,
        updated_at=funnel.updated_at
    )


@router.get("/", response_model=List[ConversionFunnelResponse])
async def list_conversion_funnels(
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all conversion funnels for the workspace"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    query = select(ConversionFunnel).options(
        selectinload(ConversionFunnel.source_prompt)
    ).where(
        ConversionFunnel.workspace_id == workspace_id
    ).order_by(ConversionFunnel.name)

    if is_active is not None:
        query = query.where(ConversionFunnel.is_active == is_active)

    result = await db.execute(query)
    funnels = result.scalars().all()

    return [
        ConversionFunnelResponse(
            id=funnel.id,
            name=funnel.name,
            description=funnel.description,
            source_type=funnel.source_type,
            source_event_name=funnel.source_event_name,
            source_prompt_id=funnel.source_prompt_id,
            source_prompt_name=funnel.source_prompt.name if funnel.source_prompt else None,
            target_event_name=funnel.target_event_name,
            target_event_category=funnel.target_event_category,
            metric_type=funnel.metric_type,
            metric_field=funnel.metric_field,
            conversion_window_hours=funnel.conversion_window_hours,
            is_active=funnel.is_active,
            color=funnel.color,
            created_at=funnel.created_at,
            updated_at=funnel.updated_at
        )
        for funnel in funnels
    ]


@router.get("/metrics", response_model=List[ConversionMetrics])
async def get_all_conversion_metrics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversion metrics for all active funnels"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Get all active funnels
    result = await db.execute(
        select(ConversionFunnel).where(
            ConversionFunnel.workspace_id == workspace_id,
            ConversionFunnel.is_active == True
        ).order_by(ConversionFunnel.name)
    )
    funnels = result.scalars().all()

    # Calculate metrics for each funnel
    metrics_list = []
    for funnel in funnels:
        metrics = await calculate_conversion_metrics(db, funnel, start_date, end_date)
        metrics_list.append(
            ConversionMetrics(
                funnel_id=funnel.id,
                funnel_name=funnel.name,
                source_count=metrics["source_count"],
                target_count=metrics["target_count"],
                conversion_rate=metrics["conversion_rate"],
                total_value=metrics.get("total_value"),
                average_value=metrics.get("average_value"),
                period_start=start_date,
                period_end=end_date
            )
        )

    return metrics_list


@router.get("/{funnel_id}", response_model=ConversionFunnelResponse)
async def get_conversion_funnel(
    funnel_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific conversion funnel"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    result = await db.execute(
        select(ConversionFunnel)
        .options(selectinload(ConversionFunnel.source_prompt))
        .where(
            ConversionFunnel.id == funnel_id,
            ConversionFunnel.workspace_id == workspace_id
        )
    )
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise HTTPException(404, "Conversion funnel not found")

    return ConversionFunnelResponse(
        id=funnel.id,
        name=funnel.name,
        description=funnel.description,
        source_type=funnel.source_type,
        source_event_name=funnel.source_event_name,
        source_prompt_id=funnel.source_prompt_id,
        source_prompt_name=funnel.source_prompt.name if funnel.source_prompt else None,
        target_event_name=funnel.target_event_name,
        target_event_category=funnel.target_event_category,
        metric_type=funnel.metric_type,
        metric_field=funnel.metric_field,
        conversion_window_hours=funnel.conversion_window_hours,
        is_active=funnel.is_active,
        color=funnel.color,
        created_at=funnel.created_at,
        updated_at=funnel.updated_at
    )


@router.put("/{funnel_id}", response_model=ConversionFunnelResponse)
async def update_conversion_funnel(
    funnel_id: UUID,
    funnel_data: ConversionFunnelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a conversion funnel"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    # Get existing funnel
    result = await db.execute(
        select(ConversionFunnel)
        .options(selectinload(ConversionFunnel.source_prompt))
        .where(
            ConversionFunnel.id == funnel_id,
            ConversionFunnel.workspace_id == workspace_id
        )
    )
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise HTTPException(404, "Conversion funnel not found")

    # Update fields
    update_data = funnel_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(funnel, field, value)

    funnel.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(funnel)

    return ConversionFunnelResponse(
        id=funnel.id,
        name=funnel.name,
        description=funnel.description,
        source_type=funnel.source_type,
        source_event_name=funnel.source_event_name,
        source_prompt_id=funnel.source_prompt_id,
        source_prompt_name=funnel.source_prompt.name if funnel.source_prompt else None,
        target_event_name=funnel.target_event_name,
        target_event_category=funnel.target_event_category,
        metric_type=funnel.metric_type,
        metric_field=funnel.metric_field,
        conversion_window_hours=funnel.conversion_window_hours,
        is_active=funnel.is_active,
        color=funnel.color,
        created_at=funnel.created_at,
        updated_at=funnel.updated_at
    )


@router.delete("/{funnel_id}")
async def delete_conversion_funnel(
    funnel_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a conversion funnel"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    result = await db.execute(
        select(ConversionFunnel).where(
            ConversionFunnel.id == funnel_id,
            ConversionFunnel.workspace_id == workspace_id
        )
    )
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise HTTPException(404, "Conversion funnel not found")

    await db.delete(funnel)
    await db.commit()

    return {"message": "Conversion funnel deleted successfully"}


@router.get("/{funnel_id}/metrics", response_model=ConversionMetrics)
async def get_conversion_metrics(
    funnel_id: UUID,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversion metrics for a specific funnel"""

    # Get user's workspace
    workspace_id = await get_user_workspace(db, current_user)

    # Get funnel
    result = await db.execute(
        select(ConversionFunnel).where(
            ConversionFunnel.id == funnel_id,
            ConversionFunnel.workspace_id == workspace_id
        )
    )
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise HTTPException(404, "Conversion funnel not found")

    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Calculate metrics
    try:
        metrics = await calculate_conversion_metrics(db, funnel, start_date, end_date)

        return ConversionMetrics(
            funnel_id=funnel.id,
            funnel_name=funnel.name,
            source_count=metrics["source_count"],
            target_count=metrics["target_count"],
            conversion_rate=metrics["conversion_rate"],
            total_value=metrics.get("total_value"),
            average_value=metrics.get("average_value"),
            period_start=start_date,
            period_end=end_date
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to calculate conversion metrics: {str(e)}")


