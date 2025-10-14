#!/usr/bin/env python3
"""
Script for aggregating prompt usage statistics

This script should be run periodically (e.g., via cron) to aggregate raw logs
into the PromptStats table for better query performance.

Usage:
    python -m app.scripts.aggregate_stats [--period=hour|day] [--verbose]
"""

import asyncio
import argparse
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from app.core.config import settings
from app.services.statistics import StatisticsService


async def run_aggregation(period_type: str, verbose: bool = False):
    """Run statistics aggregation for specified period"""
    
    # Create database connection
    engine = create_async_engine(settings.DATABASE_URL, echo=verbose)
    
    try:
        async with AsyncSession(engine) as session:
            stats_service = StatisticsService(session)
            
            print(f"Starting {period_type} aggregation at {datetime.now(timezone.utc)}")
            
            # Aggregate stats for the specified period
            aggregated_count = await stats_service.aggregate_stats_for_period(period_type)
            
            print(f"Aggregated {aggregated_count} statistics records")
            print(f"Aggregation completed at {datetime.now(timezone.utc)}")
            
    except Exception as e:
        print(f"Error during aggregation: {e}")
        raise
    finally:
        await engine.dispose()


async def run_historical_aggregation(period_type: str, days_back: int = 7):
    """Run aggregation for historical data"""
    
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    try:
        async with AsyncSession(engine) as session:
            stats_service = StatisticsService(session)
            
            if period_type == "hour":
                # Aggregate hourly for each hour in the past N days
                total_processed = 0
                current_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
                
                for i in range(days_back * 24):  # N days * 24 hours
                    period_start = current_time - timedelta(hours=i+1)
                    period_end = period_start + timedelta(hours=1)
                    
                    print(f"Processing hour: {period_start} to {period_end}")
                    
                    count = await stats_service.aggregate_stats_for_period(
                        period_type="hour", 
                        period_start=period_start,
                        period_end=period_end
                    )
                    total_processed += count
                    
                print(f"Historical aggregation completed. Total records: {total_processed}")
                
            elif period_type == "day":
                # Aggregate daily for each day in the past N days
                total_processed = 0
                current_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                
                for i in range(days_back):
                    period_start = current_date - timedelta(days=i+1)
                    period_end = period_start + timedelta(days=1)
                    
                    print(f"Processing day: {period_start} to {period_end}")
                    
                    count = await stats_service.aggregate_stats_for_period(
                        period_type="day",
                        period_start=period_start, 
                        period_end=period_end
                    )
                    total_processed += count
                    
                print(f"Historical aggregation completed. Total records: {total_processed}")
            
    finally:
        await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Aggregate prompt usage statistics")
    parser.add_argument(
        "--period", 
        choices=["hour", "day"], 
        default="hour",
        help="Aggregation period (default: hour)"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true",
        help="Enable verbose database logging"
    )
    parser.add_argument(
        "--historical",
        action="store_true", 
        help="Run historical aggregation instead of current period"
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=7,
        help="Number of days to go back for historical aggregation (default: 7)"
    )
    
    args = parser.parse_args()
    
    if args.historical:
        print(f"Running historical {args.period} aggregation for {args.days_back} days")
        asyncio.run(run_historical_aggregation(args.period, args.days_back))
    else:
        print(f"Running {args.period} aggregation")
        asyncio.run(run_aggregation(args.period, args.verbose))


if __name__ == "__main__":
    main()
