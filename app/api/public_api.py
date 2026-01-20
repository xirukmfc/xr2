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
import random
from datetime import datetime, timezone

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
from app.services.event_logger import EventLogger


# Публичный роутер только с двумя методами
public_api_router = APIRouter(tags=["external api"])


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

        if not ab_test:
            return None

        # Validate that versions are set
        if not ab_test.version_a_id or not ab_test.version_b_id:
            return None  # Can't serve test without versions

        # Check if we've reached the total request limit
        total_served = ab_test.version_a_requests + ab_test.version_b_requests

        if total_served >= ab_test.total_requests:
            # Automatically complete the test when limit is reached
            if ab_test.status == 'running':
                ab_test.status = 'completed'
                ab_test.ended_at = datetime.utcnow()
                await session.commit()
            return None  # Use production version when test is exhausted

        # Determine which version to serve using random 50/50 split
        # Random selection ensures statistical independence of each request
        # (round-robin can create selection bias with non-uniform traffic patterns)
        if random.random() < 0.5:
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

    except Exception:
        return None  # Fall back to production version


class GetPromptRequest(BaseModel):
    """Request model for getting prompt"""
    slug: str = Field(..., description="Prompt slug", examples=["customer-support-greeting"])
    source_name: str = Field(..., description="Username of the prompt creator", examples=["john_doe"])

    # Optional filters
    version_number: Optional[int] = Field(None, description="Specific version number to retrieve", examples=[2])
    status: Optional[str] = Field(
        None,
        description="Version status filter",
        examples=["production"],
        pattern="^(draft|testing|production|inactive|deprecated)$"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "slug": "customer-support-greeting",
                    "source_name": "john_doe"
                },
                {
                    "slug": "customer-support-greeting",
                    "source_name": "john_doe",
                    "version_number": 2
                },
                {
                    "slug": "customer-support-greeting",
                    "source_name": "john_doe",
                    "status": "production"
                }
            ]
        }
    }


class PromptContentResponse(BaseModel):
    """Response model for prompt content"""
    slug: str = Field(..., description="Prompt slug")
    source_name: str = Field(..., description="Username of the prompt creator")
    version_number: int = Field(..., description="Version number")
    status: str = Field(..., description="Version status (draft, testing, production, etc.)")

    # Prompt content
    system_prompt: Optional[str] = Field(None, description="System prompt content")
    user_prompt: Optional[str] = Field(None, description="User prompt content")
    assistant_prompt: Optional[str] = Field(None, description="Assistant prompt content")

    # Metadata
    variables: List[dict] = Field(default_factory=list, description="List of prompt variables")
    model_config: Dict[str, Any] = Field(default_factory=dict, description="Model configuration")
    deployed_at: Optional[datetime] = Field(None, description="Deployment timestamp")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    trace_id: str = Field(..., description="Unique trace ID for tracking events. Save this to link events back to this prompt request.")

    # A/B Test metadata
    ab_test_id: Optional[str] = Field(None, description="A/B test ID if this is part of an active A/B test")
    ab_test_name: Optional[str] = Field(None, description="A/B test name")
    ab_test_variant: Optional[str] = Field(None, description="A/B test variant (version_a or version_b)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "slug": "customer-support-greeting",
                    "source_name": "john_doe",
                    "version_number": 1,
                    "status": "production",
                    "system_prompt": "You are a helpful customer support agent.",
                    "user_prompt": "Help the customer with {{issue}}",
                    "assistant_prompt": None,
                    "variables": [{"name": "issue", "type": "string", "defaultValue": ""}],
                    "model_config": {},
                    "trace_id": "evt_abc123_1634567890_xyz",
                    "deployed_at": "2024-01-15T10:30:00Z",
                    "created_at": "2024-01-15T10:00:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "ab_test_id": None,
                    "ab_test_name": None,
                    "ab_test_variant": None
                }
            ]
        }
    }


