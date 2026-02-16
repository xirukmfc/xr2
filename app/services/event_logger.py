"""
Event Logger Service for tracking system_docs events for monitoring dashboard.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_event import SystemEvent

logger = logging.getLogger(__name__)


class EventLogger:
    """Service for logging system_docs events to the database."""

    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_type: str,
        resource_type: str,
        action: str,
        resource_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        workspace_id: Optional[UUID] = None,
        status: str = "success",
        source_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> SystemEvent:
        """
        Log a system_docs event.

        Args:
            db: Database session
            event_type: Type of event (e.g., 'user_registered', 'prompt_created')
            resource_type: Type of resource (e.g., 'user', 'prompt', 'api_key')
            action: Action performed (e.g., 'create', 'start', 'complete')
            resource_id: ID of the resource
            user_id: ID of the user who performed the action
            workspace_id: ID of the workspace
            status: 'success' or 'failure'
            source_name: For API requests, the source name
            metadata: Additional event data
            error_message: Error message if status is 'failure'

        Returns:
            Created SystemEvent instance
        """
        try:
            event = SystemEvent(
                event_type=event_type,
                resource_type=resource_type,
                action=action,
                resource_id=resource_id,
                user_id=user_id,
                workspace_id=workspace_id,
                status=status,
                source_name=source_name,
                event_data=metadata,
                error_message=error_message,
                created_at=datetime.utcnow(),
            )
            db.add(event)
            # Don't commit here - let the caller handle the transaction
            await db.flush()
            logger.debug(f"Logged event: {event_type}/{action} for {resource_type}")
            return event
        except Exception as e:
            logger.error(f"Failed to log event {event_type}: {e}")
            # Don't raise - logging should not break the main flow
            return None

    @staticmethod
    async def log_user_registered(
        db: AsyncSession,
        user_id: UUID,
        workspace_id: UUID,
        email: str,
        username: str,
        method: str = "email",
    ) -> SystemEvent:
        """Log user registration event."""
        return await EventLogger.log_event(
            db=db,
            event_type="user_registered",
            resource_type="user",
            action="create",
            resource_id=user_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "email": email,
                "username": username,
                "method": method,
            },
        )

    @staticmethod
    async def log_prompt_created(
        db: AsyncSession,
        prompt_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        prompt_name: str,
        prompt_slug: str,
    ) -> SystemEvent:
        """Log prompt creation event."""
        return await EventLogger.log_event(
            db=db,
            event_type="prompt_created",
            resource_type="prompt",
            action="create",
            resource_id=prompt_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "prompt_name": prompt_name,
                "prompt_slug": prompt_slug,
            },
        )

    @staticmethod
    async def log_prompt_version_created(
        db: AsyncSession,
        version_id: UUID,
        prompt_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        version_number: int,
    ) -> SystemEvent:
        """Log prompt version creation event."""
        return await EventLogger.log_event(
            db=db,
            event_type="prompt_version_created",
            resource_type="prompt_version",
            action="create",
            resource_id=version_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "prompt_id": str(prompt_id),
                "version_number": version_number,
            },
        )

    @staticmethod
    async def log_api_key_created(
        db: AsyncSession,
        api_key_id: UUID,
        user_id: UUID,
        key_name: str,
    ) -> SystemEvent:
        """Log API key creation event."""
        return await EventLogger.log_event(
            db=db,
            event_type="api_key_created",
            resource_type="api_key",
            action="create",
            resource_id=api_key_id,
            user_id=user_id,
            metadata={
                "key_name": key_name,
            },
        )

    @staticmethod
    async def log_test_with_ai(
        db: AsyncSession,
        user_id: UUID,
        workspace_id: UUID,
        provider: str,
        model: str,
        prompt_length: int,
        response_length: int,
        latency_ms: int,
        cost_usd: float = None,
        status: str = "success",
        error_message: str = None,
    ) -> SystemEvent:
        """Log Test with AI event."""
        return await EventLogger.log_event(
            db=db,
            event_type="test_with_ai",
            resource_type="test_run",
            action="execute",
            user_id=user_id,
            workspace_id=workspace_id,
            status=status,
            error_message=error_message,
            metadata={
                "provider": provider,
                "model": model,
                "prompt_length": prompt_length,
                "response_length": response_length,
                "latency_ms": latency_ms,
                "cost_usd": cost_usd,
            },
        )

    @staticmethod
    async def log_event_definition_created(
        db: AsyncSession,
        event_def_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        event_name: str,
    ) -> SystemEvent:
        """Log event definition creation."""
        return await EventLogger.log_event(
            db=db,
            event_type="event_definition_created",
            resource_type="event_definition",
            action="create",
            resource_id=event_def_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "event_name": event_name,
            },
        )

    @staticmethod
    async def log_funnel_created(
        db: AsyncSession,
        funnel_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        funnel_name: str,
        funnel_type: str,  # 'custom' or 'conversion'
    ) -> SystemEvent:
        """Log funnel creation event."""
        return await EventLogger.log_event(
            db=db,
            event_type="funnel_created",
            resource_type="funnel",
            action="create",
            resource_id=funnel_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "funnel_name": funnel_name,
                "funnel_type": funnel_type,
            },
        )

    @staticmethod
    async def log_ab_test_created(
        db: AsyncSession,
        ab_test_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        test_name: str,
        prompt_id: UUID,
        total_requests: int,
    ) -> SystemEvent:
        """Log A/B test creation event."""
        return await EventLogger.log_event(
            db=db,
            event_type="ab_test_created",
            resource_type="ab_test",
            action="create",
            resource_id=ab_test_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "test_name": test_name,
                "prompt_id": str(prompt_id),
                "total_requests": total_requests,
            },
        )

    @staticmethod
    async def log_ab_test_started(
        db: AsyncSession,
        ab_test_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        test_name: str,
    ) -> SystemEvent:
        """Log A/B test start event."""
        return await EventLogger.log_event(
            db=db,
            event_type="ab_test_started",
            resource_type="ab_test",
            action="start",
            resource_id=ab_test_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "test_name": test_name,
            },
        )

    @staticmethod
    async def log_ab_test_completed(
        db: AsyncSession,
        ab_test_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        test_name: str,
        winner: str = None,
    ) -> SystemEvent:
        """Log A/B test completion event."""
        return await EventLogger.log_event(
            db=db,
            event_type="ab_test_completed",
            resource_type="ab_test",
            action="complete",
            resource_id=ab_test_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "test_name": test_name,
                "winner": winner,
            },
        )

    @staticmethod
    async def log_api_request(
        db: AsyncSession,
        endpoint: str,
        user_id: UUID,
        workspace_id: UUID,
        source_name: str,
        prompt_id: UUID = None,
        latency_ms: int = None,
        status: str = "success",
        error_message: str = None,
    ) -> SystemEvent:
        """Log API request event with source breakdown."""
        return await EventLogger.log_event(
            db=db,
            event_type="api_request",
            resource_type="api",
            action="request",
            resource_id=prompt_id,
            user_id=user_id,
            workspace_id=workspace_id,
            source_name=source_name,
            status=status,
            error_message=error_message,
            metadata={
                "endpoint": endpoint,
                "latency_ms": latency_ms,
            },
        )

    @staticmethod
    async def log_prompt_published(
        db: AsyncSession,
        prompt_id: UUID,
        version_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        prompt_name: str,
        version_number: int,
    ) -> SystemEvent:
        """Log prompt publication (deploy) event."""
        return await EventLogger.log_event(
            db=db,
            event_type="prompt_published",
            resource_type="prompt",
            action="publish",
            resource_id=prompt_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "prompt_name": prompt_name,
                "version_id": str(version_id),
                "version_number": version_number,
            },
        )

    @staticmethod
    async def log_prompt_unpublished(
        db: AsyncSession,
        prompt_id: UUID,
        version_id: UUID,
        user_id: UUID,
        workspace_id: UUID,
        prompt_name: str,
        version_number: int,
    ) -> SystemEvent:
        """Log prompt unpublication (undeploy) event."""
        return await EventLogger.log_event(
            db=db,
            event_type="prompt_unpublished",
            resource_type="prompt",
            action="unpublish",
            resource_id=prompt_id,
            user_id=user_id,
            workspace_id=workspace_id,
            metadata={
                "prompt_name": prompt_name,
                "version_id": str(version_id),
                "version_number": version_number,
            },
        )

    @staticmethod
    async def log_user_limits_updated(
        db: AsyncSession,
        user_id: UUID,
        limit_type: str,  # 'prompts' or 'api_requests'
        old_value: int,
        new_value: int,
        updated_by: UUID = None,
    ) -> SystemEvent:
        """Log user limits update event."""
        return await EventLogger.log_event(
            db=db,
            event_type="user_limits_updated",
            resource_type="user_limits",
            action="update",
            resource_id=user_id,
            user_id=updated_by or user_id,
            metadata={
                "limit_type": limit_type,
                "old_value": old_value,
                "new_value": new_value,
            },
        )

    # ==================== Subscription Events ====================

    @staticmethod
    async def log_subscription_created(
        db: AsyncSession,
        subscription_id: UUID,
        user_id: UUID,
        plan: str,
        amount: int,
        currency: str,
        payment_provider: str,
    ) -> SystemEvent:
        """Log new subscription creation event."""
        return await EventLogger.log_event(
            db=db,
            event_type="subscription_created",
            resource_type="subscription",
            action="create",
            resource_id=subscription_id,
            user_id=user_id,
            metadata={
                "plan": plan,
                "amount": amount,
                "currency": currency,
                "payment_provider": payment_provider,
                "amount_display": f"${amount/100:.2f}" if currency == "USD" else f"{amount//100}₽",
            },
        )

    @staticmethod
    async def log_subscription_renewed(
        db: AsyncSession,
        subscription_id: UUID,
        user_id: UUID,
        plan: str,
        amount: int,
        currency: str,
        payment_provider: str,
    ) -> SystemEvent:
        """Log subscription renewal event."""
        return await EventLogger.log_event(
            db=db,
            event_type="subscription_renewed",
            resource_type="subscription",
            action="renew",
            resource_id=subscription_id,
            user_id=user_id,
            metadata={
                "plan": plan,
                "amount": amount,
                "currency": currency,
                "payment_provider": payment_provider,
                "amount_display": f"${amount/100:.2f}" if currency == "USD" else f"{amount//100}₽",
            },
        )

    @staticmethod
    async def log_subscription_cancelled(
        db: AsyncSession,
        subscription_id: UUID,
        user_id: UUID,
        plan: str,
        payment_provider: str = None,
    ) -> SystemEvent:
        """Log subscription cancellation event."""
        return await EventLogger.log_event(
            db=db,
            event_type="subscription_cancelled",
            resource_type="subscription",
            action="cancel",
            resource_id=subscription_id,
            user_id=user_id,
            metadata={
                "plan": plan,
                "payment_provider": payment_provider,
            },
        )


# Singleton instance for convenience
event_logger = EventLogger()
