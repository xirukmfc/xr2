from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_session
from app.core.auth import get_current_user
from app.models.user import User
from app.services.statistics import StatisticsService

router = APIRouter(prefix="/statistics", tags=["statistics"])


class PromptStatsResponse(BaseModel):
    """Response model for comprehensive prompt statistics"""
    prompt_id: str
    last_24_hours: Optional[dict] = None
    all_time: Optional[dict] = None


@router.get("/prompt-version/{prompt_version_id}")
async def get_prompt_version_statistics(
    prompt_version_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours to look back (1-168 hours)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for a specific prompt version over the last N hours"""
    try:
        version_uuid = UUID(prompt_version_id)
        stats_service = StatisticsService(session)
        stats = await stats_service.get_prompt_version_stats(version_uuid, hours)
        return stats
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid prompt version ID format"
        )


@router.get("/prompt/{prompt_id}")
async def get_prompt_statistics(
    prompt_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours to look back (1-168 hours)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get aggregated statistics for all versions of a prompt over the last N hours"""
    try:
        prompt_uuid = UUID(prompt_id)
        stats_service = StatisticsService(session)
        stats = await stats_service.get_prompt_stats(prompt_uuid, hours)
        return stats
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid prompt ID format"
        )


@router.get("/api-key/{api_key_id}")
async def get_api_key_statistics(
    api_key_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours to look back (1-168 hours)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get usage statistics for a specific API key over the last N hours"""
    try:
        key_uuid = UUID(api_key_id)
        stats_service = StatisticsService(session)
        stats = await stats_service.get_api_key_stats(key_uuid, hours)
        return stats
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid API key ID format"
        )


@router.get("/api-keys")
async def get_all_api_keys_statistics(
    hours: int = Query(24, ge=1, le=168, description="Hours to look back (1-168 hours)"),
    user_id: Optional[str] = Query(None, description="Filter by user ID (optional)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get usage statistics for all API keys, optionally filtered by user"""
    try:
        user_uuid = None
        if user_id:
            user_uuid = UUID(user_id)
        
        stats_service = StatisticsService(session)
        stats = await stats_service.get_all_api_keys_stats(user_uuid, hours)
        return stats
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )


@router.get("/overall")
async def get_overall_statistics(
    hours: int = Query(24, ge=1, le=168, description="Hours to look back (1-168 hours)"),
    user_id: Optional[str] = Query(None, description="Filter by user ID (optional)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get overall system statistics, optionally filtered by user"""
    try:
        user_uuid = None
        if user_id:
            user_uuid = UUID(user_id)
        
        stats_service = StatisticsService(session)
        stats = await stats_service.get_overall_stats(hours, user_uuid)
        return stats
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )


@router.get("/prompt/{prompt_id}/summary", response_model=PromptStatsResponse)
async def get_prompt_statistics_summary(
    prompt_id: str,
    include_24h: bool = Query(True, description="Include last 24 hours stats"),
    include_all_time: bool = Query(True, description="Include all-time stats"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive prompt usage statistics summary
    
    Returns both real-time (24h) and aggregated (all-time) statistics including:
    - Total requests and success rates
    - Breakdown by source_name (who is requesting the prompts)  
    - Breakdown by prompt version
    - Status code distribution
    """
    try:
        prompt_uuid = UUID(prompt_id)
        stats_service = StatisticsService(session)
        result = await stats_service.get_prompt_usage_summary(
            prompt_id=prompt_uuid,
            hours_24=include_24h,
            all_time=include_all_time
        )
        
        return PromptStatsResponse(
            prompt_id=result["prompt_id"],
            last_24_hours=result.get("last_24_hours"),
            all_time=result.get("all_time")
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid prompt ID format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving prompt statistics: {str(e)}"
        )


# Admin endpoints for managing aggregated statistics

@router.post("/aggregate")
async def trigger_stats_aggregation(
    period_type: str = Query("hour", description="Aggregation period: 'hour' or 'day'"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger statistics aggregation for performance optimization
    
    This processes raw logs into aggregated PromptStats records.
    Typically run via cron job, but can be triggered manually.
    """
    # TODO: Add admin permission check
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    if period_type not in ["hour", "day"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="period_type must be 'hour' or 'day'"
        )
    
    try:
        stats_service = StatisticsService(session)
        aggregated_count = await stats_service.aggregate_stats_for_period(period_type)
        
        return {
            "message": f"Successfully aggregated statistics",
            "period_type": period_type,
            "records_processed": aggregated_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error aggregating statistics: {str(e)}"
        )
