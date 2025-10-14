from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy import select, func, and_, or_, Numeric
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.analytics import PromptEvent, PromptMetricsHourly, EventDefinition
import asyncio
from app.services.redis import redis_client
from app.core.database import get_session
import json


def validate_event_against_definition(event, event_definition):
    """Validate event data against event definition"""
    errors = []

    if not event.metadata:
        return errors

    # Check required fields
    for field in event_definition.required_fields or []:
        field_name = field.get('name')
        if not field_name:
            continue

        if field_name not in event.metadata:
            errors.append(f"Required field '{field_name}' is missing")
            continue

        # Basic type validation
        field_type = field.get('type', 'string')
        field_value = event.metadata[field_name]

        if field_type == 'number' and not isinstance(field_value, (int, float)):
            errors.append(f"Field '{field_name}' should be a number")
        elif field_type == 'boolean' and not isinstance(field_value, bool):
            errors.append(f"Field '{field_name}' should be a boolean")
        elif field_type == 'string' and not isinstance(field_value, str):
            errors.append(f"Field '{field_name}' should be a string")
        elif field_type == 'array' and not isinstance(field_value, list):
            errors.append(f"Field '{field_name}' should be an array")
        elif field_type == 'object' and not isinstance(field_value, dict):
            errors.append(f"Field '{field_name}' should be an object")

    return errors


async def process_event(event_id: str, workspace_id: UUID):
    """Process a single event - aggregations, alerts, etc."""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        # Get the event
        event = await db.get(PromptEvent, UUID(event_id))
        if not event:
            return

        # Update hourly metrics
        await update_hourly_metrics(db, event)

        # Check for alerts
        await check_alert_thresholds(db, event)

        # Update A/B test if applicable
        await update_ab_test_metrics(db, event)

        # Emit real-time update via WebSocket
        await emit_realtime_update(workspace_id, event)


async def update_hourly_metrics(db: AsyncSession, event: PromptEvent):
    """Update pre-aggregated hourly metrics"""
    hour_bucket = event.created_at.replace(minute=0, second=0, microsecond=0)

    # Get or create metrics record
    metrics = await db.execute(
        select(PromptMetricsHourly).where(
            and_(
                PromptMetricsHourly.workspace_id == event.workspace_id,
                PromptMetricsHourly.prompt_id == event.prompt_id,
                PromptMetricsHourly.prompt_version_id == event.prompt_version_id,
                PromptMetricsHourly.hour_bucket == hour_bucket
            )
        )
    )
    metrics = metrics.scalar_one_or_none()

    if not metrics:
        metrics = PromptMetricsHourly(
            workspace_id=event.workspace_id,
            prompt_id=event.prompt_id,
            prompt_version_id=event.prompt_version_id,
            hour_bucket=hour_bucket
        )
        db.add(metrics)

    # Update counts
    metrics.total_requests += 1

    if event.outcome == 'success':
        metrics.successful_outcomes += 1
    elif event.outcome == 'failure':
        metrics.failed_outcomes += 1
    elif event.outcome == 'partial':
        metrics.partial_outcomes += 1
    elif event.outcome == 'abandoned':
        metrics.abandoned_outcomes += 1

    # Update business metrics
    if event.business_metrics:
        if 'revenue' in event.business_metrics:
            metrics.total_revenue += float(event.business_metrics['revenue'])
        if 'value' in event.business_metrics:
            metrics.total_value += float(event.business_metrics['value'])
        if event.business_metrics.get('conversion'):
            metrics.conversion_count += 1

    # Update unique users (this is simplified, in production use HyperLogLog)
    if event.user_id:
        # Store unique users in Redis set with TTL
        await redis_client.sadd(
            f"unique_users:{event.workspace_id}:{event.prompt_id}:{hour_bucket}",
            event.user_id
        )
        await redis_client.expire(
            f"unique_users:{event.workspace_id}:{event.prompt_id}:{hour_bucket}",
            86400  # 24 hours
        )
        metrics.unique_users = await redis_client.scard(
            f"unique_users:{event.workspace_id}:{event.prompt_id}:{hour_bucket}"
        )

    await db.commit()


