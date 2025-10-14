from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import hashlib
import json
from uuid import UUID
import secrets
import time
from datetime import datetime

from app.core.database import get_session
from app.models.prompt import Prompt, VersionStatus
from app.models.product_api_key import ProductAPIKey
from app.core.product_auth import (
    get_product_api_key,
    get_user_from_api_key
)
from app.services.limits import LimitsService
from app.services.redis import redis_client
from app.models.analytics import ABTest


router = APIRouter(tags=["external api"])


async def get_user_workspace(db: AsyncSession, user) -> UUID:
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
        raise HTTPException(status_code=404, detail="User has no workspace")

    return workspace.id


def generate_trace_id(slug: str) -> str:
    """Generate unique trace ID"""
    timestamp = str(int(time.time()))
    random_part = secrets.token_hex(4)
    slug_hash = hashlib.sha1(slug.encode()).hexdigest()[:8]
    return f"evt_{slug_hash}_{timestamp}_{random_part}"


async def get_ab_test_version(session: AsyncSession, prompt_id: UUID, workspace_id: UUID) -> Optional[dict]:
    """
    Check if there's an active A/B test for this prompt and return appropriate version.
    Only considers active (running) tests, ignoring completed ones.
    Returns dict with version_id, test info, or None to use production version.
    """
    try:
        # Find ONLY active A/B tests for this prompt (ignore completed tests)
        # Get the most recent running test only
        result = await session.execute(
            select(ABTest).where(
                and_(
                    ABTest.prompt_id == prompt_id,
                    ABTest.workspace_id == workspace_id,
                    ABTest.status == 'running'  # Only running tests, not completed
                )
            ).order_by(ABTest.created_at.desc())
        )

        # Get only the first (most recent) running test
        ab_test = result.scalars().first()

        # Debug logging to understand what's happening
        if not ab_test:
            print(f"[A/B TEST DEBUG] No active tests found for prompt {prompt_id}, using production version")
            return None

        print(f"[A/B TEST DEBUG] Found running test: {ab_test.name} (ID: {ab_test.id}, Status: {ab_test.status}, Created: {ab_test.created_at})")

        # Check if we've reached the total request limit
        total_served = ab_test.version_a_requests + ab_test.version_b_requests

        if total_served >= ab_test.total_requests:
            # Automatically complete the test when limit is reached
            if ab_test.status == 'running':
                ab_test.status = 'completed'
                ab_test.ended_at = datetime.utcnow()
                await session.commit()
            return None  # Use production version when test is exhausted

        # Determine which version to serve for 50/50 split
        # Use the version that has been served fewer times
        if ab_test.version_a_requests <= ab_test.version_b_requests:
            # Serve version A
            ab_test.version_a_requests += 1
            version_to_serve = ab_test.version_a_id
            variant = "version_a"
        else:
            # Serve version B
            ab_test.version_b_requests += 1
            version_to_serve = ab_test.version_b_id
            variant = "version_b"

        await session.commit()

        return {
            "version_id": version_to_serve,
            "ab_test_id": str(ab_test.id),
            "ab_test_name": ab_test.name,
            "ab_test_variant": variant
        }

    except Exception as e:
        print(f"Error in A/B testing: {e}")
        return None  # Fall back to production version


class GetPromptRequest(BaseModel):
    """Request model for getting prompt"""
    slug: str = Field(..., description="Prompt slug (required)")
    source_name: str = Field(..., description="Source name - username who created the prompt (required)")

    # Optional filters
    version_number: Optional[int] = Field(None, description="Specific version number")
    status: Optional[str] = Field(None, description="Version status filter (draft, testing, production, deprecated)")


class PromptContentResponse(BaseModel):
    """Response model for prompt content"""
    slug: str
    source_name: str
    version_number: int
    status: str

    # Prompt content
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None

    # Metadata
    variables: List[dict] = []
    model_config: Dict[str, Any] = {}
    deployed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    trace_id: str = Field(..., description="Unique trace ID for this request")

    # A/B Test metadata
    ab_test_id: Optional[str] = Field(None, description="A/B test ID if this response is part of an A/B test")
    ab_test_name: Optional[str] = Field(None, description="A/B test name if this response is part of an A/B test")
    ab_test_variant: Optional[str] = Field(None, description="A/B test variant (version_a or version_b)")


# Note: get_prompt function is defined in public_api.py to avoid duplication
# This router only contains utility functions and models for A/B testing

# Import events API for external access
# Note: events_router is included in public_api_router to avoid duplication