import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.core.database import get_session
from app.core.auth import get_current_user
from app.models.user import User
from app.models.prompt import PromptVersion
from app.models.public_share import PublicShare
from app.schemas.public_share import (
    CreatePublicShareRequest,
    PublicShareResponse,
    PublicShareListResponse,
    PublicPromptData,
    DeletePublicShareResponse,
    PublicPromptVariable
)

router = APIRouter(prefix="/shares", tags=["public-sharing"])


def generate_share_token() -> str:
    """Generate a secure random token for public sharing"""
    return secrets.token_urlsafe(32)


@router.post("", response_model=PublicShareResponse)
async def create_public_share(
    request: CreatePublicShareRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new public share for a prompt version"""

    # Verify the prompt version exists and belongs to user's workspace
    stmt = select(PromptVersion).options(
        joinedload(PromptVersion.prompt)
    ).where(PromptVersion.id == request.prompt_version_id)

    result = await session.execute(stmt)
    prompt_version = result.scalar_one_or_none()

    if not prompt_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )

    # Check if user has access to this prompt (created by user or in user's workspace)
    user_workspace_ids = [w.id for w in current_user.workspaces]
    if (prompt_version.prompt.workspace_id not in user_workspace_ids and
        prompt_version.created_by != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this prompt version"
        )

    # Generate unique token
    token = generate_share_token()

    # Check if token already exists (very unlikely but just in case)
    existing = await session.execute(
        select(PublicShare).where(PublicShare.token == token)
    )
    if existing.scalar_one_or_none():
        # Generate a new token if collision occurs
        token = generate_share_token()

    # Create the public share
    public_share = PublicShare(
        token=token,
        prompt_version_id=request.prompt_version_id,
        created_by=current_user.id,
        expires_at=request.expires_at,
        is_active=True
    )

    session.add(public_share)
    await session.commit()
    await session.refresh(public_share)

    # Construct the share URL
    base_url = "http://localhost:3000"  # TODO: Make this configurable
    share_url = f"{base_url}/share/{token}"

    return PublicShareResponse(
        id=public_share.id,
        token=public_share.token,
        share_url=share_url,
        created_at=public_share.created_at,
        expires_at=public_share.expires_at
    )


@router.get("", response_model=List[PublicShareListResponse])
async def list_public_shares(
    prompt_id: UUID = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List all public shares created by the current user"""

    stmt = select(PublicShare).where(
        PublicShare.created_by == current_user.id,
        PublicShare.is_active == True
    ).options(
        joinedload(PublicShare.prompt_version).joinedload(PromptVersion.prompt)
    )

    if prompt_id:
        # Filter by specific prompt
        stmt = stmt.join(PromptVersion).where(PromptVersion.prompt_id == prompt_id)

    result = await session.execute(stmt)
    shares = result.scalars().all()

    return [
        PublicShareListResponse(
            id=share.id,
            token=share.token,
            prompt_version_id=share.prompt_version_id,
            created_at=share.created_at,
            expires_at=share.expires_at,
            is_active=share.is_active
        )
        for share in shares
    ]


@router.delete("/{share_id}", response_model=DeletePublicShareResponse)
async def delete_public_share(
    share_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete a public share"""

    stmt = select(PublicShare).where(
        PublicShare.id == share_id,
        PublicShare.created_by == current_user.id
    )

    result = await session.execute(stmt)
    share = result.scalar_one_or_none()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public share not found"
        )

    await session.delete(share)
    await session.commit()

    return DeletePublicShareResponse(
        success=True,
        message="Public share deleted successfully"
    )


# Public endpoint (no authentication required)
# This will be registered separately in main.py without authentication
from fastapi import APIRouter as PublicAPIRouter

public_router = PublicAPIRouter()

@public_router.get("/share/{token}", response_model=PublicPromptData)
async def get_public_prompt(
    token: str,
    session: AsyncSession = Depends(get_session)
):
    """Get public prompt data by token (no authentication required)"""

    # Find the public share
    stmt = select(PublicShare).options(
        joinedload(PublicShare.prompt_version).selectinload(PromptVersion.creator),
        joinedload(PublicShare.prompt_version).selectinload(PromptVersion.updater),
        joinedload(PublicShare.prompt_version).joinedload(PromptVersion.prompt),
        joinedload(PublicShare.creator)
    ).where(
        PublicShare.token == token,
        PublicShare.is_active == True
    )

    result = await session.execute(stmt)
    share = result.scalar_one_or_none()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared prompt not found or expired"
        )

    # Check if expired
    if share.expires_at and share.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Shared prompt has expired"
        )

    prompt_version = share.prompt_version
    prompt = prompt_version.prompt
    creator = share.creator

    # Convert variables to the expected format
    variables = []
    if prompt_version.variables:
        for var in prompt_version.variables:
            variables.append(PublicPromptVariable(
                name=var.get("name", ""),
                type=var.get("type", "string"),
                defaultValue=var.get("default") or var.get("defaultValue"),  # Check both 'default' and 'defaultValue'
                isDefined=var.get("isDefined", True)
            ))

    return PublicPromptData(
        prompt_name=prompt.name,
        prompt_description=prompt.description,
        version_number=prompt_version.version_number,
        system_prompt=prompt_version.system_prompt,
        user_prompt=prompt_version.user_prompt,
        assistant_prompt=prompt_version.assistant_prompt,
        prompt_template=prompt_version.prompt_template,
        variables=variables,
        shared_by_name=creator.full_name or creator.username,
        created_by_name=prompt_version.creator.full_name or prompt_version.creator.username if prompt_version.creator else None,
        updated_by_name=prompt_version.updater.full_name or prompt_version.updater.username if prompt_version.updater else None,
        created_at=prompt_version.created_at,
        updated_at=prompt_version.updated_at
    )