async def check_alert_thresholds(db: AsyncSession, event: PromptEvent):
    """Check if event triggers any configured alerts"""
    # Get event definition if exists
    if event.event_metadata and 'event_name' in event.event_metadata:
        event_def = await db.execute(
            select(EventDefinition).where(
                and_(
                    EventDefinition.workspace_id == event.workspace_id,
                    EventDefinition.event_name == event.event_metadata['event_name'],
                    EventDefinition.is_active == True
                )
            )
        )
        event_def = event_def.scalar_one_or_none()

        if event_def and event_def.alert_thresholds:
            thresholds = event_def.alert_thresholds

            # Check success rate threshold
            if 'success_rate_min' in thresholds and event.outcome != 'success':
                # Calculate current success rate
                recent_events = await db.execute(
                    select(PromptEvent).where(
                        and_(
                            PromptEvent.prompt_id == event.prompt_id,
                            PromptEvent.created_at > datetime.utcnow() - timedelta(hours=1)
                        )
                    )
                )
                recent_events = recent_events.scalars().all()

                if len(recent_events) >= 10:  # Minimum sample size
                    success_count = sum(1 for e in recent_events if e.outcome == 'success')
                    success_rate = (success_count / len(recent_events)) * 100

                    if success_rate < thresholds['success_rate_min']:
                        await send_alert(
                            workspace_id=event.workspace_id,
                            alert_type='low_success_rate',
                            details={
                                'prompt_id': str(event.prompt_id),
                                'event_name': event.event_metadata['event_name'],
                                'current_rate': success_rate,
                                'threshold': thresholds['success_rate_min']
                            }
                        )


async def calculate_roi_metrics(
        db: AsyncSession,
        prompt_id: UUID,
        period_days: int,
        workspace_id: UUID
) -> Dict[str, Any]:
    """Calculate comprehensive ROI metrics for a prompt"""

    start_date = datetime.utcnow() - timedelta(days=period_days)

    # Get aggregated metrics
    metrics = await db.execute(
        select(
            func.sum(PromptMetricsHourly.total_requests).label('total_requests'),
            func.sum(PromptMetricsHourly.successful_outcomes).label('successful_outcomes'),
            func.sum(PromptMetricsHourly.total_revenue).label('total_revenue'),
            func.sum(PromptMetricsHourly.total_value).label('total_value'),
            func.sum(PromptMetricsHourly.conversion_count).label('conversions'),
            func.sum(PromptMetricsHourly.token_cost).label('token_cost')
        ).where(
            and_(
                PromptMetricsHourly.workspace_id == workspace_id,
                PromptMetricsHourly.prompt_id == prompt_id,
                PromptMetricsHourly.hour_bucket >= start_date
            )
        )
    )
    metrics = metrics.first()

    if not metrics.total_requests:
        return {
            'period_days': period_days,
            'no_data': True
        }

    # Calculate ROI
    total_revenue = float(metrics.total_revenue or 0)
    total_cost = float(metrics.token_cost or 0)
    roi_percentage = ((total_revenue - total_cost) / total_cost * 100) if total_cost > 0 else 0

    return {
        'period_days': period_days,
        'total_requests': metrics.total_requests,
        'success_rate': (
                    metrics.successful_outcomes / metrics.total_requests * 100) if metrics.total_requests > 0 else 0,
        'total_revenue': total_revenue,
        'total_cost': total_cost,
        'net_profit': total_revenue - total_cost,
        'roi_percentage': roi_percentage,
        'cost_per_request': total_cost / metrics.total_requests if metrics.total_requests > 0 else 0,
        'revenue_per_success': total_revenue / metrics.successful_outcomes if metrics.successful_outcomes > 0 else 0,
        'conversion_rate': (metrics.conversions / metrics.total_requests * 100) if metrics.total_requests > 0 else 0,
        'average_order_value': total_revenue / metrics.conversions if metrics.conversions > 0 else 0
    }


