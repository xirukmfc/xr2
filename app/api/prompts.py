from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Any
import uuid
from uuid import UUID
from datetime import datetime
from app.core.database import get_session
from app.models.prompt import Prompt, PromptVersion, VersionStatus, PromptStatus
from app.models.user import User
from app.core.auth import get_current_user
from app.services.statistics import StatisticsService
from app.services.limits import LimitsService
from app.schemas.prompt import (
    CreatePromptRequest,
    UpdatePromptRequest,
    PromptVersionCreate,
    PromptVersionUpdate,
    PromptVersionResponse,
    PromptUpdate,
    PromptResponse,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


# Utility functions
def convert_prompt_version_to_response(version: PromptVersion) -> dict:
    """Convert PromptVersion to dictionary for API"""
    return {
        "id": str(version.id),
        "prompt_id": str(version.prompt_id),
        "version_number": version.version_number,
        "system_prompt": version.system_prompt,
        "user_prompt": version.user_prompt,
        "assistant_prompt": version.assistant_prompt,
        "prompt_template": version.prompt_template,
        "variables": version.variables or [],
        "llm_config": version.model_config or {},
        "status": version.status.value,
        "deployed_at": version.deployed_at.isoformat() if version.deployed_at else None,
        "deployed_by": str(version.deployed_by) if version.deployed_by else None,
        "usage_count": version.usage_count,
        "avg_latency": version.avg_latency,
        "changelog": version.changelog,
        "created_by": str(version.created_by),
        "updated_by": str(version.updated_by) if version.updated_by else None,
        "creator_name": version.creator.username if hasattr(version, 'creator') and version.creator else "",
        "creator_full_name": version.creator.full_name if hasattr(version,
                                                                  'creator') and version.creator and version.creator.full_name else "",
        "updater_name": version.updater.username if hasattr(version, 'updater') and version.updater else "",
        "updater_full_name": version.updater.full_name if hasattr(version,
                                                                  'updater') and version.updater and version.updater.full_name else "",
        "created_at": version.created_at.isoformat() if version.created_at else None,
        "updated_at": version.updated_at.isoformat() if version.updated_at else None,
    }


def convert_prompt_to_response(prompt: Prompt) -> dict[str | Any, str | None | Any]:
    """Convert Prompt to dictionary for API - optimized for prompt list"""
    # Optimized: Don't load all versions for list view, only current version
    versions_data = []
    # For list view, we don't need all versions - this was causing major performance issues
    # Only load versions for detailed prompt view

    # Current version data (already loaded via selectinload)
    current_version_data = None
    if prompt.current_version:
        current_version_data = convert_prompt_version_to_response(prompt.current_version)

    # Production version data - use current version if it's production, otherwise None for list view
    production_version_data = None
    if (prompt.current_version and
            prompt.production_version_id and
            str(prompt.current_version.id) == str(prompt.production_version_id)):
        production_version_data = current_version_data

    # Optimized: Direct attribute access instead of hasattr checks
    updater_name = ""
    updater_full_name = ""

    # Get updater info - simplified logic
    if prompt.updated_by and prompt.current_version and prompt.current_version.updater:
        updater_name = prompt.current_version.updater.username or ""
        updater_full_name = prompt.current_version.updater.full_name or ""

    return {
        "id": str(prompt.id),
        "name": prompt.name,
        "slug": prompt.slug,
        "description": prompt.description,
        "status": prompt.status.value,
        "workspace_id": str(prompt.workspace_id),
        "production_version_id": str(prompt.production_version_id) if prompt.production_version_id else None,
        "current_version_id": str(prompt.current_version_id) if prompt.current_version_id else None,
        "created_by": str(prompt.created_by),
        "updated_by": str(prompt.updated_by) if prompt.updated_by else None,
        # Optimized: Direct access to creator info (already loaded via joinedload)
        "creator_name": prompt.creator.username if prompt.creator else "",
        "creator_full_name": prompt.creator.full_name if prompt.creator else "",
        "creator_email": prompt.creator.email if prompt.creator else None,
        "updater_name": updater_name,
        "updater_full_name": updater_full_name,
        "created_at": prompt.created_at.isoformat() if prompt.created_at else None,
        "updated_at": prompt.updated_at.isoformat() if prompt.updated_at else (
            prompt.created_at.isoformat() if prompt.created_at else None),
        "last_deployed_at": prompt.last_deployed_at.isoformat() if prompt.last_deployed_at else None,
        "last_deployed_by": str(prompt.last_deployed_by) if prompt.last_deployed_by else None,
        # Optimized: versions empty for list view (major performance improvement)
        "versions": versions_data,
        "production_version": production_version_data,
        "current_version": current_version_data,
        # Optimized: Direct access to tags (already loaded via selectinload)
        "tags": [{"id": str(t.id), "name": t.name, "color": t.color} for t in prompt.tags] if prompt.tags else []
    }


@router.get("/", response_model=List[PromptResponse])
async def get_prompts(
        workspace_id: Optional[str] = Query(None, description="Filter by workspace"),
        status: Optional[str] = Query(None, description="Filter by status"),
        skip: int = Query(0, ge=0, description="Number of prompts to skip"),
        limit: int = Query(100, ge=1, le=1000, description="Number of prompts to return"),
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get all prompts with filtering - optimized for list view"""
    query = select(Prompt).options(
        # Only load essential relationships for list view
        joinedload(Prompt.creator),  # Always needed for creator info
        selectinload(Prompt.tags),  # Tags are small and frequently used
        # Load current version with its updater for complete info
        selectinload(Prompt.current_version).joinedload(PromptVersion.updater),
        # Don't load all versions and production_version separately - too expensive for list view
    )

    # Apply filters
    if workspace_id:
        query = query.where(Prompt.workspace_id == workspace_id)
    if status:
        query = query.where(Prompt.status == status)

    # Add pagination
    query = query.offset(skip).limit(limit).order_by(Prompt.updated_at.desc())

    result = await session.execute(query)
    prompts = result.unique().scalars().all()
    
    # Get usage statistics for all prompts in batch (optimized)
    try:
        stats_service = StatisticsService(session)
        prompt_ids = [prompt.id for prompt in prompts]
        usage_stats = await stats_service.get_multiple_prompts_request_counts_24h(prompt_ids)
        print(f"[Prompts API] Loaded usage stats for {len(usage_stats)} prompts")
    except Exception as e:
        print(f"[Prompts API] Error loading usage stats: {e}")
        usage_stats = {}
    
    # Build response with usage stats
    prompts_with_stats = []
    for prompt in prompts:
        prompt_data = convert_prompt_to_response(prompt)
        prompt_data["usage_24h"] = usage_stats.get(str(prompt.id), 0)
        prompts_with_stats.append(PromptResponse(**prompt_data))
    
    return prompts_with_stats


@router.get("/user-limits")
async def get_user_limits(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get current user's limits and usage statistics"""
    try:
        limits_service = LimitsService(session)
        stats = await limits_service.get_user_usage_stats(current_user.id)
        
        return {
            "user_id": str(current_user.id),
            "username": current_user.username,
            "is_superuser": current_user.is_superuser,
            "limits": stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user limits: {str(e)}"
        )


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
        prompt_id: str,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get a specific prompt by ID"""
    query = select(Prompt).options(
        joinedload(Prompt.creator),
        joinedload(Prompt.updater),
        selectinload(Prompt.versions),
        selectinload(Prompt.versions).joinedload(PromptVersion.creator),
        selectinload(Prompt.versions).joinedload(PromptVersion.updater),
        selectinload(Prompt.production_version),
        selectinload(Prompt.current_version),
        selectinload(Prompt.tags)
    ).where(Prompt.id == prompt_id)

    result = await session.execute(query)
    prompt = result.unique().scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return PromptResponse(**convert_prompt_to_response(prompt))


@router.post("/", response_model=PromptResponse)
async def create_prompt(
        prompt_data: CreatePromptRequest,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Create a new prompt with initial version"""
    try:
        # Check prompt limits first
        limits_service = LimitsService(session)
        can_create, current_count, max_prompts = await limits_service.check_prompt_limit(current_user.id)
        
        if not can_create:
            if max_prompts == -1:  # This shouldn't happen for non-superusers, but just in case
                pass  # unlimited
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "Prompt limit exceeded",
                        "current_count": current_count,
                        "max_prompts": max_prompts,
                        "message": f"You have reached your limit of {max_prompts} prompts. You currently have {current_count} prompts."
                    }
                )

        # Create slug if not specified
        slug = prompt_data.slug or prompt_data.name.lower().replace(' ', '-')

        # Check slug uniqueness in workspace
        existing = await session.execute(
            select(Prompt).where(
                Prompt.workspace_id == prompt_data.workspace_id,
                Prompt.slug == slug
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Prompt with slug '{slug}' already exists in this workspace")

        # Create prompt
        new_prompt = Prompt(
            name=prompt_data.name,
            slug=slug,
            description=prompt_data.description,
            workspace_id=prompt_data.workspace_id,
            created_by=current_user.id,
            updated_by=current_user.id
        )

        session.add(new_prompt)
        await session.flush()  # Get prompt ID

        # Create first version
        first_version = PromptVersion(
            prompt_id=new_prompt.id,
            version_number=1,
            system_prompt=prompt_data.system_prompt,
            user_prompt=prompt_data.user_prompt,
            assistant_prompt=prompt_data.assistant_prompt,
            prompt_template=prompt_data.prompt_template,
            variables=prompt_data.variables,
            model_config=prompt_data.llm_config,
            status=VersionStatus.DRAFT,
            created_by=current_user.id
        )

        session.add(first_version)
        await session.flush()

        # Set as current version
        new_prompt.current_version_id = first_version.id
        new_prompt.updated_by = current_user.id

        # Add tags to prompt
        if prompt_data.tag_ids:
            from app.models.prompt import Tag

            tags_result = await session.execute(
                select(Tag).where(
                    Tag.id.in_(prompt_data.tag_ids),
                    Tag.created_by == current_user.id
                )
            )
            tags = tags_result.scalars().all()
            new_prompt.tags.extend(tags)

        await session.commit()

        # Reload with relationships
        await session.refresh(new_prompt)
        query = select(Prompt).options(
            selectinload(Prompt.versions),
            selectinload(Prompt.current_version),
            selectinload(Prompt.tags)
        ).where(Prompt.id == new_prompt.id)

        result = await session.execute(query)
        created_prompt = result.scalar_one()

        return PromptResponse(**convert_prompt_to_response(created_prompt))
    except HTTPException:
        # Re-raise HTTP exceptions (like 403 Forbidden) without modification
        await session.rollback()
        raise
    except Exception as e:
        print(f"Error creating prompt: {e}")
        import traceback
        traceback.print_exc()
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating prompt: {str(e)}")


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
        prompt_id: str,
        prompt_data: UpdatePromptRequest,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Update prompt metadata (not versions)"""
    result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Update fields
    if prompt_data.name is not None:
        prompt.name = prompt_data.name
    if prompt_data.slug is not None:
        # Check uniqueness
        existing = await session.execute(
            select(Prompt).where(
                Prompt.workspace_id == prompt.workspace_id,
                Prompt.slug == prompt_data.slug,
                Prompt.id != prompt_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Prompt with slug '{prompt_data.slug}' already exists")
        prompt.slug = prompt_data.slug
    if prompt_data.description is not None:
        prompt.description = prompt_data.description
    if prompt_data.status is not None:
        prompt.status = prompt_data.status

    # Handle tags update
    if prompt_data.tag_ids is not None:
        from app.models.prompt import Tag

        # Clear existing tags
        prompt.tags.clear()

        if prompt_data.tag_ids:  # If there are tags to add
            # Handle both tag IDs and tag names
            tag_conditions = []
            for tag_identifier in prompt_data.tag_ids:
                # Try to parse as UUID first
                try:
                    import uuid
                    uuid.UUID(tag_identifier)  # This will raise ValueError if not a valid UUID
                    tag_conditions.append(Tag.id == tag_identifier)
                except ValueError:
                    # If not a UUID, treat as tag name
                    tag_conditions.append(Tag.name == tag_identifier)

            if tag_conditions:
                from sqlalchemy import or_
                tags_result = await session.execute(
                    select(Tag).where(
                        or_(*tag_conditions),
                        Tag.created_by == current_user.id
                    )
                )
                tags = tags_result.scalars().all()
                prompt.tags.extend(tags)

    # Set updated_by field
    prompt.updated_by = current_user.id

    await session.commit()

    # Reload with relationships
    query = select(Prompt).options(
        joinedload(Prompt.creator),
        joinedload(Prompt.updater),
        selectinload(Prompt.versions),
        selectinload(Prompt.production_version),
        selectinload(Prompt.current_version),
        selectinload(Prompt.tags)
    ).where(Prompt.id == prompt_id)

    result = await session.execute(query)
    updated_prompt = result.unique().scalar_one()

    return PromptResponse(**convert_prompt_to_response(updated_prompt))


@router.delete("/{prompt_id}")
async def delete_prompt(
        prompt_id: str,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Delete a prompt and all its versions"""
    result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Clear circular references before deletion
    prompt.current_version_id = None
    prompt.production_version_id = None
    await session.flush()

    await session.delete(prompt)
    await session.commit()

    return {"success": True, "message": "Prompt deleted successfully"}


@router.get("/{prompt_id}/versions", response_model=List[PromptVersionResponse])
async def get_prompt_versions(
        prompt_id: str,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get all versions of a specific prompt"""
    # Check if prompt exists
    prompt_result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    if not prompt_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Load versions
    result = await session.execute(
        select(PromptVersion)
        .options(
            joinedload(PromptVersion.creator),
            joinedload(PromptVersion.updater)
        )
        .where(PromptVersion.prompt_id == prompt_id)
        .order_by(PromptVersion.version_number.desc())
    )
    versions = result.unique().scalars().all()

    return [PromptVersionResponse(**convert_prompt_version_to_response(v)) for v in versions]


@router.post("/{prompt_id}/versions", response_model=PromptVersionResponse)
async def create_prompt_version(
        prompt_id: str,
        version_data: PromptVersionCreate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Create a new version of a prompt"""
    # Check if prompt exists
    prompt_result = await session.execute(
        select(Prompt).options(
            selectinload(Prompt.versions),
            selectinload(Prompt.tags)
        ).where(Prompt.id == prompt_id)
    )
    prompt = prompt_result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Determine new version number
    max_version = max([v.version_number for v in prompt.versions], default=0)
    new_version_number = max_version + 1

    # Create new version
    new_version = PromptVersion(
        prompt_id=uuid.UUID(prompt_id),
        version_number=new_version_number,
        system_prompt=version_data.system_prompt,
        user_prompt=version_data.user_prompt,
        assistant_prompt=version_data.assistant_prompt,
        prompt_template=version_data.prompt_template,
        variables=version_data.variables or [],
        model_config=version_data.llm_config or {},
        status=VersionStatus.DRAFT,
        changelog=version_data.changelog or "New version created",
        created_by=current_user.id
    )

    session.add(new_version)
    await session.flush()

    # Set as current version
    prompt.current_version_id = new_version.id
    prompt.updated_by = current_user.id

    await session.commit()

    # Reload version
    query = select(PromptVersion).where(PromptVersion.id == new_version.id)

    result = await session.execute(query)
    created_version = result.scalar_one()

    return PromptVersionResponse(**convert_prompt_version_to_response(created_version))


@router.put("/{prompt_id}/versions/{version_id}", response_model=PromptVersionResponse)
async def update_prompt_version(
        prompt_id: str,
        version_id: str,
        version_update: PromptVersionUpdate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Update a specific prompt version"""
    print(f"[update_prompt_version] Received data: {version_update.model_dump()}")

    # Check that prompt exists
    prompt_result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    if not prompt_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Find version with loaded tags
    version_result = await session.execute(
        select(PromptVersion)
        .where(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt_id
        )
    )
    version = version_result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    if version.status == VersionStatus.PRODUCTION:
        raise HTTPException(
            status_code=400,
            detail="Production versions cannot be edited. Please create a new version instead."
        )

    # Update only provided fields (exclude None values for required fields)
    update_data = version_update.model_dump(exclude_unset=True)
    print(f"[update_prompt_version] Update data after exclude_unset: {update_data}")

    # Set updated_by field
    version.updated_by = current_user.id

    # Also update the prompt's updated_by field since the version was modified
    prompt_result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = prompt_result.scalar_one()
    prompt.updated_by = current_user.id

    # IMPORTANT: Exclude None values for required fields
    for field, value in update_data.items():
        if field == 'status' and value is None:
            continue  # Don't update status if it's None
        print(f"[update_prompt_version] Setting {field} = {value}")
        setattr(version, field, value)

    await session.commit()
    print(f"[update_prompt_version] Committed changes")

    # Reload version
    query = select(PromptVersion).options(
        joinedload(PromptVersion.creator),
        joinedload(PromptVersion.updater)
    ).where(PromptVersion.id == version_id)

    result = await session.execute(query)
    updated_version = result.scalar_one()

    # Get creator name
    res = await session.execute(select(User.username).where(User.id == updated_version.created_by))
    creator_name = res.scalar_one_or_none()

    data = convert_prompt_version_to_response(updated_version)
    data["creator_name"] = creator_name
    return PromptVersionResponse(**data)


@router.post("/{prompt_id}/versions/{version_id}/deploy")
async def deploy_prompt_version(
        prompt_id: str,
        version_id: str,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Deploy a specific version to production"""
    # Load prompt with all versions
    prompt_result = await session.execute(
        select(Prompt).options(
            selectinload(Prompt.versions),
            selectinload(Prompt.tags)
        ).where(Prompt.id == prompt_id)
    )
    prompt = prompt_result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Find version to deploy
    version_to_deploy = None
    for v in prompt.versions:
        if str(v.id) == version_id:
            version_to_deploy = v
            break

    if not version_to_deploy:
        raise HTTPException(status_code=404, detail="Version not found")

    # Check that version is not deprecated
    if version_to_deploy.status == VersionStatus.DEPRECATED:
        raise HTTPException(
            status_code=400,
            detail="Cannot deploy deprecated version. Please create a new version instead."
        )

    # Update statuses of all versions
    for v in prompt.versions:
        if str(v.id) == version_id:
            # Deploy selected version
            v.status = VersionStatus.PRODUCTION
            v.deployed_at = datetime.now(timezone.utc)
            v.deployed_by = current_user.id
        elif v.status == VersionStatus.PRODUCTION:
            # Previous production version becomes INACTIVE (not DEPRECATED!)
            v.status = VersionStatus.INACTIVE
            # Keep deployment info for history
            # deployed_at and deployed_by remain for history

    # Update prompt
    prompt.production_version_id = uuid.UUID(version_id)
    prompt.last_deployed_at = datetime.now(timezone.utc)
    prompt.last_deployed_by = current_user.id
    prompt.status = PromptStatus.ACTIVE
    prompt.updated_by = current_user.id

    await session.commit()

    return {
        "success": True,
        "message": f"Version {version_to_deploy.version_number} deployed to production",
        "version_id": version_id,
        "deployed_at": prompt.last_deployed_at.isoformat()
    }


@router.post("/{prompt_id}/versions/{version_id}/undeploy")
async def undeploy_prompt_version(
        prompt_id: str,
        version_id: str,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Undeploy a specific version from production"""
    prompt_result = await session.execute(
        select(Prompt).options(
            selectinload(Prompt.versions),
            selectinload(Prompt.tags)
        ).where(Prompt.id == prompt_id)
    )
    prompt = prompt_result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    version_to_undeploy = None
    for v in prompt.versions:
        if str(v.id) == version_id:
            version_to_undeploy = v
            break
    if not version_to_undeploy:
        raise HTTPException(status_code=404, detail="Version not found")

    if version_to_undeploy.status != VersionStatus.PRODUCTION:
        raise HTTPException(
            status_code=400,
            detail=f"Version {version_to_undeploy.version_number} is not currently in production"
        )

    # Determine new status for version after rollback
    # If version was deployed (has deployed_at), it becomes INACTIVE
    # If it was not deployed, it remains DRAFT
    if version_to_undeploy.deployed_at:
        new_status = VersionStatus.INACTIVE
    else:
        new_status = VersionStatus.DRAFT

    version_to_undeploy.status = new_status
    # Remove production_version_id from prompt
    prompt.production_version_id = None
    # Set updated_by field for the prompt
    prompt.updated_by = current_user.id
    # If there are no other active versions, change prompt status
    has_active_versions = any(
        v.status == VersionStatus.PRODUCTION
        for v in prompt.versions
        if str(v.id) != version_id
    )
    if not has_active_versions:
        prompt.status = PromptStatus.DRAFT

    await session.commit()

    # Convert status to frontend format
    status_mapping = {
        VersionStatus.INACTIVE: "Inactive",
        VersionStatus.DRAFT: "Draft",
        VersionStatus.PRODUCTION: "Production",
        VersionStatus.DEPRECATED: "Deprecated"
    }
    status = status_mapping.get(new_status, new_status.value.title())

    return {
        "success": True,
        "message": f"Version {version_to_undeploy.version_number} has been undeployed",
        "version_id": version_id,
        "new_status": status,
        "undeployed_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/{prompt_id}/versions/{version_id}/deprecate")
async def deprecate_prompt_version(
        prompt_id: str,
        version_id: str,
        reason: Optional[str] = None,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Mark a version as deprecated (should not be used anymore)"""
    version_result = await session.execute(
        select(PromptVersion).where(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt_id
        )
    )
    version = version_result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Cannot deprecate production version
    if version.status == VersionStatus.PRODUCTION:
        raise HTTPException(
            status_code=400,
            detail="Cannot deprecate production version. Undeploy it first."
        )

    # Cannot deprecate already deprecated version
    if version.status == VersionStatus.DEPRECATED:
        raise HTTPException(
            status_code=400,
            detail="Version is already deprecated"
        )

    version.status = VersionStatus.DEPRECATED
    version.updated_by = current_user.id

    # Add reason to changelog if provided
    if reason:
        existing_changelog = version.changelog or ""
        deprecation_note = f"\n[DEPRECATED {datetime.now(timezone.utc).date()}]: {reason}"
        version.changelog = existing_changelog + deprecation_note

    await session.commit()

    return {
        "success": True,
        "message": f"Version {version.version_number} has been deprecated",
        "version_id": version_id,
        "deprecated_at": datetime.now(timezone.utc).isoformat(),
        "reason": reason
    }


@router.delete("/{prompt_id}/versions/{version_id}")
async def delete_prompt_version(
        prompt_id: str,
        version_id: str,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Delete a prompt version if it's not deployed"""
    # Check that prompt exists
    prompt_result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = prompt_result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Find version
    version_result = await session.execute(
        select(PromptVersion).where(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt_id
        )
    )
    version = version_result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Check that version is NOT deployed
    # Version is considered deployed if:
    # 1. Its status = PRODUCTION
    # 2. It is the production_version_id of the prompt
    if version.status == VersionStatus.PRODUCTION:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete deployed version. The version is currently in production."
        )

    if str(prompt.production_version_id) == str(version_id):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete deployed version. This version is set as the production version."
        )

    # Check that this is not the only version
    versions_count_result = await session.execute(
        select(PromptVersion).where(PromptVersion.prompt_id == prompt_id)
    )
    all_versions = versions_count_result.scalars().all()

    if len(all_versions) <= 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the last version. A prompt must have at least one version."
        )

    # If the version being deleted is current_version, change current_version to another
    if str(prompt.current_version_id) == str(version_id):
        # Find another version to set as current
        other_versions = [v for v in all_versions if str(v.id) != str(version_id)]
        if other_versions:
            # Prefer production version if available
            production_version = next((v for v in other_versions if v.status == VersionStatus.PRODUCTION), None)
            if production_version:
                prompt.current_version_id = production_version.id
            else:
                # Otherwise take the latest by creation date
                latest_version = max(other_versions, key=lambda v: v.created_at)
                prompt.current_version_id = latest_version.id

    # Delete version
    await session.delete(version)
    await session.commit()

    return {
        "success": True,
        "message": f"Version {version.version_number} has been deleted successfully",
        "version_id": version_id,
        "deleted_at": datetime.now(timezone.utc).isoformat()
    }


@router.patch("/{prompt_id}", response_model=PromptResponse)
async def patch_prompt(
        prompt_id: str,
        prompt_update: PromptUpdate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Partially update a prompt (PATCH method)"""
    result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Update only provided fields
    update_data = prompt_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(prompt, field, value)

    # Set updated_by field
    prompt.updated_by = current_user.id

    await session.commit()

    # Reload with relationships
    query = select(Prompt).options(
        joinedload(Prompt.creator),
        joinedload(Prompt.updater),
        selectinload(Prompt.versions),
        selectinload(Prompt.production_version),
        selectinload(Prompt.current_version),
        selectinload(Prompt.tags)
    ).where(Prompt.id == prompt_id)

    result = await session.execute(query)
    updated_prompt = result.unique().scalar_one()

    return PromptResponse(**convert_prompt_to_response(updated_prompt))


@router.patch("/{prompt_id}/versions/{version_id}", response_model=PromptVersionResponse)
async def patch_prompt_version(
        prompt_id: str,
        version_id: str,
        version_update: PromptVersionUpdate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Partially update a prompt version (PATCH method) - updates only provided fields"""
    # Check that prompt exists
    prompt_result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    if not prompt_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Find version with tags
    version_result = await session.execute(
        select(PromptVersion)
        .where(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt_id
        )
    )
    version = version_result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # PATCH: Update only provided fields
    update_data = version_update.model_dump(exclude_unset=True)

    # Set updated_by field
    version.updated_by = current_user.id

    # Also update the prompt's updated_by field since the version was modified
    prompt_result = await session.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = prompt_result.scalar_one()
    prompt.updated_by = current_user.id

    for field, value in update_data.items():
        setattr(version, field, value)

    await session.commit()

    # Reload version
    query = select(PromptVersion).options(
        joinedload(PromptVersion.creator),
        joinedload(PromptVersion.updater)
    ).where(PromptVersion.id == version_id)

    result = await session.execute(query)
    updated_version = result.scalar_one()

    return PromptVersionResponse(**convert_prompt_version_to_response(updated_version))


@router.get("/{prompt_id}/performance-stats")
async def get_prompt_performance_stats(
    prompt_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get 24h performance statistics for prompt editor panel"""
    try:
        print(f"[Performance Stats] Request for prompt_id: {prompt_id}")
        print(f"[Performance Stats] Current user: {current_user.username if current_user else 'None'}")
        
        # Verify prompt exists
        prompt_result = await session.execute(
            select(Prompt).where(Prompt.id == prompt_id)
        )
        prompt = prompt_result.scalar_one_or_none()
        if not prompt:
            print(f"[Performance Stats] Prompt not found: {prompt_id}")
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        stats_service = StatisticsService(session)
        
        # Get 24h statistics
        stats_24h = await stats_service.get_prompt_stats(UUID(prompt_id), 24)
        
        # Calculate success rate for 200 status codes
        total_requests = stats_24h.get("total_requests", 0)
        successful_requests = stats_24h.get("successful_requests", 0)
        
        # Get breakdown by source
        requests_by_source = stats_24h.get("requests_by_source", {})
        
        # Calculate average latency from logs directly
        from app.models.product_api_key import ProductAPILog
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        # Get recent logs for latency calculation
        logs_query = select(ProductAPILog.latency_ms).where(
            ProductAPILog.prompt_id == UUID(prompt_id),
            ProductAPILog.created_at >= cutoff_time,
            ProductAPILog.latency_ms.isnot(None)
        )
        
        logs_result = await session.execute(logs_query)
        latencies = [row[0] for row in logs_result.fetchall()]
        
        avg_response_time = int(sum(latencies) / len(latencies)) if latencies else 0
        
        # Get status 200 percentage
        logs_200_query = select(func.count(ProductAPILog.id)).where(
            ProductAPILog.prompt_id == UUID(prompt_id),
            ProductAPILog.created_at >= cutoff_time,
            ProductAPILog.status_code == 200
        )
        
        result_200 = await session.execute(logs_200_query)
        status_200_count = result_200.scalar() or 0
        
        success_rate_200 = round((status_200_count / total_requests * 100) if total_requests > 0 else 0, 1)
        
        return {
            "prompt_id": prompt_id,
            "period_hours": 24,
            "total_requests": total_requests,
            "requests_by_source": requests_by_source,
            "success_rate_200_percent": success_rate_200,
            "avg_response_time_ms": avg_response_time,
            "status_200_count": status_200_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving prompt performance stats: {str(e)}"
        )
