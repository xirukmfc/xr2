from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text, case
from sqlalchemy.orm import selectinload

from app.models.analytics import ABTest, PromptEvent, CustomFunnelConfiguration
from app.models.prompt import Prompt, PromptVersion
from app.models.user import User
from app.core.database import get_session as get_db
from app.core.auth import get_current_user, get_current_user_optional
from app.api.analytics import get_user_workspace

router = APIRouter(prefix="/ab-tests-simple", tags=["ab-tests-simple"])


def calculate_statistical_significance(
    conversions_a: int, 
    total_a: int, 
    conversions_b: int, 
    total_b: int
) -> Dict[str, Any]:
    """
    Calculate statistical significance using chi-square test approximation.
    Returns confidence level and whether result is significant.
    """
    if total_a == 0 or total_b == 0:
        return {
            "confidence": 0,
            "is_significant": False,
            "p_value": 1.0,
            "message": "Not enough data"
        }
    
    # Calculate conversion rates
    rate_a = conversions_a / total_a if total_a > 0 else 0
    rate_b = conversions_b / total_b if total_b > 0 else 0
    
    # Pooled conversion rate
    pooled_rate = (conversions_a + conversions_b) / (total_a + total_b)
    
    if pooled_rate == 0 or pooled_rate == 1:
        return {
            "confidence": 0,
            "is_significant": False,
            "p_value": 1.0,
            "message": "Conversion rate is 0% or 100%"
        }
    
    # Standard error
    se = math.sqrt(pooled_rate * (1 - pooled_rate) * (1/total_a + 1/total_b))
    
    if se == 0:
        return {
            "confidence": 0,
            "is_significant": False,
            "p_value": 1.0,
            "message": "Standard error is zero"
        }
    
    # Z-score
    z_score = abs(rate_a - rate_b) / se
    
    # Convert z-score to confidence (approximation)
    # 1.645 = 90%, 1.96 = 95%, 2.576 = 99%
    if z_score >= 2.576:
        confidence = 99
    elif z_score >= 1.96:
        confidence = 95
    elif z_score >= 1.645:
        confidence = 90
    elif z_score >= 1.28:
        confidence = 80
    else:
        confidence = min(int(z_score / 1.96 * 95), 79)
    
    # P-value approximation (simplified)
    p_value = 2 * (1 - min(0.5 + z_score * 0.2, 0.9999))
    
    return {
        "confidence": confidence,
        "is_significant": confidence >= 95,
        "p_value": round(p_value, 4),
        "z_score": round(z_score, 3),
        "message": "Statistically significant" if confidence >= 95 else f"Need more data for 95% confidence"
    }


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
    funnel_config_id: Optional[UUID] = None  # Optional funnel for success metric


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