# Scheduled job to run hourly
async def aggregate_metrics_job():
    """Background job to aggregate metrics every hour"""
    while True:
        try:
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                # Process events from the last hour
                one_hour_ago = datetime.utcnow() - timedelta(hours=1)

                # This is a simplified version - in production, process in batches
                events = await db.execute(
                    select(PromptEvent).where(
                        PromptEvent.created_at >= one_hour_ago
                    )
                )
                events = events.scalars().all()

                for event in events:
                    await update_hourly_metrics(db, event)

                await db.commit()

        except Exception as e:
            print(f"Error in aggregation job: {e}")

        # Wait for next hour
        await asyncio.sleep(3600)  # 1 hour


async def send_alert(workspace_id: UUID, alert_type: str, details: dict):
    """Send alert notification"""
    # TODO: Implement alert sending logic (email, webhook, etc.)
    print(f"ALERT [{alert_type}] for workspace {workspace_id}: {details}")


async def emit_realtime_update(workspace_id: UUID, event: PromptEvent):
    """Emit real-time updates via WebSocket"""
    # TODO: Implement WebSocket broadcast
    pass


async def update_ab_test_metrics(db: AsyncSession, event: PromptEvent):
    """Update A/B test metrics based on event"""
    # TODO: Implement A/B test metrics update logic
    pass


async def get_prompt_performance_metrics(
    db: AsyncSession,
    prompt_id: UUID,
    start_date: datetime,
    end_date: datetime,
    granularity: str,
    workspace_id: UUID
):
    """Get performance metrics for a prompt"""
    # Get aggregated metrics from hourly table
    metrics = await db.execute(
        select(PromptMetricsHourly).where(
            and_(
                PromptMetricsHourly.workspace_id == workspace_id,
                PromptMetricsHourly.prompt_id == prompt_id,
                PromptMetricsHourly.hour_bucket >= start_date,
                PromptMetricsHourly.hour_bucket <= end_date
            )
        ).order_by(PromptMetricsHourly.hour_bucket)
    )

    return metrics.scalars().all()


async def get_funnel_analysis(
    db: AsyncSession,
    event_sequence: list,
    start_date: datetime,
    end_date: datetime,
    segment_by: str,
    workspace_id: UUID
):
    """Analyze conversion funnel"""
    # TODO: Implement funnel analysis logic
    return {"funnel_data": []}


async def get_ab_test_results(db: AsyncSession, test_id: UUID, workspace_id: UUID):
    """Get A/B test results with statistical significance"""
    # TODO: Implement A/B test results retrieval
    return {"results": {}}


async def get_workspace_summary(db: AsyncSession, workspace_id: UUID, start_date: datetime, end_date: datetime):
    """Get workspace analytics summary"""
    # Get summary metrics
    summary = await db.execute(
        select(
            func.sum(PromptMetricsHourly.total_requests).label('total_events'),
            func.avg(PromptMetricsHourly.successful_outcomes / PromptMetricsHourly.total_requests * 100).label('success_rate'),
            func.sum(PromptMetricsHourly.total_revenue).label('total_revenue'),
            func.sum(PromptMetricsHourly.unique_users).label('unique_users'),
            func.avg(PromptMetricsHourly.avg_response_time_ms).label('avg_response_time_ms')
        ).where(
            and_(
                PromptMetricsHourly.workspace_id == workspace_id,
                PromptMetricsHourly.hour_bucket >= start_date,
                PromptMetricsHourly.hour_bucket <= end_date
            )
        )
    )
    result = summary.first()

    # Calculate ROI
    total_revenue = float(result.total_revenue or 0)
    total_cost = 100  # Placeholder - should calculate actual token costs
    roi_percentage = ((total_revenue - total_cost) / total_cost * 100) if total_cost > 0 else 0

    return {
        "total_events": result.total_events or 0,
        "success_rate": result.success_rate or 0,
        "total_revenue": total_revenue,
        "unique_users": result.unique_users or 0,
        "avg_response_time_ms": result.avg_response_time_ms or 0,
        "roi_percentage": roi_percentage
    }