@public_api_router.post(
    "/get-prompt",
    response_model=PromptContentResponse,
    summary="Get Prompt Content",
    description="""Retrieve prompt content by slug. Returns production version by default or specific version if filters are provided.

**Authentication:** Requires API key in header `Authorization': Bearer xr2_prod_YOUR_API_KEY

**Get API Key:** Visit https://xr2.uk/api-keys → Click "Create Keys" → Copy your key

**Default Behavior:** Returns the deployed (production) version of the prompt

**Filtering:** Use `version_number` or `status` to get specific versions

**Important:** Save the `trace_id` from response to track events later (see POST /events)

**A/B Testing:** If an active A/B test exists, the response will include `ab_test_id`, `ab_test_name`, and `ab_test_variant`

**Variables:** Prompts may contain variables like `{{variable_name}}` - substitute them in your application before use

**Rate Limits:** Apply based on your subscription plan
""",
    responses={
        200: {
            "description": "Successful response with prompt content",
            "content": {
                "application/json": {
                    "example": {
                        "slug": "customer-support-greeting",
                        "source_name": "john_doe",
                        "version_number": 1,
                        "status": "production",
                        "system_prompt": "You are a helpful customer support agent.",
                        "user_prompt": "Help the customer with {{issue}}",
                        "assistant_prompt": None,
                        "variables": [{"name": "issue", "type": "string", "defaultValue": ""}],
                        "model_config": {},
                        "trace_id": "evt_abc123_1634567890_xyz",
                        "deployed_at": "2024-01-15T10:30:00Z",
                        "created_at": "2024-01-15T10:00:00Z",
                        "updated_at": "2024-01-15T10:30:00Z",
                        "ab_test_id": None,
                        "ab_test_name": None,
                        "ab_test_variant": None
                    }
                }
            }
        },
        404: {"description": "Prompt not found or no production version available"},
        429: {"description": "API rate limit exceeded"},
        401: {"description": "Invalid or missing API key"}
    }
)
async def get_prompt(
        request: Request,
        prompt_request: GetPromptRequest,
        session: AsyncSession = Depends(get_session),
        api_key: ProductAPIKey = Depends(get_product_api_key)
):
    """Get prompt content by slug and source name"""
    start_time = time.time()

    # Store the request payload for logging
    request_payload = prompt_request.model_dump()

    try:
        # Get user from API key
        user = await get_user_from_api_key(api_key, session)

        # Check API limits
        limits_service = LimitsService(session)
        can_request, current_count, max_requests, reset_time = await limits_service.check_api_limit(user.id)

        if not can_request:
            # Note: Error logging is handled by ProductAPILoggingMiddleware
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "API rate limit exceeded",
                    "current_usage": current_count,
                    "max_requests_per_day": max_requests,
                    "reset_time": reset_time.isoformat(),
                    "message": f"You have used {current_count} out of {max_requests} daily API requests. Your limit will reset at {reset_time.strftime('%Y-%m-%d %H:%M:%S UTC')}."
                }
            )
        # Use the user from API key to find prompts (source_name is just informational)
        # Find prompt by slug and user (from API key)
        prompt_stmt = select(Prompt).options(
            selectinload(Prompt.versions)
        ).where(
            and_(
                Prompt.slug == prompt_request.slug,
                Prompt.created_by == user.id
            )
        )

        result = await session.execute(prompt_stmt)
        prompt = result.scalar_one_or_none()

        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "Prompt not found",
                    "message": f"No prompt with slug '{prompt_request.slug}' found for user '{user.username}' (API key owner)",
                    "slug": prompt_request.slug,
                    "api_key_owner": user.username,
                    "source_name": prompt_request.source_name
                }
            )

        # Find the appropriate version
        target_version = None
        ab_test_info = None

        # Check if specific filters are provided
        has_filters = prompt_request.version_number is not None or prompt_request.status is not None

        if has_filters:
            # Apply filters - version_number and/or status
            candidates = prompt.versions

            # Filter by version_number if specified
            if prompt_request.version_number is not None:
                candidates = [v for v in candidates if v.version_number == prompt_request.version_number]

                if not candidates:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail={
                            "error": "Version not found",
                            "message": f"Version {prompt_request.version_number} not found for prompt '{prompt_request.slug}'",
                            "version_number": prompt_request.version_number,
                            "slug": prompt_request.slug,
                            "available_versions": [v.version_number for v in prompt.versions]
                        }
                    )

            # Filter by status if specified
            if prompt_request.status:
                try:
                    version_status = VersionStatus(prompt_request.status)
                    candidates = [v for v in candidates if v.status == version_status]

                    if not candidates:
                        available_statuses = list(set([v.status.value for v in prompt.versions]))
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail={
                                "error": "Version with status not found",
                                "message": f"No version with status '{prompt_request.status}' found for prompt '{prompt_request.slug}'",
                                "requested_status": prompt_request.status,
                                "slug": prompt_request.slug,
                                "available_statuses": available_statuses
                            }
                        )

                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "error": "Invalid status value",
                            "message": f"Status '{prompt_request.status}' is not valid",
                            "provided_status": prompt_request.status,
                            "valid_statuses": [s.value for s in VersionStatus]
                        }
                    )

            # Get the most recent version from filtered candidates
            target_version = sorted(candidates, key=lambda v: v.created_at, reverse=True)[0]

        else:
            # Default: find deployed (production) version, but check for A/B tests first

            # Initialize ab_test_info to None
            ab_test_info = None

            # Check for active A/B tests
            workspace_id = await get_user_workspace(session, user)
            ab_test_result = await get_ab_test_version(session, prompt.id, workspace_id)

            if ab_test_result:
                # Use A/B test version
                ab_test_version = next((v for v in prompt.versions if v.id == ab_test_result["version_id"]), None)
                if ab_test_version:
                    target_version = ab_test_version
                    ab_test_info = ab_test_result
                else:
                    # Fall back to production if A/B test version not found
                    production_versions = [v for v in prompt.versions if v.status == VersionStatus.PRODUCTION]
                    if production_versions:
                        target_version = sorted(production_versions, key=lambda v: v.created_at, reverse=True)[0]
                    ab_test_info = None  # Clear A/B test info if version not found
            else:
                # Use production version
                production_versions = [v for v in prompt.versions if v.status == VersionStatus.PRODUCTION]

                if not production_versions:
                    available_statuses = list(set([v.status.value for v in prompt.versions]))
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail={
                            "error": "No deployed version found",
                            "message": f"No deployed (production) version found for prompt '{prompt_request.slug}'",
                            "slug": prompt_request.slug,
                            "available_statuses": available_statuses,
                            "suggestion": "Use 'version_number' or 'status' parameter to access specific versions"
                        }
                    )

                target_version = sorted(production_versions, key=lambda v: v.deployed_at or v.created_at, reverse=True)[0]

        trace_id = generate_trace_id(prompt_request.slug)

        # Get user's workspace
        workspace_id = await get_user_workspace(session, user)

        trace_context = {
            "prompt_id": str(prompt.id),
            "prompt_version_id": str(target_version.id),
            "workspace_id": str(workspace_id),
            "slug": prompt_request.slug,
            "source": request_payload["source_name"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await redis_client.setex(
            f"trace:{trace_id}",
            30 * 24 * 60 * 60,  # 30 days in seconds
            json.dumps(trace_context)
        )

        # Create response
        response = PromptContentResponse(
            slug=prompt.slug,
            source_name=prompt_request.source_name,
            version_number=target_version.version_number,
            status=target_version.status.value,
            system_prompt=target_version.system_prompt,
            user_prompt=target_version.user_prompt,
            assistant_prompt=target_version.assistant_prompt,
            variables=target_version.variables or [],
            model_config=target_version.model_config or {},
            deployed_at=target_version.deployed_at,
            created_at=target_version.created_at,
            updated_at=target_version.updated_at,
            trace_id=trace_id,
            # A/B Test information
            ab_test_id=ab_test_info["ab_test_id"] if ab_test_info else None,
            ab_test_name=ab_test_info["ab_test_name"] if ab_test_info else None,
            ab_test_variant=ab_test_info["ab_test_variant"] if ab_test_info else None
        )

        # Increment API usage counter
        await limits_service.increment_api_usage(user.id)

        # Create prompt_request event for analytics
        from app.models.analytics import PromptEvent
        prompt_request_event = PromptEvent(
            workspace_id=workspace_id,
            trace_id=trace_id,
            prompt_id=prompt.id,
            prompt_version_id=target_version.id,
            event_type="prompt_request",
            outcome="success",
            session_id=None,
            user_id=None,
            event_metadata={
                "event_name": "prompt_request",
                "category": "api",
                "prompt_slug": prompt.slug,
                "prompt_name": prompt.name,
                "version_number": target_version.version_number,
                "source_name": prompt_request.source_name
            },
            business_metrics=None,
            error_details=None,
            created_at=datetime.now(timezone.utc)
        )
        session.add(prompt_request_event)
        await session.commit()

        # Log API request event with source_name for monitoring dashboard
        latency_ms = int((time.time() - start_time) * 1000)
        await EventLogger.log_api_request(
            db=session,
            endpoint="/api/v1/get-prompt",
            user_id=user.id,
            workspace_id=workspace_id,
            source_name=prompt_request.source_name,
            prompt_id=prompt.id,
            latency_ms=latency_ms,
            status="success",
        )
        await session.commit()

        # Note: Logging is handled by ProductAPILoggingMiddleware
        # Store metadata for middleware to use
        request.state.prompt_id = prompt.id
        request.state.prompt_version_id = target_version.id
        request.state.trace_id = trace_id

        return response

    except HTTPException as http_ex:
        # Note: Error logging is handled by ProductAPILoggingMiddleware
        raise
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving prompt: {error_msg}"
        )


class CheckAPIKeyResponse(BaseModel):
    """Response model for API key check"""
    ok: bool = Field(..., description="API key is valid")
    user: str = Field(..., description="Username of the API key owner")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "ok": True,
                    "user": "www"
                }
            ]
        }
    }