# Test endpoints (uses auth if token provided, otherwise fallback to first workspace)
@router.get("/test")
async def get_test_ab_tests(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get A/B tests for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
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
                selectinload(ABTest.version_b),
                selectinload(ABTest.funnel_config)
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
                "funnel_config_id": str(test.funnel_config_id) if test.funnel_config_id else None,
                "funnel_config_name": test.funnel_config.name if test.funnel_config else None,
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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Create a new A/B test for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
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

        # Validate funnel config if provided
        if test_data.funnel_config_id:
            funnel_result = await db.execute(
                select(CustomFunnelConfiguration).where(
                    CustomFunnelConfiguration.id == test_data.funnel_config_id
                )
            )
            funnel = funnel_result.scalar_one_or_none()
            if not funnel:
                raise HTTPException(404, "Funnel configuration not found")

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
            funnel_config_id=test_data.funnel_config_id,
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


@router.get("/test/funnels")
async def get_test_funnels(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get funnel configurations for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
            )
            workspace_row = workspace_query.first()
            if not workspace_row:
                return []
            workspace_id = workspace_row.id

        # Get all active funnels
        result = await db.execute(
            select(CustomFunnelConfiguration).where(
                CustomFunnelConfiguration.workspace_id == workspace_id,
                CustomFunnelConfiguration.is_active == True
            ).order_by(CustomFunnelConfiguration.name)
        )
        funnels = result.scalars().all()

        return [
            {
                "id": str(funnel.id),
                "name": funnel.name,
                "description": funnel.description,
                "event_steps": funnel.event_steps
            }
            for funnel in funnels
        ]
    except Exception as e:
        return [{"error": str(e)}]


@router.get("/test/prompts")
async def get_test_prompts_with_versions(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get prompts with their versions for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
            result = await db.execute(
                select(Prompt).options(
                    selectinload(Prompt.versions)
                ).where(
                    Prompt.workspace_id == workspace_id
                ).order_by(Prompt.name)
            )
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
            )
            workspace_row = workspace_query.first()
            if not workspace_row:
                return []
            workspace_id = workspace_row.id
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


@router.post("/test/{test_id}/start")
async def start_test_ab_test(
    test_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Start an A/B test for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
            )
            workspace_row = workspace_query.first()
            if not workspace_row:
                raise HTTPException(404, "No workspace found")
            workspace_id = workspace_row.id

        # Get A/B test (only from user's workspace)
        result = await db.execute(
            select(ABTest).where(
                ABTest.id == test_id,
                ABTest.workspace_id == workspace_id
            )
        )
        ab_test = result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "A/B test not found")

        if ab_test.status not in ['draft', 'paused']:
            raise HTTPException(400, f"Cannot start test in status '{ab_test.status}'")

        # Start or resume the test
        ab_test.status = 'running'
        if ab_test.started_at is None:  # Only set started_at if it's the first time
            ab_test.started_at = datetime.now(timezone.utc)

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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Stop an A/B test for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
            )
            workspace_row = workspace_query.first()
            if not workspace_row:
                raise HTTPException(404, "No workspace found")
            workspace_id = workspace_row.id

        # Get A/B test (only from user's workspace)
        result = await db.execute(
            select(ABTest).where(
                ABTest.id == test_id,
                ABTest.workspace_id == workspace_id
            )
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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Complete an A/B test for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
            )
            workspace_row = workspace_query.first()
            if not workspace_row:
                raise HTTPException(404, "No workspace found")
            workspace_id = workspace_row.id

        # Get A/B test (only from user's workspace)
        result = await db.execute(
            select(ABTest).where(
                ABTest.id == test_id,
                ABTest.workspace_id == workspace_id
            )
        )
        ab_test = result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "A/B test not found")

        if ab_test.status not in ['running', 'paused']:
            raise HTTPException(400, f"Cannot complete test in status '{ab_test.status}'")

        # Complete the test
        ab_test.status = 'completed'
        ab_test.ended_at = datetime.now(timezone.utc)

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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Delete an A/B test for testing (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
            )
            workspace_row = workspace_query.first()
            if not workspace_row:
                raise HTTPException(404, "No workspace found")
            workspace_id = workspace_row.id

        # Get A/B test (only from user's workspace)
        result = await db.execute(
            select(ABTest).where(
                ABTest.id == test_id,
                ABTest.workspace_id == workspace_id
            )
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


async def get_metadata_aggregations(
    db: AsyncSession,
    version_a_id: UUID,
    version_b_id: UUID,
    started_at,
    ended_at
) -> dict:
    """Calculate metadata aggregations for A/B test comparison"""
    
    # Get all events with metadata for both versions
    conditions_a = [PromptEvent.prompt_version_id == version_a_id]
    conditions_b = [PromptEvent.prompt_version_id == version_b_id]
    
    if started_at:
        conditions_a.append(PromptEvent.created_at >= started_at)
        conditions_b.append(PromptEvent.created_at >= started_at)
    if ended_at:
        conditions_a.append(PromptEvent.created_at <= ended_at)
        conditions_b.append(PromptEvent.created_at <= ended_at)
    
    # Fetch events with metadata
    events_a_result = await db.execute(
        select(PromptEvent.event_metadata, PromptEvent.business_metrics).where(and_(*conditions_a))
    )
    events_a = events_a_result.all()
    
    events_b_result = await db.execute(
        select(PromptEvent.event_metadata, PromptEvent.business_metrics).where(and_(*conditions_b))
    )
    events_b = events_b_result.all()
    
    # Skip these internal fields
    skip_fields = {'event_name', 'category', 'prompt_name', 'prompt_slug', 'version_number', 'source_name'}
    
    def extract_numeric_fields(events_list):
        """Extract numeric values from metadata and business_metrics"""
        field_values = {}
        for event_metadata, business_metrics in events_list:
            # Process event_metadata
            if event_metadata:
                for key, value in event_metadata.items():
                    if key in skip_fields:
                        continue
                    if isinstance(value, (int, float)) and not isinstance(value, bool):
                        if key not in field_values:
                            field_values[key] = []
                        field_values[key].append(float(value))
            
            # Process business_metrics (usually contains revenue, etc.)
            if business_metrics:
                for key, value in business_metrics.items():
                    if isinstance(value, (int, float)) and not isinstance(value, bool):
                        if key not in field_values:
                            field_values[key] = []
                        field_values[key].append(float(value))
        
        return field_values
    
    fields_a = extract_numeric_fields(events_a)
    fields_b = extract_numeric_fields(events_b)
    
    # Get all unique numeric fields
    all_fields = set(fields_a.keys()) | set(fields_b.keys())
    
    # Calculate aggregations for each field
    numeric_comparisons = []
    for field_name in sorted(all_fields):
        values_a = fields_a.get(field_name, [])
        values_b = fields_b.get(field_name, [])
        
        def calc_stats(values):
            if not values:
                return {"sum": 0, "avg": 0, "min": 0, "max": 0, "count": 0}
            return {
                "sum": round(sum(values), 2),
                "avg": round(sum(values) / len(values), 2),
                "min": round(min(values), 2),
                "max": round(max(values), 2),
                "count": len(values)
            }
        
        stats_a = calc_stats(values_a)
        stats_b = calc_stats(values_b)
        
        # Determine winner based on average (higher is better for revenue/amount)
        winner = None
        if stats_a["count"] > 0 and stats_b["count"] > 0:
            if stats_b["avg"] > stats_a["avg"]:
                winner = "B"
            elif stats_a["avg"] > stats_b["avg"]:
                winner = "A"
        
        numeric_comparisons.append({
            "field": field_name,
            "version_a": stats_a,
            "version_b": stats_b,
            "diff_avg": round(stats_b["avg"] - stats_a["avg"], 2) if stats_a["count"] > 0 else 0,
            "diff_percent": round(((stats_b["avg"] - stats_a["avg"]) / stats_a["avg"] * 100), 1) if stats_a["avg"] > 0 else 0,
            "winner": winner
        })
    
    return {
        "numeric_comparisons": numeric_comparisons
    }


@router.get("/test/{test_id}/results")
async def get_test_ab_test_results(
    test_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get A/B test results with metrics and statistical significance (uses auth if available)"""
    try:
        # If user is authenticated, get their workspace
        if current_user:
            workspace_id = await get_user_workspace(db, current_user)
        else:
            # Fallback: get first workspace for unauthenticated requests
            from app.models.workspace import Workspace
            workspace_query = await db.execute(
                select(Workspace.id).order_by(Workspace.created_at.asc()).limit(1)
            )
            workspace_row = workspace_query.first()
            if not workspace_row:
                raise HTTPException(404, "No workspace found")
            workspace_id = workspace_row.id

        # Get A/B test with relationships (only from user's workspace)
        result = await db.execute(
            select(ABTest).options(
                selectinload(ABTest.prompt),
                selectinload(ABTest.version_a),
                selectinload(ABTest.version_b),
                selectinload(ABTest.funnel_config)
            ).where(
                ABTest.id == test_id,
                ABTest.workspace_id == workspace_id
            )
        )
        ab_test = result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "A/B test not found")

        # Event type aliases - map common names to actual event types
        EVENT_ALIASES = {
            "get_prompt": "prompt_request",
            "prompt_request": "prompt_request",
        }

        # Find all trace_ids from prompt_request events during the test
        # This is the correct way to link events to the test - via trace_id
        trace_conditions_a = [
            PromptEvent.prompt_version_id == ab_test.version_a_id,
            PromptEvent.event_type == 'prompt_request'
        ]
        trace_conditions_b = [
            PromptEvent.prompt_version_id == ab_test.version_b_id,
            PromptEvent.event_type == 'prompt_request'
        ]
        
        # Apply date filters only for prompt_request events (to identify test traces)
        if ab_test.started_at:
            trace_conditions_a.append(PromptEvent.created_at >= ab_test.started_at)
            trace_conditions_b.append(PromptEvent.created_at >= ab_test.started_at)
        if ab_test.ended_at:
            trace_conditions_a.append(PromptEvent.created_at <= ab_test.ended_at)
            trace_conditions_b.append(PromptEvent.created_at <= ab_test.ended_at)
        
        # Get trace_ids for version A
        trace_ids_a_result = await db.execute(
            select(PromptEvent.trace_id.distinct()).where(and_(*trace_conditions_a))
        )
        trace_ids_a = {row[0] for row in trace_ids_a_result}
        
        # Get trace_ids for version B
        trace_ids_b_result = await db.execute(
            select(PromptEvent.trace_id.distinct()).where(and_(*trace_conditions_b))
        )
        trace_ids_b = {row[0] for row in trace_ids_b_result}
        
        # Now get ALL events (regardless of time) for these trace_ids
        # For custom_event, we need to check event_metadata['event_name'] as well
        event_name_expr = case(
            (PromptEvent.event_type == 'custom_event', 
             func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'custom_event')),
            else_=PromptEvent.event_type
        ).label('event_name')
        
        # Get events for version A by trace_id (no date restrictions)
        if trace_ids_a:
            events_a_result = await db.execute(
                select(
                    event_name_expr,
                    func.count(PromptEvent.id.distinct()).label('count')
                ).where(
                    PromptEvent.trace_id.in_(trace_ids_a)
                ).group_by(event_name_expr)
            )
            events_a_raw = {row.event_name: row.count for row in events_a_result}
        else:
            events_a_raw = {}
        
        # Apply aliases - merge aliased events
        events_a = {}
        for event_name, count in events_a_raw.items():
            events_a[event_name] = count
        # Also add alias mappings for lookups
        for alias, actual in EVENT_ALIASES.items():
            if actual in events_a_raw and alias not in events_a:
                events_a[alias] = events_a_raw[actual]

        # Get events for version B by trace_id (no date restrictions)
        event_name_expr_b = case(
            (PromptEvent.event_type == 'custom_event', 
             func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'custom_event')),
            else_=PromptEvent.event_type
        ).label('event_name')
        
        if trace_ids_b:
            events_b_result = await db.execute(
                select(
                    event_name_expr_b,
                    func.count(PromptEvent.id.distinct()).label('count')
                ).where(
                    PromptEvent.trace_id.in_(trace_ids_b)
                ).group_by(event_name_expr_b)
            )
            events_b_raw = {row.event_name: row.count for row in events_b_result}
        else:
            events_b_raw = {}
        
        # Apply aliases for version B
        events_b = {}
        for event_name, count in events_b_raw.items():
            events_b[event_name] = count
        for alias, actual in EVENT_ALIASES.items():
            if actual in events_b_raw and alias not in events_b:
                events_b[alias] = events_b_raw[actual]

        # Calculate funnel metrics if funnel is configured
        funnel_results = None
        if ab_test.funnel_config and ab_test.funnel_config.event_steps:
            funnel_steps = ab_test.funnel_config.event_steps
            
            # Calculate funnel for version A
            funnel_a = []
            for step in funnel_steps:
                # For get_prompt/prompt_request, use the A/B test request counters
                if step in ('get_prompt', 'prompt_request'):
                    count = ab_test.version_a_requests
                else:
                    count = events_a.get(step, 0)
                funnel_a.append({
                    "step": step,
                    "count": count,
                    "conversion_rate": (count / ab_test.version_a_requests * 100) if ab_test.version_a_requests > 0 else 0
                })
            
            # Calculate funnel for version B
            funnel_b = []
            for step in funnel_steps:
                # For get_prompt/prompt_request, use the A/B test request counters
                if step in ('get_prompt', 'prompt_request'):
                    count = ab_test.version_b_requests
                else:
                    count = events_b.get(step, 0)
                funnel_b.append({
                    "step": step,
                    "count": count,
                    "conversion_rate": (count / ab_test.version_b_requests * 100) if ab_test.version_b_requests > 0 else 0
                })
            
            # Final conversion rate (last step / first step)
            final_step = funnel_steps[-1]
            conversions_a = events_a.get(final_step, 0)
            conversions_b = events_b.get(final_step, 0)
            
            funnel_results = {
                "funnel_name": ab_test.funnel_config.name,
                "steps": funnel_steps,
                "version_a": funnel_a,
                "version_b": funnel_b,
                "final_conversion_a": conversions_a,
                "final_conversion_b": conversions_b,
                "conversion_rate_a": (conversions_a / ab_test.version_a_requests * 100) if ab_test.version_a_requests > 0 else 0,
                "conversion_rate_b": (conversions_b / ab_test.version_b_requests * 100) if ab_test.version_b_requests > 0 else 0,
            }
            
            # Calculate statistical significance for funnel
            statistical_significance = calculate_statistical_significance(
                conversions_a, ab_test.version_a_requests,
                conversions_b, ab_test.version_b_requests
            )
            funnel_results["statistical_significance"] = statistical_significance
            
            # Determine winner
            if statistical_significance["is_significant"]:
                if funnel_results["conversion_rate_b"] > funnel_results["conversion_rate_a"]:
                    funnel_results["winner"] = "B"
                    # Calculate lift: if A is 0%, lift is infinity (represented as very large number)
                    if funnel_results["conversion_rate_a"] > 0:
                        funnel_results["lift"] = round(((funnel_results["conversion_rate_b"] - funnel_results["conversion_rate_a"]) / funnel_results["conversion_rate_a"] * 100), 1)
                    else:
                        # If A has 0% and B has >0%, lift is infinite (use a very large number for JSON serialization)
                        funnel_results["lift"] = 999999.0 if funnel_results["conversion_rate_b"] > 0 else 0.0
                else:
                    funnel_results["winner"] = "A"
                    # Calculate lift: if B is 0%, lift is infinity
                    if funnel_results["conversion_rate_b"] > 0:
                        funnel_results["lift"] = round(((funnel_results["conversion_rate_a"] - funnel_results["conversion_rate_b"]) / funnel_results["conversion_rate_b"] * 100), 1)
                    else:
                        # If B has 0% and A has >0%, lift is infinite
                        funnel_results["lift"] = 999999.0 if funnel_results["conversion_rate_a"] > 0 else 0.0
            else:
                funnel_results["winner"] = None
                funnel_results["lift"] = None

        # Build all events breakdown ONLY if no funnel is configured
        # (show either funnel OR events breakdown, not both)
        events_breakdown = []
        if not funnel_results:
            # Get unique event types from raw events
            all_event_types = set(events_a_raw.keys()) | set(events_b_raw.keys())
            
            # Rename prompt_request to get_prompt for display
            if 'prompt_request' in all_event_types:
                all_event_types.discard('prompt_request')
                all_event_types.add('get_prompt')
            
            for event_type in sorted(all_event_types):
                # For get_prompt (which is prompt_request internally), use A/B test request counters
                if event_type == 'get_prompt':
                    count_a = ab_test.version_a_requests
                    count_b = ab_test.version_b_requests
                else:
                    count_a = events_a_raw.get(event_type, 0)
                    count_b = events_b_raw.get(event_type, 0)
                
                rate_a = (count_a / ab_test.version_a_requests * 100) if ab_test.version_a_requests > 0 else 0
                rate_b = (count_b / ab_test.version_b_requests * 100) if ab_test.version_b_requests > 0 else 0
                
                events_breakdown.append({
                    "event_type": event_type,
                    "version_a_count": count_a,
                    "version_b_count": count_b,
                    "version_a_rate": round(rate_a, 2),
                    "version_b_rate": round(rate_b, 2),
                    "diff_rate": round(rate_b - rate_a, 2),
                    "winner": "B" if rate_b > rate_a else ("A" if rate_a > rate_b else None)
                })

        # Get metadata aggregations for A/B comparison
        metadata_insights = await get_metadata_aggregations(
            db, ab_test.version_a_id, ab_test.version_b_id,
            ab_test.started_at, ab_test.ended_at
        )

        return {
            "test_id": str(ab_test.id),
            "test_name": ab_test.name,
            "status": ab_test.status,
            "prompt_name": ab_test.prompt.name if ab_test.prompt else "Unknown",
            "version_a": {
                "id": str(ab_test.version_a_id),
                "name": f"v{ab_test.version_a.version_number}" if ab_test.version_a else "Unknown",
                "requests": ab_test.version_a_requests
            },
            "version_b": {
                "id": str(ab_test.version_b_id),
                "name": f"v{ab_test.version_b.version_number}" if ab_test.version_b else "Unknown",
                "requests": ab_test.version_b_requests
            },
            "total_requests": ab_test.total_requests,
            "progress": ((ab_test.version_a_requests + ab_test.version_b_requests) / ab_test.total_requests * 100) if ab_test.total_requests > 0 else 0,
            "started_at": ab_test.started_at.isoformat() if ab_test.started_at else None,
            "ended_at": ab_test.ended_at.isoformat() if ab_test.ended_at else None,
            "funnel_results": funnel_results,
            "events_breakdown": events_breakdown,
            "metadata_insights": metadata_insights
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to get A/B test results: {str(e)}")


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