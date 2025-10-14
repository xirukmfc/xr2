from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.analytics import ABTest
from app.models.prompt import Prompt, PromptVersion
from app.models.user import User
from app.core.database import get_session as get_db
from app.core.auth import get_current_user

router = APIRouter(prefix="/ab-tests-simple", tags=["ab-tests-simple"])


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
class ABTestCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    prompt_id: UUID
    version_a_id: UUID  # Control version
    version_b_id: UUID  # Variant version
    total_requests: int = Field(..., ge=1, le=10000)


class ABTestResponse(BaseModel):
    id: UUID
    name: str
    prompt_id: UUID
    prompt_name: str
    version_a_id: UUID
    version_a_name: str
    version_b_id: UUID
    version_b_name: str
    total_requests: int
    version_a_requests: int
    version_b_requests: int
    status: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


# Test endpoints (no authentication required)
@router.get("/test")
async def get_test_ab_tests(db: AsyncSession = Depends(get_db)):
    """Get A/B tests for testing (no authentication)"""
    try:
        # Get first real workspace_id from the database
        from app.models.workspace import Workspace
        workspace_query = await db.execute(
            select(Workspace.id).limit(1)
        )
        workspace_row = workspace_query.first()

        if not workspace_row:
            return []

        workspace_id = workspace_row.id

        # Get all A/B tests for this workspace
        result = await db.execute(
            select(ABTest).options(
                selectinload(ABTest.prompt),
                selectinload(ABTest.version_a),
                selectinload(ABTest.version_b)
            ).where(
                ABTest.workspace_id == workspace_id
            ).order_by(ABTest.created_at.desc())
        )
        tests = result.scalars().all()

        return [
            {
                "id": str(test.id),
                "name": test.name,
                "prompt_id": str(test.prompt_id),
                "prompt_name": test.prompt.name if test.prompt else "Unknown",
                "version_a_id": str(test.version_a_id),
                "version_a_name": f"v{test.version_a.version_number}" if test.version_a else "Unknown",
                "version_b_id": str(test.version_b_id),
                "version_b_name": f"v{test.version_b.version_number}" if test.version_b else "Unknown",
                "total_requests": test.total_requests,
                "version_a_requests": test.version_a_requests,
                "version_b_requests": test.version_b_requests,
                "status": test.status,
                "started_at": test.started_at.isoformat() if test.started_at else None,
                "ended_at": test.ended_at.isoformat() if test.ended_at else None,
                "created_at": test.created_at.isoformat(),
                "updated_at": test.updated_at.isoformat()
            }
            for test in tests
        ]
    except Exception as e:
        return [{"error": str(e)}]


@router.post("/test")
async def create_test_ab_test(
    test_data: ABTestCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new A/B test for testing (no authentication)"""
    try:
        # Get first real workspace_id from the database
        from app.models.workspace import Workspace
        workspace_query = await db.execute(
            select(Workspace.id).limit(1)
        )
        workspace_row = workspace_query.first()

        if not workspace_row:
            raise HTTPException(404, "No workspace found")

        workspace_id = workspace_row.id

        # Validate prompt exists
        prompt_result = await db.execute(
            select(Prompt).where(Prompt.id == test_data.prompt_id)
        )
        prompt = prompt_result.scalar_one_or_none()
        if not prompt:
            raise HTTPException(404, "Prompt not found")

        # Validate versions exist
        version_a_result = await db.execute(
            select(PromptVersion).where(PromptVersion.id == test_data.version_a_id)
        )
        version_a = version_a_result.scalar_one_or_none()
        if not version_a:
            raise HTTPException(404, "Version A not found")

        version_b_result = await db.execute(
            select(PromptVersion).where(PromptVersion.id == test_data.version_b_id)
        )
        version_b = version_b_result.scalar_one_or_none()
        if not version_b:
            raise HTTPException(404, "Version B not found")

        # Check name uniqueness
        existing = await db.execute(
            select(ABTest).where(
                ABTest.workspace_id == workspace_id,
                ABTest.name == test_data.name
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(400, f"A/B test with name '{test_data.name}' already exists")

        # Create A/B test
        ab_test = ABTest(
            workspace_id=workspace_id,
            name=test_data.name,
            prompt_id=test_data.prompt_id,
            version_a_id=test_data.version_a_id,
            version_b_id=test_data.version_b_id,
            total_requests=test_data.total_requests,
            version_a_requests=0,
            version_b_requests=0,
            status='draft'
        )

        db.add(ab_test)
        await db.commit()
        await db.refresh(ab_test)

        return {
            "id": str(ab_test.id),
            "name": ab_test.name,
            "status": ab_test.status,
            "message": "A/B test created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to create A/B test: {str(e)}")


@router.post("/test/{test_id}/start")
async def start_test_ab_test(
    test_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Start an A/B test for testing (no authentication)"""
    try:
        # Get A/B test
        result = await db.execute(
            select(ABTest).where(ABTest.id == test_id)
        )
        ab_test = result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "A/B test not found")

        if ab_test.status not in ['draft', 'paused']:
            raise HTTPException(400, f"Cannot start test in status '{ab_test.status}'")

        # Start or resume the test
        ab_test.status = 'running'
        if ab_test.started_at is None:  # Only set started_at if it's the first time
            ab_test.started_at = datetime.utcnow()

        await db.commit()
        await db.refresh(ab_test)

        return {
            "id": str(ab_test.id),
            "status": ab_test.status,
            "started_at": ab_test.started_at.isoformat(),
            "message": "A/B test started successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to start A/B test: {str(e)}")


