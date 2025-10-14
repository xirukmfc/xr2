# app/api/internal/analytics.py

from fastapi import APIRouter, Query, Depends, HTTPException, Body
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel

from app.services.analytics import (
    get_prompt_performance_metrics,
    get_funnel_analysis,
    get_ab_test_results,
    calculate_roi_metrics,
    get_workspace_summary,
    get_top_performing_prompts,
    get_recent_events,
    get_error_analysis,
    get_roi_summary,
    get_metric_trends,
    get_monthly_events_chart_data,
    generate_conversion_report,
    get_available_prompts_for_reports,
    get_available_conversion_events
)

# These imports will need to be created or imported from your auth system
from app.models.user import User
from app.core.database import get_session as get_db
from app.core.auth import get_current_user


class FunnelAnalysisRequest(BaseModel):
    event_sequence: List[str]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    segment_by: Optional[str] = None
    ab_test_id: Optional[str] = None


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

router = APIRouter(prefix="/analytics")


@router.get("/performance/{prompt_id}")
async def get_prompt_performance(
        prompt_id: UUID,
        period: str = Query("7d", regex="^(24h|7d|30d|90d|custom)$"),
        start_date: Optional[datetime] = Query(None),
        end_date: Optional[datetime] = Query(None),
        granularity: str = Query("hour", regex="^(hour|day|week|month)$"),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Get performance metrics for a specific prompt"""

    # Parse period
    if period == "custom":
        if not start_date or not end_date:
            raise HTTPException(400, "start_date and end_date are required when period is 'custom'")
        # Use provided custom dates
    else:
        # Parse predefined period
        period_map = {
            "24h": timedelta(days=1),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "90d": timedelta(days=90)
        }
        end_date = datetime.utcnow()
        start_date = end_date - period_map[period]

    workspace_id = await get_user_workspace(db, current_user)
    metrics = await get_prompt_performance_metrics(
        db, prompt_id, start_date, end_date, granularity, workspace_id
    )

    return metrics


@router.get("/roi/{prompt_id}")
async def get_roi_analysis(
        prompt_id: UUID,
        period_days: int = Query(30, ge=1, le=365),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Calculate ROI metrics for a prompt"""

    workspace_id = await get_user_workspace(db, current_user)
    roi_data = await calculate_roi_metrics(
        db, prompt_id, period_days, workspace_id
    )

    return roi_data


@router.post("/funnel")
async def analyze_funnel(
        event_sequence: List[str],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        segment_by: Optional[str] = None,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Analyze conversion funnel for a sequence of events"""

    workspace_id = await get_user_workspace(db, current_user)
    funnel_data = await get_funnel_analysis(
        db, event_sequence, start_date, end_date,
        segment_by, workspace_id
    )

    return funnel_data


@router.post("/funnel-test")
async def analyze_funnel_test(
        request: FunnelAnalysisRequest,
        db: AsyncSession = Depends(get_db)
):
    """Test endpoint for funnel analysis with optional A/B test split"""
    from app.models.workspace import Workspace
    from app.models.analytics import ABTest, PromptEvent
    from sqlalchemy import func

    # Get first workspace for testing
    workspace_query = await db.execute(select(Workspace.id).limit(1))
    workspace_row = workspace_query.first()

    if not workspace_row:
        raise HTTPException(404, "No workspace found")

    workspace_id = workspace_row.id

    # If A/B test ID provided, return split funnel data
    if request.ab_test_id:
        # Get A/B test with related data
        from app.models.prompt import Prompt, PromptVersion
        from sqlalchemy.orm import selectinload

        ab_test_result = await db.execute(
            select(ABTest).options(
                selectinload(ABTest.prompt),
                selectinload(ABTest.version_a),
                selectinload(ABTest.version_b)
            ).where(
                and_(
                    ABTest.id == request.ab_test_id,
                    ABTest.workspace_id == workspace_id,
                    ABTest.status == 'completed'
                )
            )
        )
        ab_test = ab_test_result.scalar_one_or_none()

        if not ab_test:
            raise HTTPException(404, "Completed A/B test not found")

        # Calculate funnel for Version A
        funnel_a = []
        previous_count_a = None

        for i, event_name in enumerate(request.event_sequence):
            # Count events for version A
            count_result_a = await db.execute(
                select(func.count(PromptEvent.id.distinct())).where(
                    and_(
                        PromptEvent.workspace_id == workspace_id,
                        PromptEvent.prompt_version_id == ab_test.version_a_id,
                        PromptEvent.event_type == event_name
                    )
                )
            )
            count_a = count_result_a.scalar() or 0

            if i == 0:
                previous_count_a = count_a
                conversion_rate_a = 100.0
            else:
                conversion_rate_a = (count_a / previous_count_a * 100) if previous_count_a > 0 else 0

            funnel_a.append({
                "step": event_name,
                "users": count_a,
                "conversion_rate": round(conversion_rate_a, 2)
            })

        # Calculate funnel for Version B
        funnel_b = []
        previous_count_b = None

        for i, event_name in enumerate(request.event_sequence):
            # Count events for version B
            count_result_b = await db.execute(
                select(func.count(PromptEvent.id.distinct())).where(
                    and_(
                        PromptEvent.workspace_id == workspace_id,
                        PromptEvent.prompt_version_id == ab_test.version_b_id,
                        PromptEvent.event_type == event_name
                    )
                )
            )
            count_b = count_result_b.scalar() or 0

            if i == 0:
                previous_count_b = count_b
                conversion_rate_b = 100.0
            else:
                conversion_rate_b = (count_b / previous_count_b * 100) if previous_count_b > 0 else 0

            funnel_b.append({
                "step": event_name,
                "users": count_b,
                "conversion_rate": round(conversion_rate_b, 2)
            })

        return {
            "ab_test_id": str(ab_test.id),
            "ab_test_name": ab_test.name,
            "prompt_name": ab_test.prompt.name if ab_test.prompt else "Unknown Prompt",
            "version_a": {
                "version_id": str(ab_test.version_a_id),
                "version_number": ab_test.version_a.version_number if ab_test.version_a else 0,
                "data": funnel_a
            },
            "version_b": {
                "version_id": str(ab_test.version_b_id),
                "version_number": ab_test.version_b.version_number if ab_test.version_b else 0,
                "data": funnel_b
            }
        }

    # Default: return regular funnel data (simplified calculation)
    from app.models.analytics import PromptEvent

    funnel_steps = []
    previous_count = None

    for i, event_name in enumerate(request.event_sequence):
        count_result = await db.execute(
            select(func.count(PromptEvent.id.distinct())).where(
                and_(
                    PromptEvent.workspace_id == workspace_id,
                    PromptEvent.event_type == event_name
                )
            )
        )
        event_count = count_result.scalar() or 0

        if i == 0:
            previous_count = event_count
            conversion_rate = 100.0
        else:
            conversion_rate = (event_count / previous_count * 100) if previous_count > 0 else 0

        funnel_steps.append({
            "step": event_name,
            "users": event_count,
            "conversion_rate": round(conversion_rate, 2)
        })

    return funnel_steps


@router.get("/ab-test/{test_id}")
async def get_ab_test_analysis(
        test_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Get A/B test results with statistical significance"""

    workspace_id = await get_user_workspace(db, current_user)
    results = await get_ab_test_results(db, test_id, workspace_id)

    return results


@router.get("/dashboard")
async def get_analytics_dashboard(
        period: str = Query("7d", regex="^(24h|7d|30d|90d|custom)$"),
        start_date: Optional[datetime] = Query(None),
        end_date: Optional[datetime] = Query(None),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Get comprehensive analytics dashboard data"""

    # Parse period
    if period == "custom":
        if not start_date or not end_date:
            raise HTTPException(400, "start_date and end_date are required when period is 'custom'")
        # Use provided custom dates
    else:
        # Parse predefined period
        period_map = {
            "24h": timedelta(days=1),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "90d": timedelta(days=90)
        }
        end_date = datetime.utcnow()
        start_date = end_date - period_map[period]

    # Get user's workspace_id
    workspace_id = await get_user_workspace(db, current_user)

    # Fetch multiple metrics in parallel
    dashboard_data = {
        "summary": await get_workspace_summary(db, workspace_id, start_date, end_date),
        "top_prompts": await get_top_performing_prompts(db, workspace_id, start_date, end_date),
        "recent_events": await get_recent_events(db, workspace_id, limit=100),
        "error_analysis": await get_error_analysis(db, workspace_id, start_date, end_date),
        "roi_summary": await get_roi_summary(db, workspace_id, start_date, end_date),
        "trends": await get_metric_trends(db, workspace_id, start_date, end_date),
        "monthly_events_chart": await get_monthly_events_chart_data(db, workspace_id)
    }

    return dashboard_data


@router.get("/events")
async def get_workspace_events(
        limit: int = Query(100, ge=1, le=1000),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Get recent events for the workspace"""
    workspace_id = await get_user_workspace(db, current_user)
    events = await get_recent_events(db, workspace_id, limit)

    return [
        {
            "id": str(event.id),
            "trace_id": event.trace_id,
            "prompt_id": str(event.prompt_id) if event.prompt_id else None,
            "event_type": event.event_type,
            "outcome": event.outcome,
            "user_id": event.user_id,
            "metadata": event.event_metadata,
            "business_metrics": event.business_metrics,
            "created_at": event.created_at.isoformat()
        }
        for event in events
    ]


@router.post("/reports/conversion")
async def generate_conversion_reports(
        start_date: datetime = Query(..., description="Start date for the report"),
        end_date: datetime = Query(..., description="End date for the report"),
        prompt_ids: Optional[List[UUID]] = Query(None, description="Filter by specific prompt IDs"),
        conversion_event_name: Optional[str] = Query(None, description="Filter by conversion event name"),
        conversion_metric: str = Query("conversion_count", regex="^(conversion_count|conversion_rate|revenue)$"),
        report_format: str = Query("table", regex="^(table|chart)$"),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Generate comprehensive conversion reports with filtering options"""

    report_data = await generate_conversion_report(
        db=db,
        workspace_id=await get_user_workspace(db, current_user),
        start_date=start_date,
        end_date=end_date,
        prompt_ids=prompt_ids,
        conversion_event_name=conversion_event_name,
        conversion_metric=conversion_metric,
        report_format=report_format
    )

    return report_data


@router.get("/reports/prompts")
async def get_prompts_for_reports(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Get list of available prompts for conversion reports filtering"""

    workspace_id = await get_user_workspace(db, current_user)
    prompts = await get_available_prompts_for_reports(db, workspace_id)
    return {"prompts": prompts}


@router.get("/reports/conversion-events")
async def get_conversion_events_for_reports(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Get list of available conversion events for filtering"""

    workspace_id = await get_user_workspace(db, current_user)
    events = await get_available_conversion_events(db, workspace_id)
    return {"conversion_events": events}


@router.get("/debug-monthly-events")
async def debug_monthly_events(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Debug monthly events data to see what SQL returns"""
    from app.models.analytics import PromptEvent
    from sqlalchemy import select, func, and_

    workspace_id = await get_user_workspace(db, current_user)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    # Same query as in get_monthly_events_chart_data
    event_name_field = func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'unknown')
    category_field = func.coalesce(PromptEvent.event_metadata['category'].astext, 'general')
    date_field = func.date(PromptEvent.created_at)

    events_data = await db.execute(
        select(
            date_field.label('date'),
            event_name_field.label('event_name'),
            category_field.label('category'),
            func.count(PromptEvent.id).label('count'),
            func.min(PromptEvent.created_at).label('first_event'),
            func.max(PromptEvent.created_at).label('last_event')
        ).where(
            and_(
                PromptEvent.workspace_id == workspace_id,
                PromptEvent.created_at >= start_date,
                PromptEvent.created_at <= end_date
            )
        ).group_by(
            date_field,
            event_name_field,
            category_field
        ).order_by(
            date_field,
            event_name_field,
            category_field
        )
    )

    # Return raw SQL results for debugging
    results = []
    for row in events_data:
        results.append({
            'date': row.date.strftime('%Y-%m-%d'),
            'event_name': row.event_name,
            'category': row.category,
            'count': row.count,
            'first_event': row.first_event.isoformat(),
            'last_event': row.last_event.isoformat()
        })

    return {
        "debug_results": results,
        "workspace_id": str(workspace_id),
        "time_range": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "total_results": len(results)
    }


@router.get("/debug-buy-events")
async def debug_buy_events(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Debug to find buy events specifically"""
    from app.models.analytics import PromptEvent
    from sqlalchemy import select, and_, func

    workspace_id = await get_user_workspace(db, current_user)

    # Find all events that might be 'buy' events
    buy_events = await db.execute(
        select(
            PromptEvent.id,
            PromptEvent.created_at,
            PromptEvent.event_metadata,
            func.date(PromptEvent.created_at).label('date'),
            PromptEvent.event_metadata['event_name'].astext.label('event_name_raw'),
            PromptEvent.event_metadata['category'].astext.label('category_raw')
        ).where(
            and_(
                PromptEvent.workspace_id == workspace_id,
                PromptEvent.event_metadata['event_name'].astext == 'buy'
            )
        ).order_by(PromptEvent.created_at.desc())
    )

    results = []
    for row in buy_events:
        results.append({
            'id': str(row.id),
            'created_at': row.created_at.isoformat(),
            'date': row.date.strftime('%Y-%m-%d'),
            'event_name_raw': row.event_name_raw,
            'category_raw': row.category_raw,
            'full_metadata': row.event_metadata
        })

    return {"buy_events": results, "workspace_id": str(workspace_id), "count": len(results)}


@router.get("/debug-time-range")
async def debug_time_range(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Debug time range for monthly events"""
    from datetime import datetime, timedelta

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    return {
        "current_utc_time": end_date.isoformat(),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "days_range": 30
    }


@router.get("/debug-all-events")
async def debug_all_events(db: AsyncSession = Depends(get_db)):
    """Debug all events in database (no authentication)"""
    from app.models.analytics import PromptEvent
    from sqlalchemy import select, func

    # Get total count of events
    total_count = await db.execute(
        select(func.count(PromptEvent.id))
    )
    total = total_count.scalar() or 0

    # Get recent events regardless of workspace
    recent_events = await db.execute(
        select(
            PromptEvent.id,
            PromptEvent.workspace_id,
            PromptEvent.trace_id,
            PromptEvent.event_type,
            PromptEvent.outcome,
            PromptEvent.user_id,
            PromptEvent.event_metadata,
            PromptEvent.business_metrics,
            PromptEvent.created_at
        ).order_by(PromptEvent.created_at.desc()).limit(10)
    )

    events = []
    for row in recent_events:
        events.append({
            "id": str(row.id),
            "workspace_id": str(row.workspace_id),
            "trace_id": row.trace_id,
            "event_type": row.event_type,
            "outcome": row.outcome,
            "user_id": row.user_id,
            "event_metadata": row.event_metadata,
            "business_metrics": row.business_metrics,
            "created_at": row.created_at.isoformat()
        })

    return {
        "total_events": total,
        "recent_events": events
    }


@router.get("/dashboard-test")
async def get_analytics_dashboard_test(
        period: str = Query("7d", regex="^(24h|7d|30d|90d)$"),
        db: AsyncSession = Depends(get_db)
):
    """Test version of analytics dashboard without authentication"""
    from app.models.analytics import PromptEvent
    from sqlalchemy import select
    from uuid import UUID

    # Parse period
    period_map = {
        "24h": timedelta(days=1),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90)
    }

    end_date = datetime.utcnow()
    start_date = end_date - period_map[period]

    try:
        # Get first real workspace_id from the database instead of fake one
        workspace_query = await db.execute(
            select(PromptEvent.workspace_id).limit(1)
        )
        workspace_row = workspace_query.first()

        if workspace_row:
            workspace_id = workspace_row.workspace_id
        else:
            # If no events exist, create a minimal response
            return {
                "summary": {
                    "total_events": 0,
                    "success_rate": 0,
                    "total_revenue": 0,
                    "unique_users": 0,
                    "avg_response_time_ms": 0,
                    "roi_percentage": 0
                },
                "top_prompts": [],
                "recent_events": [],
                "error_analysis": {"error_count": 0, "error_types": []},
                "roi_summary": {"total_roi": 0},
                "trends": [],
                "monthly_events_chart": {"dates": [], "series": []}
            }

        # Fetch multiple metrics in parallel
        dashboard_data = {
            "summary": await get_workspace_summary(db, workspace_id, start_date, end_date),
            "top_prompts": await get_top_performing_prompts(db, workspace_id, start_date, end_date),
            "recent_events": await get_recent_events(db, workspace_id, limit=100),
            "error_analysis": await get_error_analysis(db, workspace_id, start_date, end_date),
            "roi_summary": await get_roi_summary(db, workspace_id, start_date, end_date),
            "trends": await get_metric_trends(db, workspace_id, start_date, end_date),
            "monthly_events_chart": await get_monthly_events_chart_data(db, workspace_id)
        }

        return dashboard_data

    except Exception as e:
        return {
            "error": str(e),
            "summary": {
                "total_events": 0,
                "success_rate": 0,
                "total_revenue": 0,
                "unique_users": 0,
                "avg_response_time_ms": 0,
                "roi_percentage": 0
            },
            "top_prompts": [],
            "recent_events": [],
            "error_analysis": {"error_count": 0, "error_types": []},
            "roi_summary": {"total_roi": 0},
            "trends": [],
            "monthly_events_chart": {"dates": [], "series": []}
        }