@public_api_router.get(
    "/check-api-key",
    response_model=CheckAPIKeyResponse,
    summary="Check API Key",
    description="""Validate your API key and get the username associated with it.

**Authentication:** Requires API key in header `Authorization: Bearer xr2_prod_YOUR_KEY`

**Get API Key:** Visit https://xr2.uk/api-keys → Click "Create Keys" → Copy your key

**Use Case:** Test your API key before making other API calls, or verify which user account owns the key

**Response:** Returns `ok: true` and the username if the key is valid
""",
    responses={
        200: {
            "description": "API key is valid",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "user": "www"
                    }
                }
            }
        },
        401: {"description": "Invalid or missing API key"}
    }
)
async def check_api_key(
        session: AsyncSession = Depends(get_session),
        api_key: ProductAPIKey = Depends(get_product_api_key)
):
    """Check if API key is valid and return the username"""
    try:
        # Get user from API key
        user = await get_user_from_api_key(api_key, session)
        workspace_id = await get_user_workspace(session, user)

        # Log API request event for monitoring
        await EventLogger.log_api_request(
            db=session,
            endpoint="/api/v1/check-api-key",
            user_id=user.id,
            workspace_id=workspace_id,
            source_name=user.username,
            status="success",
        )
        await session.commit()

        return CheckAPIKeyResponse(
            ok=True,
            user=user.username
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking API key: {str(e)}"
        )


# Import events API for external access
from app.api.events import router as events_router

# Add events routes to public API router (external API)
public_api_router.include_router(events_router, prefix="", tags=["external api"])