async def get_top_performing_prompts(db: AsyncSession, workspace_id: UUID, start_date: datetime, end_date: datetime):
    """Get top performing prompts by ROI"""
    # TODO: Implement top prompts logic with actual prompt names
    return []


async def get_recent_events(db: AsyncSession, workspace_id: UUID, limit: int = 100):
    """Get recent events"""
    events = await db.execute(
        select(PromptEvent).where(
            PromptEvent.workspace_id == workspace_id
        ).order_by(PromptEvent.created_at.desc()).limit(limit)
    )
    return events.scalars().all()


async def get_error_analysis(db: AsyncSession, workspace_id: UUID, start_date: datetime, end_date: datetime):
    """Get error analysis"""
    # TODO: Implement error analysis logic
    return {"error_count": 0, "error_types": []}


async def get_roi_summary(db: AsyncSession, workspace_id: UUID, start_date: datetime, end_date: datetime):
    """Get ROI summary"""
    # TODO: Implement ROI summary logic
    return {"total_roi": 0}


async def get_metric_trends(db: AsyncSession, workspace_id: UUID, start_date: datetime, end_date: datetime):
    """Get metric trends over time"""
    trends = await db.execute(
        select(
            PromptMetricsHourly.hour_bucket.label('date'),
            func.avg(PromptMetricsHourly.successful_outcomes / PromptMetricsHourly.total_requests * 100).label('success_rate'),
            func.sum(PromptMetricsHourly.total_requests).label('event_count'),
            func.sum(PromptMetricsHourly.total_revenue).label('revenue')
        ).where(
            and_(
                PromptMetricsHourly.workspace_id == workspace_id,
                PromptMetricsHourly.hour_bucket >= start_date,
                PromptMetricsHourly.hour_bucket <= end_date
            )
        ).group_by(PromptMetricsHourly.hour_bucket).order_by(PromptMetricsHourly.hour_bucket)
    )

    return [
        {
            "date": row.date.isoformat(),
            "success_rate": row.success_rate or 0,
            "event_count": row.event_count or 0,
            "revenue": float(row.revenue or 0)
        }
        for row in trends
    ]


