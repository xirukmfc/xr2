import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.core.database import AsyncSessionLocal
from app.services.statistics import StatisticsService

logger = logging.getLogger(__name__)


class StatsAggregationScheduler:
    """Scheduler for automatic statistics aggregation"""

    def __init__(self):
        self.running = False
        self.task: Optional[asyncio.Task] = None

    async def start(self):
        """Start the scheduler"""
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self._run_scheduler())
        logger.info("📊 Statistics aggregation scheduler started")

    async def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("⏹️ Statistics aggregation scheduler stopped")

    async def _run_scheduler(self):
        """Main scheduler loop"""
        last_hour_aggregation = None
        last_day_aggregation = None

        while self.running:
            try:
                current_time = datetime.now(timezone.utc)

                # Hourly aggregation - run at the start of each hour
                if (last_hour_aggregation is None or
                        current_time.hour != last_hour_aggregation.hour):

                    if last_hour_aggregation is not None:  # Skip first run
                        await self._aggregate_hourly_stats()
                    last_hour_aggregation = current_time

                # Daily aggregation - run at 2 AM UTC
                if (current_time.hour == 2 and
                        (last_day_aggregation is None or
                         current_time.date() != last_day_aggregation.date())):
                    await self._aggregate_daily_stats()
                    last_day_aggregation = current_time

                # Check every 30 minutes
                await asyncio.sleep(1800)  # 30 minutes

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ Error in statistics scheduler: {e}")
                await asyncio.sleep(300)  # 5 minutes on error

    async def _aggregate_hourly_stats(self):
        """Aggregate statistics for the previous hour"""
        try:
            async with AsyncSessionLocal() as session:
                stats_service = StatisticsService(session)

                # Aggregate for the previous hour
                end_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
                start_time = end_time - timedelta(hours=1)

                count = await stats_service.aggregate_stats_for_period(
                    period_type="hour",
                    period_start=start_time,
                    period_end=end_time
                )

                logger.info(f"✅ Hourly stats aggregated: {count} records for {start_time} - {end_time}")

        except Exception as e:
            logger.error(f"❌ Failed to aggregate hourly stats: {e}")

    async def _aggregate_daily_stats(self):
        """Aggregate statistics for the previous day"""
        try:
            async with AsyncSessionLocal() as session:
                stats_service = StatisticsService(session)

                # Aggregate for yesterday
                end_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                start_date = end_date - timedelta(days=1)

                count = await stats_service.aggregate_stats_for_period(
                    period_type="day",
                    period_start=start_date,
                    period_end=end_date
                )

                logger.info(f"✅ Daily stats aggregated: {count} records for {start_date.date()}")

        except Exception as e:
            logger.error(f"❌ Failed to aggregate daily stats: {e}")


# Global scheduler instance
scheduler = StatsAggregationScheduler()
