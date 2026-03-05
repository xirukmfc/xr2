from datetime import datetime
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_limits import UserLimits, GlobalLimits, UserAPIUsage
from app.models.prompt import Prompt
from app.models.subscription import UserSubscription


class LimitsService:
    """Service for handling user limits and usage tracking"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_user_limits(self, user_id: UUID) -> UserLimits:
        """Get or create user limits with global defaults"""
        # Try to get existing user limits
        result = await self.session.execute(
            select(UserLimits).where(UserLimits.user_id == user_id)
        )
        user_limits = result.scalar_one_or_none()

        if user_limits:
            return user_limits

        # Get global defaults
        global_limits = await self.get_global_limits()

        # Create new user limits with global defaults
        user_limits = UserLimits(
            user_id=user_id,
            max_prompts=global_limits.default_max_prompts,
            max_api_requests_per_month=global_limits.default_max_api_requests_per_month
        )

        self.session.add(user_limits)
        try:
            await self.session.flush()
        except Exception:
            # If there's a unique constraint violation, rollback and try to get existing record
            await self.session.rollback()
            result = await self.session.execute(
                select(UserLimits).where(UserLimits.user_id == user_id)
            )
            existing_user_limits = result.scalar_one_or_none()
            if existing_user_limits:
                return existing_user_limits
            # If still no record, re-raise the original exception
            raise

        return user_limits

    async def get_global_limits(self) -> GlobalLimits:
        """Get active global limits or create default ones"""
        result = await self.session.execute(
            select(GlobalLimits).where(GlobalLimits.is_active == True)
            .order_by(GlobalLimits.created_at.desc())
        )
        global_limits = result.scalar_one_or_none()

        if not global_limits:
            # Create default global limits
            global_limits = GlobalLimits(
                default_max_prompts=5,
                default_max_api_requests_per_month=100,
                is_active=True
            )
            self.session.add(global_limits)
            await self.session.flush()

        return global_limits

    async def get_effective_limits(self, user_id: UUID) -> Tuple[int, int]:
        """Get effective limits for user (considering subscription plan and custom limits)"""
        # First check subscription plan
        subscription_result = await self.session.execute(
            select(UserSubscription).where(UserSubscription.user_id == user_id)
        )
        subscription = subscription_result.scalar_one_or_none()

        # Define plan limits
        plan_limits = {
            "free": (10, 100),
            "pro": (-1, 1000),  # -1 = unlimited prompts
            "enterprise": (-1, -1),  # unlimited all
        }

        if subscription and subscription.plan != "free":
            # Check if subscription is still active
            if subscription.is_active:
                return plan_limits.get(subscription.plan, plan_limits["free"])
            # If subscription expired, fall through to free limits

        # Check if user has custom limits set
        user_limits = await self.get_or_create_user_limits(user_id)
        global_limits = await self.get_global_limits()

        # If user has custom limits set (different from defaults), use them
        if (user_limits.max_prompts != global_limits.default_max_prompts or
                user_limits.max_api_requests_per_month != global_limits.default_max_api_requests_per_month):
            return user_limits.max_prompts, user_limits.max_api_requests_per_month

        # Otherwise use global limits (configurable via admin panel)
        return global_limits.default_max_prompts, global_limits.default_max_api_requests_per_month

    async def check_prompt_limit(self, user_id: UUID) -> Tuple[bool, int, int]:
        """
        Check if user can create more prompts
        Returns: (can_create, current_count, max_allowed)
        """
        # Check if user is superuser
        user_result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()

        if user and user.is_superuser:
            return True, 0, -1  # -1 indicates unlimited

        # Get current prompt count
        prompt_count_result = await self.session.execute(
            select(func.count(Prompt.id)).where(Prompt.created_by == user_id)
        )
        current_count = prompt_count_result.scalar() or 0

        # Get limits
        max_prompts, _ = await self.get_effective_limits(user_id)

        can_create = current_count < max_prompts
        return can_create, current_count, max_prompts

    async def check_api_limit(self, user_id: UUID) -> Tuple[bool, int, int, datetime]:
        """
        Check if user can make API requests
        Returns: (can_request, current_count, max_allowed, reset_time)
        """
        # Check if user is superuser
        user_result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()

        if user and user.is_superuser:
            reset_time = UserAPIUsage.get_next_reset_time()
            return True, 0, -1, reset_time  # -1 indicates unlimited

        # Get current month's usage
        current_month = UserAPIUsage.get_current_month_start()
        usage_result = await self.session.execute(
            select(UserAPIUsage).where(
                and_(
                    UserAPIUsage.user_id == user_id,
                    UserAPIUsage.date == current_month
                )
            )
        )
        usage = usage_result.scalar_one_or_none()

        current_count = usage.api_requests_count if usage else 0

        # Get limits
        _, max_api_requests = await self.get_effective_limits(user_id)

        # Calculate reset time (start of next month in UTC)
        reset_time = UserAPIUsage.get_next_reset_time()

        can_request = current_count < max_api_requests
        return can_request, current_count, max_api_requests, reset_time

    async def increment_api_usage(self, user_id: UUID) -> int:
        """
        Increment API usage for current month
        Returns: new count
        """
        current_month = UserAPIUsage.get_current_month_start()

        # Try to get existing usage record
        usage_result = await self.session.execute(
            select(UserAPIUsage).where(
                and_(
                    UserAPIUsage.user_id == user_id,
                    UserAPIUsage.date == current_month
                )
            )
        )
        usage = usage_result.scalar_one_or_none()

        if usage:
            # Increment existing record
            usage.api_requests_count += 1
            new_count = usage.api_requests_count
        else:
            # Create new record for current month
            usage = UserAPIUsage(
                user_id=user_id,
                date=current_month,
                api_requests_count=1
            )
            self.session.add(usage)
            new_count = 1

        await self.session.flush()
        return new_count

    async def update_user_limits(self, user_id: UUID, max_prompts: Optional[int] = None,
                                 max_api_requests: Optional[int] = None) -> UserLimits:
        """Update user-specific limits"""
        user_limits = await self.get_or_create_user_limits(user_id)

        if max_prompts is not None:
            user_limits.max_prompts = max_prompts
        if max_api_requests is not None:
            user_limits.max_api_requests_per_month = max_api_requests

        await self.session.flush()
        return user_limits

    async def update_global_limits(self, max_prompts: Optional[int] = None,
                                   max_api_requests: Optional[int] = None) -> GlobalLimits:
        """Update global default limits"""
        global_limits = await self.get_global_limits()

        if max_prompts is not None:
            global_limits.default_max_prompts = max_prompts
        if max_api_requests is not None:
            global_limits.default_max_api_requests_per_month = max_api_requests

        await self.session.flush()
        return global_limits

    async def get_user_usage_stats(self, user_id: UUID) -> dict:
        """Get comprehensive usage stats for user"""
        # Check if superuser
        user_result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        is_superuser = user.is_superuser if user else False

        if is_superuser:
            # For superusers, return unlimited stats
            prompt_count_result = await self.session.execute(
                select(func.count(Prompt.id)).where(Prompt.created_by == user_id)
            )
            current_prompts = prompt_count_result.scalar() or 0

            return {
                "is_superuser": True,
                "prompts": {
                    "current": current_prompts,
                    "max": -1,  # unlimited
                    "can_create": True
                },
                "api_requests": {
                    "current": 0,
                    "max": -1,  # unlimited
                    "can_request": True,
                    "reset_time": UserAPIUsage.get_next_reset_time().isoformat()
                }
            }

        # Get prompt stats
        can_create_prompt, current_prompts, max_prompts = await self.check_prompt_limit(user_id)

        # Get API stats
        can_request_api, current_api, max_api, reset_time = await self.check_api_limit(user_id)

        return {
            "is_superuser": False,
            "prompts": {
                "current": current_prompts,
                "max": max_prompts,
                "can_create": can_create_prompt
            },
            "api_requests": {
                "current": current_api,
                "max": max_api,
                "can_request": can_request_api,
                "reset_time": reset_time.isoformat()
            }
        }