async def get_monthly_events_chart_data(db: AsyncSession, workspace_id: UUID):
    """Get monthly event data grouped by event_name + category for dashboard chart"""
    # Get data for the last month, but extend to include today
    end_date = datetime.utcnow() + timedelta(hours=1)  # Add 1 hour to ensure today is included
    start_date = end_date - timedelta(days=31)  # Use 31 days to be safe

    # Query events grouped by day, event_name, and category
    event_name_field = func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'unknown')
    category_field = func.coalesce(PromptEvent.event_metadata['category'].astext, 'general')
    # Use date_trunc to avoid timezone issues
    date_field = func.date_trunc('day', PromptEvent.created_at)

    events_data = await db.execute(
        select(
            date_field.label('date'),
            event_name_field.label('event_name'),
            category_field.label('category'),
            func.count(PromptEvent.id).label('count')
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

    # Transform data for chart display
    chart_data = {}
    for row in events_data:
        # row.date is now a timestamp from date_trunc, extract date part
        date_str = row.date.date().strftime('%Y-%m-%d') if hasattr(row.date, 'date') else row.date.strftime('%Y-%m-%d')
        group_key = f"{row.event_name}_{row.category}"

        if group_key not in chart_data:
            chart_data[group_key] = {
                'name': f"{row.event_name} ({row.category})",
                'event_name': row.event_name,
                'category': row.category,
                'data': {}
            }

        chart_data[group_key]['data'][date_str] = row.count

    # Fill missing dates with 0 values
    date_range = []
    current_date = start_date.date()
    while current_date <= end_date.date():
        date_range.append(current_date.strftime('%Y-%m-%d'))
        current_date += timedelta(days=1)

    # Ensure all series have data for all dates
    for group_data in chart_data.values():
        for date_str in date_range:
            if date_str not in group_data['data']:
                group_data['data'][date_str] = 0

    # Convert to list format suitable for charts
    return {
        'dates': date_range,
        'series': [
            {
                'name': group_data['name'],
                'event_name': group_data['event_name'],
                'category': group_data['category'],
                'data': [group_data['data'][date] for date in date_range]
            }
            for group_data in chart_data.values()
        ]
    }


async def generate_conversion_report(
    db: AsyncSession,
    workspace_id: UUID,
    start_date: datetime,
    end_date: datetime,
    prompt_ids: Optional[List[UUID]] = None,
    conversion_event_name: Optional[str] = None,
    conversion_metric: str = 'conversion_count',
    report_format: str = 'table'
):
    """Generate comprehensive conversion reports with filtering options"""

    # Build base query conditions
    conditions = [
        PromptEvent.workspace_id == workspace_id,
        PromptEvent.created_at >= start_date,
        PromptEvent.created_at <= end_date
    ]

    # Add prompt filtering if specified
    if prompt_ids:
        conditions.append(PromptEvent.prompt_id.in_(prompt_ids))

    # Add conversion event filtering if specified
    if conversion_event_name:
        conditions.append(PromptEvent.event_metadata['event_name'].astext == conversion_event_name)

    # Query for conversion data
    if report_format == 'table':
        # Table format: detailed breakdown by prompt and date
        conversion_data = await db.execute(
            select(
                PromptEvent.prompt_id.label('prompt_id'),
                func.date(PromptEvent.created_at).label('date'),
                func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'unknown').label('event_name'),
                func.coalesce(PromptEvent.event_metadata['category'].astext, 'general').label('category'),
                func.count(PromptEvent.id).label('total_events'),
                func.sum(
                    func.case(
                        (PromptEvent.business_metrics['conversion'].astext == 'true', 1),
                        else_=0
                    )
                ).label('conversions'),
                func.sum(
                    func.cast(
                        func.coalesce(PromptEvent.business_metrics['revenue'].astext, '0'),
                        Numeric
                    )
                ).label('total_revenue'),
                func.sum(
                    func.cast(
                        func.coalesce(PromptEvent.business_metrics['value'].astext, '0'),
                        Numeric
                    )
                ).label('total_value')
            ).where(
                and_(*conditions)
            ).group_by(
                PromptEvent.prompt_id,
                func.date(PromptEvent.created_at),
                func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'unknown'),
                func.coalesce(PromptEvent.event_metadata['category'].astext, 'general')
            ).order_by(
                func.date(PromptEvent.created_at).desc(),
                PromptEvent.prompt_id
            )
        )

        # Format table data
        table_rows = []
        for row in conversion_data:
            conversion_rate = (row.conversions / row.total_events * 100) if row.total_events > 0 else 0
            avg_revenue_per_event = (float(row.total_revenue or 0) / row.total_events) if row.total_events > 0 else 0
            avg_value_per_event = (float(row.total_value or 0) / row.total_events) if row.total_events > 0 else 0

            table_rows.append({
                'date': row.date.strftime('%Y-%m-%d'),
                'prompt_id': str(row.prompt_id) if row.prompt_id else None,
                'event_name': row.event_name,
                'category': row.category,
                'total_events': row.total_events,
                'conversions': row.conversions,
                'conversion_rate': round(conversion_rate, 2),
                'total_revenue': float(row.total_revenue or 0),
                'total_value': float(row.total_value or 0),
                'avg_revenue_per_event': round(avg_revenue_per_event, 2),
                'avg_value_per_event': round(avg_value_per_event, 2)
            })

        return {
            'format': 'table',
            'data': table_rows,
            'total_rows': len(table_rows)
        }

    elif report_format == 'chart':
        # Chart format: time series data for visualizations
        chart_data = await db.execute(
            select(
                func.date(PromptEvent.created_at).label('date'),
                func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'unknown').label('event_name'),
                func.coalesce(PromptEvent.event_metadata['category'].astext, 'general').label('category'),
                func.count(PromptEvent.id).label('total_events'),
                func.sum(
                    func.case(
                        (PromptEvent.business_metrics['conversion'].astext == 'true', 1),
                        else_=0
                    )
                ).label('conversions'),
                func.sum(
                    func.cast(
                        func.coalesce(PromptEvent.business_metrics['revenue'].astext, '0'),
                        Numeric
                    )
                ).label('total_revenue')
            ).where(
                and_(*conditions)
            ).group_by(
                func.date(PromptEvent.created_at),
                func.coalesce(PromptEvent.event_metadata['event_name'].astext, 'unknown'),
                func.coalesce(PromptEvent.event_metadata['category'].astext, 'general')
            ).order_by(
                func.date(PromptEvent.created_at)
            )
        )

        # Format chart data
        chart_series = {}
        date_range = set()

        for row in chart_data:
            date_str = row.date.strftime('%Y-%m-%d')
            date_range.add(date_str)

            series_key = f"{row.event_name}_{row.category}"
            if series_key not in chart_series:
                chart_series[series_key] = {
                    'name': f"{row.event_name} ({row.category})",
                    'event_name': row.event_name,
                    'category': row.category,
                    'data': {}
                }

            # Calculate metrics based on conversion_metric parameter
            if conversion_metric == 'conversion_count':
                value = row.conversions
            elif conversion_metric == 'conversion_rate':
                value = (row.conversions / row.total_events * 100) if row.total_events > 0 else 0
            elif conversion_metric == 'revenue':
                value = float(row.total_revenue or 0)
            else:
                value = row.conversions  # default

            chart_series[series_key]['data'][date_str] = value

        # Fill missing dates with 0 values
        sorted_dates = sorted(list(date_range))

        # Ensure all series have data for all dates
        for series_data in chart_series.values():
            for date_str in sorted_dates:
                if date_str not in series_data['data']:
                    series_data['data'][date_str] = 0

        return {
            'format': 'chart',
            'dates': sorted_dates,
            'series': [
                {
                    'name': series_data['name'],
                    'event_name': series_data['event_name'],
                    'category': series_data['category'],
                    'data': [series_data['data'][date] for date in sorted_dates]
                }
                for series_data in chart_series.values()
            ],
            'metric': conversion_metric
        }


