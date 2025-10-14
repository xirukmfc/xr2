from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.models.product_api_key import ProductAPILog
from app.models.product_api_key import ProductAPIKey
from app.models.prompt import Prompt
from app.models.prompt_stats import PromptStats


class StatisticsService:
    """Service for calculating prompt usage statistics from API logs"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_prompt_version_stats(
            self,
            prompt_version_id: UUID,
            hours: int = 24
    ) -> Dict[str, Any]:
        """Get statistics for a specific prompt version over the last N hours"""

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

        # Base query for this version's logs
        base_query = select(ProductAPILog).where(
            and_(
                ProductAPILog.prompt_version_id == prompt_version_id,
                ProductAPILog.created_at >= cutoff_time
            )
        )

        # Total requests
        result = await self.session.execute(base_query)
        logs = result.scalars().all()

        total_requests = len(logs)
        successful_requests = len([log for log in logs if log.is_success])

        # Calculate metrics
        stats = {
            "prompt_version_id": str(prompt_version_id),
            "period_hours": hours,
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "success_rate_percent": round((successful_requests / total_requests * 100) if total_requests > 0 else 0, 2),
            "average_latency_ms": round(
                sum(log.latency_ms or 0 for log in logs) / total_requests) if total_requests > 0 else 0,
        }

        # Group by source (from request body)
        source_stats = {}
        for log in logs:
            source_name = "unknown"
            if log.request_body and isinstance(log.request_body, dict):
                source_name = log.request_body.get("source_name", "unknown")

            if source_name not in source_stats:
                source_stats[source_name] = {"total": 0, "successful": 0}

            source_stats[source_name]["total"] += 1
            if log.is_success:
                source_stats[source_name]["successful"] += 1

        stats["requests_by_source"] = source_stats

        return stats

    async def get_prompt_stats(
            self,
            prompt_id: UUID,
            hours: int = 24
    ) -> Dict[str, Any]:
        """Get aggregated statistics for all versions of a prompt over the last N hours"""

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

        # Get prompt info (without versions for better performance)
        prompt_query = select(Prompt).where(Prompt.id == prompt_id)

        result = await self.session.execute(prompt_query)
        prompt = result.scalar_one_or_none()

        if not prompt:
            return {"error": "Prompt not found"}

        # No need to check versions - proceed directly to logs

        # Base query for this prompt's logs (use prompt_id directly for better performance)
        logs_query = select(ProductAPILog).where(
            and_(
                ProductAPILog.prompt_id == prompt_id,
                ProductAPILog.created_at >= cutoff_time
            )
        )

        result = await self.session.execute(logs_query)
        logs = result.scalars().all()

        total_requests = len(logs)
        successful_requests = len([log for log in logs if log.is_success])

        # Overall stats
        stats = {
            "prompt_id": str(prompt_id),
            "prompt_name": prompt.name,
            "prompt_slug": prompt.slug,
            "period_hours": hours,
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "success_rate_percent": round((successful_requests / total_requests * 100) if total_requests > 0 else 0, 2),
            "average_latency_ms": round(
                sum(log.latency_ms or 0 for log in logs) / total_requests) if total_requests > 0 else 0,
        }

        # Group by source (from request body)
        source_stats = {}
        for log in logs:
            source_name = "unknown"
            if log.request_body and isinstance(log.request_body, dict):
                source_name = log.request_body.get("source_name", "unknown")

            if source_name not in source_stats:
                source_stats[source_name] = {"total": 0, "successful": 0}

            source_stats[source_name]["total"] += 1
            if log.is_success:
                source_stats[source_name]["successful"] += 1

        stats["requests_by_source"] = source_stats

        # Version breakdown - simplified (group by version_id from logs)
        version_stats = {}
        for log in logs:
            if log.prompt_version_id:
                version_id = str(log.prompt_version_id)
                if version_id not in version_stats:
                    version_stats[version_id] = {
                        "version_id": version_id,
                        "total_requests": 0,
                        "successful_requests": 0,
                        "latencies": []
                    }

                version_stats[version_id]["total_requests"] += 1
                if log.is_success:
                    version_stats[version_id]["successful_requests"] += 1
                if log.latency_ms:
                    version_stats[version_id]["latencies"].append(log.latency_ms)

        version_breakdown = []
        for version_data in version_stats.values():
            total = version_data["total_requests"]
            successful = version_data["successful_requests"]
            latencies = version_data["latencies"]

            version_breakdown.append({
                "version_id": version_data["version_id"],
                "total_requests": total,
                "successful_requests": successful,
                "success_rate_percent": round((successful / total * 100) if total > 0 else 0, 2),
                "average_latency_ms": round(sum(latencies) / len(latencies)) if latencies else 0,
            })

        # Sort by total requests desc
        version_breakdown.sort(key=lambda x: x["total_requests"], reverse=True)
        stats["version_breakdown"] = version_breakdown

        return stats

    async def get_prompt_request_count_24h(self, prompt_id: UUID) -> int:
        """Get simple count of requests for a prompt in last 24h - optimized for bulk operations"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)

        count_query = select(func.count(ProductAPILog.id)).where(
            and_(
                ProductAPILog.prompt_id == prompt_id,
                ProductAPILog.created_at >= cutoff_time
            )
        )

        result = await self.session.execute(count_query)
        return result.scalar() or 0

    async def get_multiple_prompts_request_counts_24h(self, prompt_ids: List[UUID]) -> Dict[str, int]:
        """Get 24h request counts for multiple prompts in one query - batch optimization"""
        if not prompt_ids:
            return {}

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)

        count_query = select(
            ProductAPILog.prompt_id,
            func.count(ProductAPILog.id).label('request_count')
        ).where(
            and_(
                ProductAPILog.prompt_id.in_(prompt_ids),
                ProductAPILog.created_at >= cutoff_time
            )
        ).group_by(ProductAPILog.prompt_id)

        result = await self.session.execute(count_query)
        rows = result.fetchall()

        # Convert to dict with string keys (UUID -> str conversion)
        counts = {}
        for row in rows:
            counts[str(row.prompt_id)] = row.request_count

        # Fill in zero counts for prompts with no requests
        for prompt_id in prompt_ids:
            if str(prompt_id) not in counts:
                counts[str(prompt_id)] = 0

        return counts

    async def get_api_key_stats(
            self,
            api_key_id: UUID,
            hours: int = 24
    ) -> Dict[str, Any]:
        """Get usage statistics for a specific API key over the last N hours"""

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

        # Get API key info
        api_key_query = select(ProductAPIKey).where(ProductAPIKey.id == api_key_id)
        result = await self.session.execute(api_key_query)
        api_key = result.scalar_one_or_none()

        if not api_key:
            return {"error": "API key not found"}

        # Get logs for this API key
        logs_query = select(ProductAPILog).where(
            and_(
                ProductAPILog.api_key_id == api_key_id,
                ProductAPILog.created_at >= cutoff_time
            )
        )

        result = await self.session.execute(logs_query)
        logs = result.scalars().all()

        total_requests = len(logs)
        successful_requests = len([log for log in logs if log.is_success])

        stats = {
            "api_key_id": str(api_key_id),
            "api_key_name": api_key.name,
            "api_key_prefix": api_key.key_prefix,
            "period_hours": hours,
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "success_rate_percent": round((successful_requests / total_requests * 100) if total_requests > 0 else 0, 2),
            "average_latency_ms": round(
                sum(log.latency_ms or 0 for log in logs) / total_requests) if total_requests > 0 else 0,
        }

        # Group by endpoint
        endpoint_stats = {}
        for log in logs:
            endpoint = log.endpoint
            if endpoint not in endpoint_stats:
                endpoint_stats[endpoint] = {"total": 0, "successful": 0}

            endpoint_stats[endpoint]["total"] += 1
            if log.is_success:
                endpoint_stats[endpoint]["successful"] += 1

        stats["requests_by_endpoint"] = endpoint_stats

        # Group by source (from request body)
        source_stats = {}
        for log in logs:
            source_name = "unknown"
            if log.request_body and isinstance(log.request_body, dict):
                source_name = log.request_body.get("source_name", "unknown")

            if source_name not in source_stats:
                source_stats[source_name] = {"total": 0, "successful": 0}

            source_stats[source_name]["total"] += 1
            if log.is_success:
                source_stats[source_name]["successful"] += 1

        stats["requests_by_source"] = source_stats

        return stats

    async def get_all_api_keys_stats(
            self,
            user_id: Optional[UUID] = None,
            hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Get usage statistics for all API keys, optionally filtered by user"""

        # Get API keys
        api_keys_query = select(ProductAPIKey)
        if user_id:
            api_keys_query = api_keys_query.where(ProductAPIKey.user_id == user_id)

        result = await self.session.execute(api_keys_query)
        api_keys = result.scalars().all()

        stats_list = []
        for api_key in api_keys:
            key_stats = await self.get_api_key_stats(api_key.id, hours)
            stats_list.append(key_stats)

        # Sort by total requests desc
        stats_list.sort(key=lambda x: x.get("total_requests", 0), reverse=True)

        return stats_list

    async def get_overall_stats(
            self,
            hours: int = 24,
            user_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get overall system statistics"""

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

        # Build base query
        logs_query = select(ProductAPILog).where(
            ProductAPILog.created_at >= cutoff_time
        )

        # If user_id is provided, filter by user's API keys
        if user_id:
            # Get user's API keys
            api_keys_query = select(ProductAPIKey.id).where(ProductAPIKey.user_id == user_id)
            result = await self.session.execute(api_keys_query)
            user_api_key_ids = [row[0] for row in result.fetchall()]

            if user_api_key_ids:
                logs_query = logs_query.where(ProductAPILog.api_key_id.in_(user_api_key_ids))
            else:
                # User has no API keys
                return {
                    "period_hours": hours,
                    "total_requests": 0,
                    "successful_requests": 0,
                    "success_rate_percent": 0,
                    "average_latency_ms": 0,
                    "unique_api_keys": 0,
                    "unique_prompts": 0,
                    "unique_users": 0
                }

        result = await self.session.execute(logs_query)
        logs = result.scalars().all()

        total_requests = len(logs)
        successful_requests = len([log for log in logs if log.is_success])

        # Unique counts
        unique_api_keys = len(set(log.api_key_id for log in logs))
        unique_prompts = len(set(log.prompt_id for log in logs if log.prompt_id))

        # Get unique users count
        unique_users = 0
        if logs:
            api_key_ids = list(set(log.api_key_id for log in logs))
            users_query = select(func.count(func.distinct(ProductAPIKey.user_id))).where(
                ProductAPIKey.id.in_(api_key_ids)
            )
            result = await self.session.execute(users_query)
            unique_users = result.scalar() or 0

        stats = {
            "period_hours": hours,
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "success_rate_percent": round((successful_requests / total_requests * 100) if total_requests > 0 else 0, 2),
            "average_latency_ms": round(
                sum(log.latency_ms or 0 for log in logs) / total_requests) if total_requests > 0 else 0,
            "unique_api_keys": unique_api_keys,
            "unique_prompts": unique_prompts,
            "unique_users": unique_users
        }

        return stats

    async def get_prompt_usage_summary(
            self,
            prompt_id: UUID,
            hours_24: bool = True,
            all_time: bool = True
    ) -> Dict[str, Any]:
        """Get comprehensive prompt usage summary combining cached and real-time data"""

        result = {
            "prompt_id": str(prompt_id),
            "summary": {}
        }

        if hours_24:
            # Get recent 24h stats (real-time from logs)
            result["last_24_hours"] = await self.get_prompt_stats(prompt_id, 24)

        if all_time:
            # Get all-time stats from aggregated data + recent logs
            result["all_time"] = await self._get_all_time_stats(prompt_id)

        return result

    async def _get_all_time_stats(self, prompt_id: UUID) -> Dict[str, Any]:
        """Get all-time statistics using cached aggregated data plus recent logs"""

        # Get aggregated stats from PromptStats table
        stats_query = select(PromptStats).where(PromptStats.prompt_id == prompt_id)
        result = await self.session.execute(stats_query)
        cached_stats = result.scalars().all()

        # Aggregate by source and version
        source_totals = {}
        version_totals = {}
        overall_total = 0
        overall_successful = 0
        status_breakdown = {
            "200": 0, "400": 0, "401": 0, "403": 0, "404": 0, "422": 0, "500": 0, "other": 0
        }

        for stat in cached_stats:
            source = stat.source_name
            version_id = str(stat.prompt_version_id) if stat.prompt_version_id else "unknown"

            # Aggregate by source
            if source not in source_totals:
                source_totals[source] = {"total": 0, "successful": 0}
            source_totals[source]["total"] += stat.total_requests
            source_totals[source]["successful"] += stat.successful_requests

            # Aggregate by version
            if version_id not in version_totals:
                version_totals[version_id] = {"total": 0, "successful": 0}
            version_totals[version_id]["total"] += stat.total_requests
            version_totals[version_id]["successful"] += stat.successful_requests

            # Overall totals
            overall_total += stat.total_requests
            overall_successful += stat.successful_requests

            # Status breakdown
            status_breakdown["200"] += stat.status_200_count
            status_breakdown["400"] += stat.status_400_count
            status_breakdown["401"] += stat.status_401_count
            status_breakdown["403"] += stat.status_403_count
            status_breakdown["404"] += stat.status_404_count
            status_breakdown["422"] += stat.status_422_count
            status_breakdown["500"] += stat.status_500_count
            status_breakdown["other"] += stat.status_other_count

        return {
            "total_requests": overall_total,
            "successful_requests": overall_successful,
            "success_rate_percent": round((overall_successful / overall_total * 100) if overall_total > 0 else 0, 2),
            "requests_by_source": source_totals,
            "requests_by_version": version_totals,
            "status_breakdown": status_breakdown
        }

    async def aggregate_stats_for_period(
            self,
            period_type: str = "hour",  # "hour" or "day"
            period_start: datetime = None,
            period_end: datetime = None
    ) -> int:
        """Aggregate raw logs into PromptStats table for a specific period"""

        if not period_start:
            if period_type == "hour":
                # Default to last hour
                period_end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
                period_start = period_end - timedelta(hours=1)
            else:  # day
                # Default to yesterday
                period_end = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                period_start = period_end - timedelta(days=1)

        if not period_end:
            if period_type == "hour":
                period_end = period_start + timedelta(hours=1)
            else:
                period_end = period_start + timedelta(days=1)

        # Get logs for this period
        logs_query = select(ProductAPILog).where(
            and_(
                ProductAPILog.created_at >= period_start,
                ProductAPILog.created_at < period_end,
                ProductAPILog.prompt_id.isnot(None)  # Only logs with prompt tracking
            )
        )

        result = await self.session.execute(logs_query)
        logs = result.scalars().all()

        if not logs:
            return 0

        # Group by prompt_id, prompt_version_id, source_name
        groups = {}
        for log in logs:
            source_name = "unknown"
            if log.request_body and isinstance(log.request_body, dict):
                source_name = log.request_body.get("source_name", "unknown")

            key = (log.prompt_id, log.prompt_version_id, source_name)
            if key not in groups:
                groups[key] = []
            groups[key].append(log)

        aggregated_count = 0

        for (prompt_id, prompt_version_id, source_name), group_logs in groups.items():
            # Calculate aggregated metrics
            total_requests = len(group_logs)
            successful_requests = len([l for l in group_logs if l.is_success])
            failed_requests = total_requests - successful_requests

            # Status code breakdown
            status_counts = {
                200: 0, 400: 0, 401: 0, 403: 0, 404: 0, 422: 0, 500: 0, "other": 0
            }

            latencies = []
            for log in group_logs:
                status = log.status_code
                if status in status_counts:
                    status_counts[status] += 1
                else:
                    status_counts["other"] += 1

                if log.latency_ms:
                    latencies.append(log.latency_ms)

            # Calculate latency stats
            total_latency = sum(latencies)
            avg_latency = int(total_latency / len(latencies)) if latencies else 0
            min_latency = min(latencies) if latencies else None
            max_latency = max(latencies) if latencies else None

            # Check if stats already exist for this combination
            existing_query = select(PromptStats).where(
                and_(
                    PromptStats.prompt_id == prompt_id,
                    PromptStats.prompt_version_id == prompt_version_id,
                    PromptStats.source_name == source_name,
                    PromptStats.period_type == period_type,
                    PromptStats.period_start == period_start
                )
            )
            existing_result = await self.session.execute(existing_query)
            existing_stat = existing_result.scalar_one_or_none()

            if existing_stat:
                # Update existing record
                existing_stat.total_requests = total_requests
                existing_stat.successful_requests = successful_requests
                existing_stat.failed_requests = failed_requests
                existing_stat.status_200_count = status_counts[200]
                existing_stat.status_400_count = status_counts[400]
                existing_stat.status_401_count = status_counts[401]
                existing_stat.status_403_count = status_counts[403]
                existing_stat.status_404_count = status_counts[404]
                existing_stat.status_422_count = status_counts[422]
                existing_stat.status_500_count = status_counts[500]
                existing_stat.status_other_count = status_counts["other"]
                existing_stat.total_latency_ms = total_latency
                existing_stat.avg_latency_ms = avg_latency
                existing_stat.min_latency_ms = min_latency
                existing_stat.max_latency_ms = max_latency
                existing_stat.updated_at = datetime.now(timezone.utc)
            else:
                # Create new record
                stat = PromptStats(
                    prompt_id=prompt_id,
                    prompt_version_id=prompt_version_id,
                    source_name=source_name,
                    period_type=period_type,
                    period_start=period_start,
                    period_end=period_end,
                    total_requests=total_requests,
                    successful_requests=successful_requests,
                    failed_requests=failed_requests,
                    status_200_count=status_counts[200],
                    status_400_count=status_counts[400],
                    status_401_count=status_counts[401],
                    status_403_count=status_counts[403],
                    status_404_count=status_counts[404],
                    status_422_count=status_counts[422],
                    status_500_count=status_counts[500],
                    status_other_count=status_counts["other"],
                    total_latency_ms=total_latency,
                    avg_latency_ms=avg_latency,
                    min_latency_ms=min_latency,
                    max_latency_ms=max_latency
                )
                self.session.add(stat)

            aggregated_count += 1

        await self.session.commit()
        return aggregated_count
