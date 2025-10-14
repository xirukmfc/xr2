from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid
from uuid import UUID
import datetime

from app.core.database import get_session
from app.models.prompt import Tag
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/tags", tags=["tags"])


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#3B82F6", pattern=r"^#[0-9A-Fa-f]{6}$")


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class TagResponse(BaseModel):
    id: str
    name: str
    color: str
    created_by: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=str(obj.id),
            name=obj.name,
            color=obj.color,
            created_by=str(obj.created_by),
            created_at=obj.created_at.isoformat(),
            updated_at=obj.updated_at.isoformat(),
        )


# Authentication dependency is now imported from app.api.auth


@router.get("/", response_model=List[TagResponse])
async def get_user_tags(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get all tags for the current user"""
    result = await session.execute(
        select(Tag).where(Tag.created_by == current_user.id).order_by(Tag.name)
    )
    tags = result.scalars().all()

    response_data = [
        TagResponse(
            id=str(tag.id),
            name=tag.name,
            color=tag.color,
            created_by=str(tag.created_by),
            created_at=tag.created_at.isoformat(),
            updated_at=tag.updated_at.isoformat(),
        ) for tag in tags
    ]

    return response_data


@router.get("/get_user_tags", response_model=List[TagResponse])
async def get_user_tags_alias(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Get all tags created by the current user (alternative endpoint)

    This endpoint returns a list of all tags created by the authenticated user,
    sorted alphabetically by tag name. It's an alias for GET /internal/tags/
    and provides the same functionality.

    Returns:
        List of tags with id, name, color, created_by, and created_at fields
    """
    return await get_user_tags(session=session, current_user=current_user)


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
        tag_data: TagCreate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Create a new tag for the current user"""

    result = await session.execute(
        select(Tag).where(
            Tag.created_by == current_user.id,
            Tag.name.ilike(tag_data.name.strip())
        )
    )
    existing_tag = result.scalar_one_or_none()

    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag '{tag_data.name}' already exists"
        )

    new_tag = Tag(
        name=tag_data.name.strip(),
        color=tag_data.color,
        created_by=current_user.id
    )

    session.add(new_tag)
    await session.commit()
    await session.refresh(new_tag)

    # FIX: replace this line
    return TagResponse(
        id=str(new_tag.id),
        name=new_tag.name,
        color=new_tag.color,
        created_by=str(new_tag.created_by),
        created_at=new_tag.created_at.isoformat(),
        updated_at=new_tag.updated_at.isoformat(),
    )


@router.get("/{tag_id:uuid}", response_model=TagResponse)
async def get_tag(
        tag_id: uuid.UUID,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get a specific tag by ID (only if user owns it)"""
    result = await session.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.created_by == current_user.id
        )
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    return TagResponse(
        id=str(tag.id),
        name=tag.name,
        color=tag.color,
        created_by=str(tag.created_by),
        created_at=tag.created_at.isoformat(),
        updated_at=tag.updated_at.isoformat(),
    )


@router.put("/{tag_id:uuid}", response_model=TagResponse)
async def update_tag(
        tag_id: uuid.UUID,
        tag_data: TagUpdate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Update a tag (only if user owns it)"""
    result = await session.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.created_by == current_user.id
        )
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check for name conflicts if name is being updated
    if tag_data.name and tag_data.name.strip().lower() != tag.name.lower():
        result = await session.execute(
            select(Tag).where(
                Tag.created_by == current_user.id,
                Tag.name.ilike(tag_data.name.strip()),
                Tag.id != tag_id
            )
        )
        existing_tag = result.scalar_one_or_none()

        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag '{tag_data.name}' already exists"
            )

    if tag_data.name:
        tag.name = tag_data.name.strip()
    if tag_data.color:
        tag.color = tag_data.color

    await session.commit()
    await session.refresh(tag)

    return TagResponse(
        id=str(tag.id),
        name=tag.name,
        color=tag.color,
        created_by=str(tag.created_by),
        created_at=tag.created_at.isoformat(),
        updated_at=tag.updated_at.isoformat(),
    )


@router.delete("/{tag_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
        tag_id: uuid.UUID,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Delete a tag (only if user owns it)"""
    result = await session.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.created_by == current_user.id
        )
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await session.delete(tag)
    await session.commit()
