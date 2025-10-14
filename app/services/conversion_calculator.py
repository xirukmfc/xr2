from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text, Numeric
from sqlalchemy.dialects.postgresql import aggregate_order_by

from app.models.analytics import ConversionFunnel, PromptEvent
from app.models.product_api_key import ProductAPILog


async def calculate_conversion_metrics(
    db: AsyncSession,
    funnel: ConversionFunnel,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """
    Calculate conversion metrics for a funnel in the specified time period

    Returns:
        {
            "source_count": int,
            "target_count": int,
            "conversion_rate": float,
            "total_value": float (optional, for sum metrics),
            "average_value": float (optional, for sum metrics)
        }
    """

    # Step 1: Get source events/requests
    source_count = await _get_source_count(db, funnel, start_date, end_date)

    # Step 2: Get target conversions
    target_metrics = await _get_target_metrics(db, funnel, start_date, end_date)

    target_count = target_metrics["count"]
    total_value = target_metrics.get("total_value")
    average_value = target_metrics.get("average_value")

    # Step 3: Calculate conversion rate
    conversion_rate = (target_count / source_count * 100) if source_count > 0 else 0.0

    result = {
        "source_count": source_count,
        "target_count": target_count,
        "conversion_rate": round(conversion_rate, 2)
    }

    if total_value is not None:
        result["total_value"] = round(float(total_value), 2)

    if average_value is not None:
        result["average_value"] = round(float(average_value), 2)

    return result


async def _get_source_count(
    db: AsyncSession,
    funnel: ConversionFunnel,
    start_date: datetime,
    end_date: datetime
) -> int:
    """Get the count of source events (prompt requests or custom events)"""

    if funnel.source_type == "prompt_requests":
        # Count unique trace_ids from ProductAPILog for the specific prompt
        query = select(func.count(func.distinct(ProductAPILog.trace_id))).where(
            and_(
                ProductAPILog.prompt_id == funnel.source_prompt_id,
                ProductAPILog.created_at >= start_date,
                ProductAPILog.created_at <= end_date
            )
        )

    elif funnel.source_type == "event":
        # Count events of specific type
        query = select(func.count(PromptEvent.id)).where(
            and_(
                PromptEvent.workspace_id == funnel.workspace_id,
                PromptEvent.event_metadata['event_name'].astext == funnel.source_event_name,
                PromptEvent.created_at >= start_date,
                PromptEvent.created_at <= end_date
            )
        )

    else:
        raise ValueError(f"Unknown source_type: {funnel.source_type}")

    result = await db.execute(query)
    return result.scalar() or 0


async def _get_target_metrics(
    db: AsyncSession,
    funnel: ConversionFunnel,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get target event metrics (count and optionally sum)"""

    # Base query for target events
    base_query = select(PromptEvent).where(
        and_(
            PromptEvent.workspace_id == funnel.workspace_id,
            PromptEvent.event_metadata['event_name'].astext == funnel.target_event_name,
            PromptEvent.created_at >= start_date,
            PromptEvent.created_at <= end_date
        )
    )

    # Add category filter if specified
    if funnel.target_event_category:
        base_query = base_query.where(
            PromptEvent.event_metadata['category'].astext == funnel.target_event_category
        )

    # For conversion window filtering, we need to match trace_ids
    if funnel.source_type == "prompt_requests" and funnel.source_prompt_id:
        # Get trace_ids from the source prompt requests within conversion window
        source_traces_query = select(ProductAPILog.trace_id).where(
            and_(
                ProductAPILog.prompt_id == funnel.source_prompt_id,
                ProductAPILog.created_at >= start_date,
                ProductAPILog.created_at <= end_date
            )
        )

        # Filter target events to only those with matching trace_ids
        # and within conversion window after the source event
        base_query = base_query.where(
            and_(
                PromptEvent.trace_id.in_(source_traces_query),
                # Additional time window check could be added here if needed
                # For now, we assume if trace_id matches, it's within window
            )
        )

    if funnel.metric_type == "count":
        # Simple count
        count_query = select(func.count(PromptEvent.id)).where(
            and_(
                PromptEvent.workspace_id == funnel.workspace_id,
                PromptEvent.event_metadata['event_name'].astext == funnel.target_event_name,
                PromptEvent.created_at >= start_date,
                PromptEvent.created_at <= end_date
            )
        )

        # Add category filter if specified
        if funnel.target_event_category:
            count_query = count_query.where(
                PromptEvent.event_metadata['category'].astext == funnel.target_event_category
            )

        # For conversion window filtering, we need to match trace_ids
        if funnel.source_type == "prompt_requests" and funnel.source_prompt_id:
            # Get trace_ids from the source prompt requests within conversion window
            source_traces_query = select(ProductAPILog.trace_id).where(
                and_(
                    ProductAPILog.prompt_id == funnel.source_prompt_id,
                    ProductAPILog.created_at >= start_date,
                    ProductAPILog.created_at <= end_date
                )
            )

            # Filter target events to only those with matching trace_ids
            count_query = count_query.where(
                PromptEvent.trace_id.in_(source_traces_query)
            )

        result = await db.execute(count_query)
        count = result.scalar() or 0

        return {"count": count}

    elif funnel.metric_type == "sum":
        # Count and sum of specific field
        if not funnel.metric_field:
            raise ValueError("metric_field is required for sum metric_type")

        # Build the where conditions
        where_conditions = [
            PromptEvent.workspace_id == funnel.workspace_id,
            PromptEvent.event_metadata['event_name'].astext == funnel.target_event_name,
            PromptEvent.created_at >= start_date,
            PromptEvent.created_at <= end_date,
            # Only include events that have the metric field and it's numeric
            func.jsonb_extract_path_text(PromptEvent.event_metadata, 'fields', funnel.metric_field).is_not(None),
            func.jsonb_extract_path_text(PromptEvent.event_metadata, 'fields', funnel.metric_field) != ''
        ]

        # Add category filter if specified
        if funnel.target_event_category:
            where_conditions.append(
                PromptEvent.event_metadata['category'].astext == funnel.target_event_category
            )

        # For conversion window filtering, we need to match trace_ids
        if funnel.source_type == "prompt_requests" and funnel.source_prompt_id:
            # Get trace_ids from the source prompt requests within conversion window
            source_traces_query = select(ProductAPILog.trace_id).where(
                and_(
                    ProductAPILog.prompt_id == funnel.source_prompt_id,
                    ProductAPILog.created_at >= start_date,
                    ProductAPILog.created_at <= end_date
                )
            )

            # Filter target events to only those with matching trace_ids
            where_conditions.append(PromptEvent.trace_id.in_(source_traces_query))

        sum_query = select(
            func.count(PromptEvent.id).label("count"),
            func.sum(
                func.cast(
                    func.jsonb_extract_path_text(PromptEvent.event_metadata, 'fields', funnel.metric_field),
                    Numeric
                )
            ).label("total_value")
        ).where(and_(*where_conditions))

        result = await db.execute(sum_query)
        row = result.first()

        count = row.count or 0
        total_value = row.total_value or 0.0
        average_value = (total_value / count) if count > 0 else 0.0

        return {
            "count": count,
            "total_value": total_value,
            "average_value": average_value
        }

    else:
        raise ValueError(f"Unknown metric_type: {funnel.metric_type}")


async def calculate_funnel_trends(
    db: AsyncSession,
    funnel: ConversionFunnel,
    start_date: datetime,
    end_date: datetime,
    granularity: str = "day"  # day, week, month
) -> List[Dict[str, Any]]:
    """
    Calculate conversion metrics over time with specified granularity

    Returns list of metrics for each time period:
    [
        {
            "period_start": datetime,
            "period_end": datetime,
            "source_count": int,
            "target_count": int,
            "conversion_rate": float,
            "total_value": float (optional)
        }
    ]
    """

    # Determine time intervals
    if granularity == "day":
        interval = timedelta(days=1)
        date_format = "YYYY-MM-DD"
    elif granularity == "week":
        interval = timedelta(weeks=1)
        date_format = "YYYY-WW"  # Week number
    elif granularity == "month":
        interval = timedelta(days=30)  # Approximate
        date_format = "YYYY-MM"
    else:
        raise ValueError(f"Unsupported granularity: {granularity}")

    trends = []
    current_start = start_date

    while current_start < end_date:
        current_end = min(current_start + interval, end_date)

        metrics = await calculate_conversion_metrics(db, funnel, current_start, current_end)

        trends.append({
            "period_start": current_start,
            "period_end": current_end,
            **metrics
        })

        current_start = current_end

    return trends


async def get_conversion_attribution(
    db: AsyncSession,
    funnel: ConversionFunnel,
    start_date: datetime,
    end_date: datetime,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Get detailed attribution data showing which source events led to conversions

    Returns list of conversion records:
    [
        {
            "trace_id": str,
            "source_timestamp": datetime,
            "target_timestamp": datetime,
            "time_to_convert_minutes": int,
            "target_value": float (optional),
            "user_id": str (optional)
        }
    ]
    """

    if funnel.source_type != "prompt_requests":
        # For event-to-event attribution, we would need more complex logic
        # to match source and target events by trace_id or user_id
        raise NotImplementedError("Attribution currently only supports prompt_requests as source")

    # Query to find conversions with attribution
    query = text("""
        SELECT
            pe.trace_id,
            pal.created_at as source_timestamp,
            pe.created_at as target_timestamp,
            EXTRACT(EPOCH FROM (pe.created_at - pal.created_at))/60 as time_to_convert_minutes,
            CASE
                WHEN :metric_type = 'sum' AND :metric_field IS NOT NULL
                THEN (pe.event_metadata->'fields'->:metric_field)::numeric
                ELSE NULL
            END as target_value,
            pe.user_id
        FROM prompt_events pe
        JOIN product_api_logs pal ON pe.trace_id = pal.trace_id
        WHERE pe.workspace_id = :workspace_id
            AND pe.event_metadata->>'event_name' = :target_event_name
            AND (:target_event_category IS NULL OR pe.event_metadata->>'category' = :target_event_category)
            AND pal.prompt_id = :source_prompt_id
            AND pe.created_at BETWEEN :start_date AND :end_date
            AND pe.created_at >= pal.created_at  -- Ensure proper sequence
            AND pe.created_at <= pal.created_at + INTERVAL :conversion_window_hours HOUR
        ORDER BY pe.created_at DESC
        LIMIT :limit
    """)

    result = await db.execute(query, {
        "workspace_id": str(funnel.workspace_id),
        "target_event_name": funnel.target_event_name,
        "target_event_category": funnel.target_event_category,
        "source_prompt_id": str(funnel.source_prompt_id),
        "start_date": start_date,
        "end_date": end_date,
        "conversion_window_hours": funnel.conversion_window_hours,
        "metric_type": funnel.metric_type,
        "metric_field": funnel.metric_field,
        "limit": limit
    })

    attribution_data = []
    for row in result:
        attribution_data.append({
            "trace_id": row.trace_id,
            "source_timestamp": row.source_timestamp,
            "target_timestamp": row.target_timestamp,
            "time_to_convert_minutes": int(row.time_to_convert_minutes) if row.time_to_convert_minutes else 0,
            "target_value": float(row.target_value) if row.target_value else None,
            "user_id": row.user_id
        })

    return attribution_data