@router.post("/test/{test_id}/stop")
async def stop_test_ab_test(
    test_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Stop an A/B test for testing (no authentication)"""
    try:
        # Get A/B test
        result = await db.execute(
            select(ABTest).where(ABTest.id == test_id)
        )
        ab_test = result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "A/B test not found")

        if ab_test.status != 'running':
            raise HTTPException(400, f"Cannot stop test in status '{ab_test.status}'")

        # Pause the test (don't complete it)
        ab_test.status = 'paused'

        await db.commit()
        await db.refresh(ab_test)

        return {
            "id": str(ab_test.id),
            "status": ab_test.status,
            "message": "A/B test paused successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to stop A/B test: {str(e)}")


@router.post("/test/{test_id}/complete")
async def complete_test_ab_test(
    test_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Complete an A/B test for testing (no authentication)"""
    try:
        # Get A/B test
        result = await db.execute(
            select(ABTest).where(ABTest.id == test_id)
        )
        ab_test = result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "A/B test not found")

        if ab_test.status not in ['running', 'paused']:
            raise HTTPException(400, f"Cannot complete test in status '{ab_test.status}'")

        # Complete the test
        ab_test.status = 'completed'
        ab_test.ended_at = datetime.utcnow()

        await db.commit()
        await db.refresh(ab_test)

        return {
            "id": str(ab_test.id),
            "status": ab_test.status,
            "ended_at": ab_test.ended_at.isoformat(),
            "message": "A/B test completed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to complete A/B test: {str(e)}")


@router.delete("/test/{test_id}")
async def delete_test_ab_test(
    test_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete an A/B test for testing (no authentication)"""
    try:
        # Get A/B test
        result = await db.execute(
            select(ABTest).where(ABTest.id == test_id)
        )
        ab_test = result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "A/B test not found")

        await db.delete(ab_test)
        await db.commit()

        return {"message": "A/B test deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete A/B test: {str(e)}")


@router.get("/test/prompts")
async def get_test_prompts_with_versions(db: AsyncSession = Depends(get_db)):
    """Get prompts with their versions for testing (no authentication)"""
    try:
        # Get first real workspace_id from the database
        from app.models.workspace import Workspace
        workspace_query = await db.execute(
            select(Workspace.id).limit(1)
        )
        workspace_row = workspace_query.first()

        if not workspace_row:
            return []

        workspace_id = workspace_row.id

        # Get prompts with their versions
        result = await db.execute(
            select(Prompt).options(
                selectinload(Prompt.versions)
            ).where(
                Prompt.workspace_id == workspace_id
            ).order_by(Prompt.name)
        )
        prompts = result.scalars().all()

        return [
            {
                "id": str(prompt.id),
                "name": prompt.name,
                "slug": prompt.slug,
                "versions": [
                    {
                        "id": str(version.id),
                        "version_number": version.version_number,
                        "status": version.status,
                        "created_at": version.created_at.isoformat()
                    }
                    for version in prompt.versions
                ]
            }
            for prompt in prompts if prompt.versions
        ]
    except Exception as e:
        return [{"error": str(e)}]


# Authenticated endpoints
@router.post("/", response_model=ABTestResponse)
async def create_ab_test(
    test_data: ABTestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new A/B test"""
    workspace_id = await get_user_workspace(db, current_user)

    # Validate prompt exists and belongs to workspace
    prompt_result = await db.execute(
        select(Prompt).where(
            Prompt.id == test_data.prompt_id,
            Prompt.workspace_id == workspace_id
        )
    )
    prompt = prompt_result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(404, "Prompt not found")

    # Validate versions exist and belong to the prompt
    version_a_result = await db.execute(
        select(PromptVersion).where(
            PromptVersion.id == test_data.version_a_id,
            PromptVersion.prompt_id == test_data.prompt_id
        )
    )
    version_a = version_a_result.scalar_one_or_none()
    if not version_a:
        raise HTTPException(404, "Version A not found")

    version_b_result = await db.execute(
        select(PromptVersion).where(
            PromptVersion.id == test_data.version_b_id,
            PromptVersion.prompt_id == test_data.prompt_id
        )
    )
    version_b = version_b_result.scalar_one_or_none()
    if not version_b:
        raise HTTPException(404, "Version B not found")

    # Check name uniqueness
    existing = await db.execute(
        select(ABTest).where(
            ABTest.workspace_id == workspace_id,
            ABTest.name == test_data.name
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"A/B test with name '{test_data.name}' already exists")

    # Create A/B test
    ab_test = ABTest(
        workspace_id=workspace_id,
        name=test_data.name,
        prompt_id=test_data.prompt_id,
        version_a_id=test_data.version_a_id,
        version_b_id=test_data.version_b_id,
        total_requests=test_data.total_requests,
        version_a_requests=0,
        version_b_requests=0,
        status='draft'
    )

    db.add(ab_test)
    await db.commit()
    await db.refresh(ab_test)

    return ABTestResponse(
        id=ab_test.id,
        name=ab_test.name,
        prompt_id=ab_test.prompt_id,
        prompt_name=prompt.name,
        version_a_id=ab_test.version_a_id,
        version_a_name=f"v{version_a.version_number}",
        version_b_id=ab_test.version_b_id,
        version_b_name=f"v{version_b.version_number}",
        total_requests=ab_test.total_requests,
        version_a_requests=ab_test.version_a_requests,
        version_b_requests=ab_test.version_b_requests,
        status=ab_test.status,
        started_at=ab_test.started_at,
        ended_at=ab_test.ended_at,
        created_at=ab_test.created_at,
        updated_at=ab_test.updated_at
    )