async def get_available_prompts_for_reports(db: AsyncSession, workspace_id: UUID):
    """Get list of available prompts for conversion reports filtering"""
    from app.models.prompt import Prompt

    prompts = await db.execute(
        select(
            Prompt.id,
            Prompt.name,
            Prompt.description
        ).where(
            and_(
                Prompt.workspace_id == workspace_id,
                Prompt.is_active == True
            )
        ).order_by(Prompt.name)
    )

    return [
        {
            'id': str(prompt.id),
            'name': prompt.name,
            'description': prompt.description
        }
        for prompt in prompts
    ]


async def get_available_conversion_events(db: AsyncSession, workspace_id: UUID):
    """Get list of available conversion events for filtering"""
    events = await db.execute(
        select(
            func.distinct(PromptEvent.event_metadata['event_name'].astext).label('event_name'),
            func.count(PromptEvent.id).label('count')
        ).where(
            and_(
                PromptEvent.workspace_id == workspace_id,
                PromptEvent.event_metadata['event_name'].astext.isnot(None),
                PromptEvent.business_metrics['conversion'].astext == 'true'
            )
        ).group_by(
            PromptEvent.event_metadata['event_name'].astext
        ).order_by(
            func.count(PromptEvent.id).desc()
        )
    )

    return [
        {
            'event_name': row.event_name,
            'conversion_count': row.count
        }
        for row in events if row.event_name
    ]


