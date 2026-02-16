
"""Service for handling user subscriptions and payments"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any, List
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.subscription import UserSubscription, SubscriptionTransaction
from app.models.pricing import PricingConfig
from app.services.yookassa import yookassa_service
from app.services.lemonsqueezy import lemonsqueezy_service
from app.services.event_logger import EventLogger
from app.core.config import settings

logger = logging.getLogger(__name__)


# Plan limits configuration
PLAN_LIMITS = {
    "free": {
        "max_prompts": 10,
        "max_api_requests_per_month": 100,
    },
    "pro": {
        "max_prompts": -1,  # Unlimited
        "max_api_requests_per_month": 1000,
    },
    "enterprise": {
        "max_prompts": -1,  # Unlimited
        "max_api_requests_per_month": -1,  # Unlimited
    },
}


class SubscriptionService:
    """Service for managing user subscriptions"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_subscription(self, user_id: UUID) -> UserSubscription:
        """Get existing subscription or create a new free one"""
        result = await self.session.execute(
            select(UserSubscription).where(UserSubscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            return subscription

        # Create new free subscription
        subscription = UserSubscription(
            user_id=user_id,
            plan="free",
            status="active",
            auto_renew=True,
            currency="USD",
        )

        self.session.add(subscription)
        try:
            await self.session.flush()
        except Exception:
            await self.session.rollback()
            result = await self.session.execute(
                select(UserSubscription).where(UserSubscription.user_id == user_id)
            )
            existing = result.scalar_one_or_none()
            if existing:
                return existing
            raise

        return subscription

    async def get_current_subscription(self, user_id: UUID) -> Dict[str, Any]:
        """Get current subscription with computed properties and limits"""
        subscription = await self.get_or_create_subscription(user_id)

        # Get user to check superuser status
        user_result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        is_superuser = user.is_superuser if user else False

        # Get plan limits
        if is_superuser:
            limits = {
                "max_prompts": -1,
                "max_api_requests_per_month": -1,
            }
        else:
            limits = PLAN_LIMITS.get(subscription.plan, PLAN_LIMITS["free"])

        return {
            "id": str(subscription.id),
            "plan": subscription.plan,
            "status": subscription.status,
            "period_start": subscription.period_start.isoformat() if subscription.period_start else None,
            "period_end": subscription.period_end.isoformat() if subscription.period_end else None,
            "days_remaining": subscription.days_remaining,
            "auto_renew": subscription.auto_renew,
            "currency": subscription.currency,
            "cancelled_at": subscription.cancelled_at.isoformat() if subscription.cancelled_at else None,
            "is_active": subscription.is_active,
            "limits": limits,
            "is_superuser": is_superuser,
            "payment_provider": subscription.payment_provider,
        }

    async def get_plan_limits(self, user_id: UUID) -> Tuple[int, int]:
        """Get effective limits based on subscription plan
        Returns: (max_prompts, max_api_requests_per_month)
        """
        # Check if user is superuser first
        user_result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()

        if user and user.is_superuser:
            return -1, -1  # Unlimited for superusers

        subscription = await self.get_or_create_subscription(user_id)
        limits = PLAN_LIMITS.get(subscription.plan, PLAN_LIMITS["free"])

        # Check if subscription is active for paid plans
        if subscription.plan != "free" and not subscription.is_active:
            # Revert to free limits if subscription expired
            limits = PLAN_LIMITS["free"]

        return limits["max_prompts"], limits["max_api_requests_per_month"]

    async def upgrade_to_pro(self, user_id: UUID, locale: str = "en") -> Dict[str, Any]:
        """Initiate upgrade to Pro plan
        Creates a pending transaction for manual payment
        Also used for extending/resuming existing subscriptions
        """
        subscription = await self.get_or_create_subscription(user_id)

        # No blocking check - allow upgrades, extensions, and resumptions

        # Get pricing from database
        pricing_result = await self.session.execute(
            select(PricingConfig).where(
                and_(
                    PricingConfig.plan_name == "pro",
                    PricingConfig.is_active == True
                )
            )
        )
        pricing = pricing_result.scalar_one_or_none()

        if not pricing:
            # Fallback to hardcoded values
            amount = 1900 if locale == "en" else 150000  # $19 or 1500 RUB
            currency = "USD" if locale == "en" else "RUB"
        else:
            amount = pricing.price_usd if locale == "en" else pricing.price_rub
            currency = "USD" if locale == "en" else "RUB"

        # Calculate period
        now = datetime.now(timezone.utc)
        period_end = now + timedelta(days=30)

        # Update subscription to pending
        subscription.currency = currency
        subscription.status = "pending"

        # Create pending transaction
        transaction = SubscriptionTransaction(
            subscription_id=subscription.id,
            amount=amount,
            currency=currency,
            status="pending",
            transaction_type="subscription" if subscription.plan == "free" else "renewal",
            period_start=now,
            period_end=period_end,
            payment_method="manual",
        )

        self.session.add(transaction)
        await self.session.flush()

        return {
            "transaction_id": str(transaction.id),
            "amount": amount,
            "currency": currency,
            "amount_display": transaction.amount_display,
            "status": "pending",
            "message": "Payment pending. Please complete the payment to activate your subscription.",
        }

    async def cancel_subscription(self, user_id: UUID) -> Dict[str, Any]:
        """Cancel subscription (disable auto-renew)
        Subscription remains active until period_end
        """
        subscription = await self.get_or_create_subscription(user_id)

        if subscription.plan == "free":
            raise ValueError("Cannot cancel free plan")

        # If subscription is managed by LemonSqueezy, cancel there too
        logger.info(f"Cancel subscription check: external_id={subscription.external_subscription_id}, ls_configured={lemonsqueezy_service.is_configured}")
        if subscription.external_subscription_id and lemonsqueezy_service.is_configured:
            try:
                logger.info(f"Calling LemonSqueezy cancel API for: {subscription.external_subscription_id}")
                result = await lemonsqueezy_service.cancel_subscription(subscription.external_subscription_id)
                logger.info(f"LemonSqueezy cancel result: {result}")
            except Exception as e:
                logger.error(f"Failed to cancel LemonSqueezy subscription: {e}")
                raise ValueError(f"Failed to cancel subscription: {str(e)}")

        subscription.auto_renew = False
        subscription.cancelled_at = datetime.now(timezone.utc)
        subscription.status = "cancelled"

        await self.session.flush()

        # Log cancellation event for metrics
        await EventLogger.log_subscription_cancelled(
            db=self.session,
            subscription_id=subscription.id,
            user_id=user_id,
            plan=subscription.plan,
            payment_provider=subscription.payment_provider,
        )

        return {
            "success": True,
            "message": "Subscription cancelled. You will retain access until the end of your billing period.",
            "period_end": subscription.period_end.isoformat() if subscription.period_end else None,
        }

    async def resume_subscription(self, user_id: UUID) -> Dict[str, Any]:
        """Resume cancelled subscription (re-enable auto-renew)"""
        subscription = await self.get_or_create_subscription(user_id)

        if subscription.plan == "free":
            raise ValueError("Cannot resume free plan")

        if subscription.status != "cancelled":
            raise ValueError("Subscription is not cancelled")

        # Check if subscription period has expired
        if subscription.period_end and subscription.period_end < datetime.now(timezone.utc):
            # Return requires_payment instead of error - let frontend handle the upgrade flow
            return {
                "success": False,
                "requires_payment": True,
                "message": "Subscription period has expired. Please subscribe again.",
                "payment_provider": subscription.payment_provider,
                "period_end": subscription.period_end.isoformat() if subscription.period_end else None,
            }

        # If subscription is managed by LemonSqueezy, resume there too
        if subscription.external_subscription_id and lemonsqueezy_service.is_configured:
            try:
                await lemonsqueezy_service.resume_subscription(subscription.external_subscription_id)
                logger.info(f"Resumed LemonSqueezy subscription: {subscription.external_subscription_id}")
            except Exception as e:
                logger.error(f"Failed to resume LemonSqueezy subscription: {e}")
                raise ValueError(f"Failed to resume subscription: {str(e)}")

        subscription.auto_renew = True
        subscription.cancelled_at = None
        subscription.status = "active"

        await self.session.flush()

        return {
            "success": True,
            "message": "Subscription resumed successfully.",
            "period_end": subscription.period_end.isoformat() if subscription.period_end else None,
        }

    async def complete_transaction(self, transaction_id: UUID, payment_method: Optional[str] = None, external_id: Optional[str] = None) -> Dict[str, Any]:
        """Complete a pending transaction (admin/webhook action)
        Activates the subscription
        """
        result = await self.session.execute(
            select(SubscriptionTransaction)
            .options(selectinload(SubscriptionTransaction.subscription))
            .where(SubscriptionTransaction.id == transaction_id)
        )
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise ValueError("Transaction not found")

        if transaction.status != "pending":
            raise ValueError(f"Transaction is not pending. Current status: {transaction.status}")

        # Update transaction
        transaction.status = "completed"
        transaction.completed_at = datetime.now(timezone.utc)
        if payment_method:
            transaction.payment_method = payment_method
        if external_id:
            transaction.external_id = external_id

        # Update subscription
        subscription = transaction.subscription
        subscription.plan = "pro"
        subscription.status = "active"
        subscription.period_start = transaction.period_start
        subscription.period_end = transaction.period_end
        subscription.auto_renew = True
        subscription.cancelled_at = None

        await self.session.flush()

        return {
            "success": True,
            "message": "Transaction completed. Subscription activated.",
            "subscription": {
                "plan": subscription.plan,
                "status": subscription.status,
                "period_end": subscription.period_end.isoformat() if subscription.period_end else None,
            },
        }

    async def get_transactions(self, user_id: UUID, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get transaction history for user (only completed/refunded transactions)"""
        subscription = await self.get_or_create_subscription(user_id)

        result = await self.session.execute(
            select(SubscriptionTransaction)
            .where(SubscriptionTransaction.subscription_id == subscription.id)
            .where(SubscriptionTransaction.status.in_(["completed", "refunded"]))
            .order_by(SubscriptionTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        transactions = result.scalars().all()

        return [
            {
                "id": str(tx.id),
                "amount": tx.amount,
                "currency": tx.currency,
                "amount_display": tx.amount_display,
                "status": tx.status,
                "transaction_type": tx.transaction_type,
                "period_start": tx.period_start.isoformat() if tx.period_start else None,
                "period_end": tx.period_end.isoformat() if tx.period_end else None,
                "payment_method": tx.payment_method,
                "created_at": tx.created_at.isoformat() if tx.created_at else None,
                "completed_at": tx.completed_at.isoformat() if tx.completed_at else None,
            }
            for tx in transactions
        ]

    async def check_and_expire_subscriptions(self) -> int:
        """Check for expired subscriptions and update their status
        Called by cron job
        Returns: number of expired subscriptions
        """
        now = datetime.now(timezone.utc)

        result = await self.session.execute(
            select(UserSubscription).where(
                and_(
                    UserSubscription.plan != "free",
                    UserSubscription.status == "active",
                    UserSubscription.period_end < now,
                )
            )
        )
        expired_subscriptions = result.scalars().all()

        for subscription in expired_subscriptions:
            if subscription.auto_renew:
                # Mark for renewal (create pending transaction)
                subscription.status = "pending"
            else:
                # Expire the subscription
                subscription.status = "expired"
                subscription.plan = "free"

        await self.session.flush()
        return len(expired_subscriptions)

    async def initiate_yookassa_payment(self, user_id: UUID, locale: str = "ru") -> Dict[str, Any]:
        """
        Initiate a payment via YooKassa for Pro subscription
        Creates a pending transaction and returns redirect URL
        Also used for extending/resuming existing subscriptions
        """
        if not yookassa_service.is_configured:
            raise ValueError("YooKassa is not configured")

        subscription = await self.get_or_create_subscription(user_id)

        # No blocking check - allow:
        # - Free users upgrading to Pro
        # - Cancelled subscriptions resuming with new card
        # - Active Pro subscriptions extending their period (adds 30 days)

        # Get pricing from database
        pricing_result = await self.session.execute(
            select(PricingConfig).where(
                and_(
                    PricingConfig.plan_name == "pro",
                    PricingConfig.is_active == True
                )
            )
        )
        pricing = pricing_result.scalar_one_or_none()

        if not pricing:
            amount = 150000  # 1500 RUB in kopecks
        else:
            amount = pricing.price_rub

        currency = "RUB"

        # Calculate period
        now = datetime.now(timezone.utc)

        # For existing subscriptions with remaining time, extend from period_end
        # This applies to both active and cancelled subscriptions
        if subscription.period_end and subscription.period_end > now:
            period_start = subscription.period_end
            period_end = subscription.period_end + timedelta(days=30)
        else:
            period_start = now
            period_end = now + timedelta(days=30)

        # Update subscription
        subscription.currency = currency
        # Only set to pending for free plan upgrades
        # For active/cancelled Pro subscriptions, keep current status until payment succeeds
        if subscription.plan == "free":
            subscription.status = "pending"

        # Create pending transaction
        transaction = SubscriptionTransaction(
            subscription_id=subscription.id,
            amount=amount,
            currency=currency,
            status="pending",
            transaction_type="subscription" if subscription.plan == "free" else "renewal",
            period_start=period_start,
            period_end=period_end,
            payment_method="yookassa",
        )

        self.session.add(transaction)
        await self.session.flush()

        # Create payment in YooKassa
        description = "Pro подписка xR2 (30 дней)"
        return_url = f"{settings.YOOKASSA_RETURN_URL}?payment=pending&transaction_id={transaction.id}"

        try:
            payment = await yookassa_service.create_payment(
                amount=amount,
                currency=currency,
                description=description,
                return_url=return_url,
                save_payment_method=True,
                metadata={
                    "transaction_id": str(transaction.id),
                    "user_id": str(user_id),
                    "subscription_id": str(subscription.id),
                }
            )

            # Store YooKassa payment ID in transaction
            transaction.external_id = payment["id"]
            await self.session.flush()

            # Get redirect URL from confirmation
            redirect_url = payment.get("confirmation", {}).get("confirmation_url")

            if not redirect_url:
                raise ValueError("No confirmation URL in YooKassa response")

            return {
                "transaction_id": str(transaction.id),
                "redirect_url": redirect_url,
                "amount": amount,
                "currency": currency,
                "amount_display": f"{amount // 100}₽",
            }

        except Exception as e:
            # Mark transaction as failed
            transaction.status = "failed"
            subscription.status = "active" if subscription.plan != "free" else "active"
            await self.session.flush()
            logger.error(f"YooKassa payment creation failed: {e}")
            raise ValueError(f"Failed to create payment: {str(e)}")

    async def process_yookassa_webhook(
        self,
        event_type: str,
        payment_data: Dict[str, Any],
        webhook_id: str
    ) -> Dict[str, Any]:
        """
        Process YooKassa webhook notification

        Args:
            event_type: Webhook event type (payment.succeeded, payment.canceled, etc.)
            payment_data: Payment object from webhook
            webhook_id: Unique webhook notification ID for idempotency

        Returns:
            Processing result
        """
        # Check for duplicate webhook (idempotency)
        existing = await self.session.execute(
            select(SubscriptionTransaction).where(
                SubscriptionTransaction.webhook_id == webhook_id
            )
        )
        if existing.scalar_one_or_none():
            logger.info(f"Duplicate webhook ignored: {webhook_id}")
            return {"status": "duplicate", "message": "Webhook already processed"}

        # Get transaction by external_id (YooKassa payment ID)
        payment_id = payment_data.get("id")
        metadata = payment_data.get("metadata", {})
        transaction_id = metadata.get("transaction_id")

        if not transaction_id:
            logger.error(f"No transaction_id in webhook metadata: {payment_id}")
            return {"status": "error", "message": "No transaction_id in metadata"}

        result = await self.session.execute(
            select(SubscriptionTransaction)
            .options(selectinload(SubscriptionTransaction.subscription))
            .where(SubscriptionTransaction.id == transaction_id)
        )
        transaction = result.scalar_one_or_none()

        if not transaction:
            logger.error(f"Transaction not found: {transaction_id}")
            return {"status": "error", "message": "Transaction not found"}

        # Store webhook_id for idempotency
        transaction.webhook_id = webhook_id

        if event_type == "payment.succeeded":
            # Payment successful
            transaction.status = "completed"
            transaction.completed_at = datetime.now(timezone.utc)
            transaction.external_id = payment_id

            subscription = transaction.subscription

            # Save payment method for recurring payments
            payment_method = payment_data.get("payment_method", {})
            if payment_method.get("saved") and payment_method.get("id"):
                subscription.payment_method_id = payment_method["id"]

            # Activate subscription
            subscription.plan = "pro"
            subscription.status = "active"
            subscription.period_start = transaction.period_start
            subscription.period_end = transaction.period_end
            subscription.auto_renew = True
            subscription.cancelled_at = None
            subscription.payment_provider = "yookassa"  # Lock provider on first payment

            await self.session.flush()

            # Log subscription event for metrics
            if transaction.transaction_type == "subscription":
                await EventLogger.log_subscription_created(
                    db=self.session,
                    subscription_id=subscription.id,
                    user_id=subscription.user_id,
                    plan="pro",
                    amount=transaction.amount,
                    currency=transaction.currency,
                    payment_provider="yookassa",
                )
            else:
                await EventLogger.log_subscription_renewed(
                    db=self.session,
                    subscription_id=subscription.id,
                    user_id=subscription.user_id,
                    plan="pro",
                    amount=transaction.amount,
                    currency=transaction.currency,
                    payment_provider="yookassa",
                )

            logger.info(f"Payment succeeded for subscription {subscription.id}")
            return {
                "status": "success",
                "message": "Subscription activated",
                "subscription_id": str(subscription.id),
            }

        elif event_type == "payment.canceled":
            # Payment canceled
            transaction.status = "failed"

            subscription = transaction.subscription
            # Revert to previous state if needed
            if subscription.status == "pending":
                subscription.status = "active" if subscription.plan != "free" else "active"

            await self.session.flush()

            logger.info(f"Payment canceled for transaction {transaction.id}")
            return {"status": "canceled", "message": "Payment was canceled"}

        elif event_type == "refund.succeeded":
            # Refund successful
            transaction.status = "refunded"
            await self.session.flush()

            logger.info(f"Refund succeeded for transaction {transaction.id}")
            return {"status": "refunded", "message": "Refund processed"}

        else:
            logger.warning(f"Unhandled webhook event type: {event_type}")
            return {"status": "ignored", "message": f"Event type {event_type} not handled"}

    async def process_auto_renewals(self) -> int:
        """
        Process auto-renewals for expiring subscriptions

        Finds subscriptions that:
        - Are pro plan and active
        - Have auto_renew enabled
        - Have a saved payment_method_id
        - Period ends within next 24 hours

        Returns: number of renewals processed
        """
        if not yookassa_service.is_configured:
            logger.warning("YooKassa not configured, skipping auto-renewals")
            return 0

        now = datetime.now(timezone.utc)
        tomorrow = now + timedelta(days=1)

        # Find subscriptions expiring soon with saved payment method
        result = await self.session.execute(
            select(UserSubscription).where(
                and_(
                    UserSubscription.plan == "pro",
                    UserSubscription.status == "active",
                    UserSubscription.auto_renew == True,
                    UserSubscription.payment_method_id.isnot(None),
                    UserSubscription.period_end <= tomorrow,
                    UserSubscription.period_end >= now,
                )
            )
        )
        subscriptions = result.scalars().all()

        if not subscriptions:
            return 0

        # Get pricing
        pricing_result = await self.session.execute(
            select(PricingConfig).where(
                and_(
                    PricingConfig.plan_name == "pro",
                    PricingConfig.is_active == True
                )
            )
        )
        pricing = pricing_result.scalar_one_or_none()
        amount = pricing.price_rub if pricing else 150000  # 1500 RUB

        renewals_processed = 0

        for subscription in subscriptions:
            try:
                # Calculate new period
                new_period_start = subscription.period_end
                new_period_end = new_period_start + timedelta(days=30)

                # Create renewal transaction
                transaction = SubscriptionTransaction(
                    subscription_id=subscription.id,
                    amount=amount,
                    currency="RUB",
                    status="pending",
                    transaction_type="renewal",
                    period_start=new_period_start,
                    period_end=new_period_end,
                    payment_method="yookassa",
                )
                self.session.add(transaction)
                await self.session.flush()

                # Create autopayment in YooKassa
                description = "Продление Pro подписки xR2 (30 дней)"

                payment = await yookassa_service.create_autopayment(
                    payment_method_id=subscription.payment_method_id,
                    amount=amount,
                    currency="RUB",
                    description=description,
                    metadata={
                        "transaction_id": str(transaction.id),
                        "subscription_id": str(subscription.id),
                        "renewal": "true",
                    }
                )

                transaction.external_id = payment["id"]

                # Check if payment succeeded immediately (synchronous capture)
                if payment.get("status") == "succeeded":
                    transaction.status = "completed"
                    transaction.completed_at = datetime.now(timezone.utc)
                    subscription.period_end = new_period_end

                    # Update payment method if changed
                    payment_method = payment.get("payment_method", {})
                    if payment_method.get("id"):
                        subscription.payment_method_id = payment_method["id"]

                await self.session.flush()
                renewals_processed += 1

                logger.info(f"Auto-renewal initiated for subscription {subscription.id}")

            except Exception as e:
                logger.error(f"Auto-renewal failed for subscription {subscription.id}: {e}")
                # Mark subscription for manual intervention if needed
                continue

        return renewals_processed

    async def initiate_lemonsqueezy_payment(self, user_id: UUID, locale: str = "en") -> Dict[str, Any]:
        """
        Initiate a payment via LemonSqueezy for Pro subscription (USD)
        Creates a checkout session and returns redirect URL
        """
        if not lemonsqueezy_service.is_configured:
            raise ValueError("LemonSqueezy is not configured")

        subscription = await self.get_or_create_subscription(user_id)

        # Get user email for checkout prefill
        user_result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        # Get pricing from database
        pricing_result = await self.session.execute(
            select(PricingConfig).where(
                and_(
                    PricingConfig.plan_name == "pro",
                    PricingConfig.is_active == True
                )
            )
        )
        pricing = pricing_result.scalar_one_or_none()

        # Amount in cents (USD)
        amount = pricing.price_usd if pricing else 1900  # $19.00

        currency = "USD"

        # Calculate period
        now = datetime.now(timezone.utc)

        if subscription.period_end and subscription.period_end > now:
            period_start = subscription.period_end
            period_end = subscription.period_end + timedelta(days=30)
        else:
            period_start = now
            period_end = now + timedelta(days=30)

        # Update subscription currency
        subscription.currency = currency
        if subscription.plan == "free":
            subscription.status = "pending"

        # Create pending transaction
        transaction = SubscriptionTransaction(
            subscription_id=subscription.id,
            amount=amount,
            currency=currency,
            status="pending",
            transaction_type="subscription" if subscription.plan == "free" else "renewal",
            period_start=period_start,
            period_end=period_end,
            payment_method="lemonsqueezy",
        )

        self.session.add(transaction)
        await self.session.flush()

        # Create checkout in LemonSqueezy
        try:
            checkout = await lemonsqueezy_service.create_checkout(
                user_email=user.email,
                user_name=user.full_name,
                custom_data={
                    "transaction_id": str(transaction.id),
                    "user_id": str(user_id),
                    "subscription_id": str(subscription.id),
                }
            )

            # Extract checkout URL
            checkout_url = checkout.get("data", {}).get("attributes", {}).get("url")

            if not checkout_url:
                raise ValueError("No checkout URL in LemonSqueezy response")

            # Store LemonSqueezy checkout ID
            checkout_id = checkout.get("data", {}).get("id")
            if checkout_id:
                transaction.external_id = checkout_id

            await self.session.flush()

            return {
                "transaction_id": str(transaction.id),
                "redirect_url": checkout_url,
                "amount": amount,
                "currency": currency,
                "amount_display": f"${amount / 100:.2f}",
            }

        except Exception as e:
            # Mark transaction as failed
            transaction.status = "failed"
            if subscription.plan != "free":
                subscription.status = "active"
            await self.session.flush()
            logger.error(f"LemonSqueezy checkout creation failed: {e}")
            raise ValueError(f"Failed to create checkout: {str(e)}")

    async def process_lemonsqueezy_webhook(
        self,
        event_name: str,
        event_data: Dict[str, Any],
        custom_data: Dict[str, Any],
        webhook_id: str
    ) -> Dict[str, Any]:
        """
        Process LemonSqueezy webhook notification

        Args:
            event_name: Webhook event name (subscription_created, etc.)
            event_data: Event data object
            custom_data: Custom data passed during checkout
            webhook_id: Unique event ID for idempotency

        Returns:
            Processing result
        """
        # Check for duplicate webhook (idempotency)
        existing = await self.session.execute(
            select(SubscriptionTransaction).where(
                SubscriptionTransaction.webhook_id == webhook_id
            )
        )
        if existing.scalar_one_or_none():
            logger.info(f"Duplicate LemonSqueezy webhook ignored: {webhook_id}")
            return {"status": "duplicate", "message": "Webhook already processed"}

        transaction_id = custom_data.get("transaction_id")
        user_id = custom_data.get("user_id")
        subscription_id_str = custom_data.get("subscription_id")

        # Get transaction if we have transaction_id
        transaction = None
        if transaction_id:
            result = await self.session.execute(
                select(SubscriptionTransaction)
                .options(selectinload(SubscriptionTransaction.subscription))
                .where(SubscriptionTransaction.id == transaction_id)
            )
            transaction = result.scalar_one_or_none()

        # Get subscription
        subscription = None
        if transaction:
            subscription = transaction.subscription
        elif subscription_id_str:
            result = await self.session.execute(
                select(UserSubscription).where(UserSubscription.id == subscription_id_str)
            )
            subscription = result.scalar_one_or_none()
        elif user_id:
            subscription = await self.get_or_create_subscription(UUID(user_id))

        if not subscription:
            logger.error(f"No subscription found for LemonSqueezy webhook: {custom_data}")
            return {"status": "error", "message": "No subscription found"}

        # Extract LemonSqueezy subscription ID
        ls_subscription_id = str(event_data.get("id", ""))
        attributes = event_data.get("attributes", {})

        if event_name == "subscription_created":
            # New subscription created
            if transaction:
                transaction.status = "completed"
                transaction.completed_at = datetime.now(timezone.utc)
                transaction.webhook_id = webhook_id
                transaction.external_id = ls_subscription_id

            # Activate subscription
            subscription.plan = "pro"
            subscription.status = "active"
            subscription.external_subscription_id = ls_subscription_id
            subscription.auto_renew = True
            subscription.cancelled_at = None
            subscription.payment_provider = "lemonsqueezy"  # Lock provider on first payment

            # Set period from LemonSqueezy data
            renews_at = attributes.get("renews_at")
            if renews_at:
                subscription.period_end = datetime.fromisoformat(renews_at.replace("Z", "+00:00"))
            elif transaction:
                subscription.period_end = transaction.period_end

            if transaction:
                subscription.period_start = transaction.period_start
            else:
                subscription.period_start = datetime.now(timezone.utc)

            await self.session.flush()

            # Log subscription event for metrics
            amount = transaction.amount if transaction else 1900  # Default $19
            await EventLogger.log_subscription_created(
                db=self.session,
                subscription_id=subscription.id,
                user_id=subscription.user_id,
                plan="pro",
                amount=amount,
                currency="USD",
                payment_provider="lemonsqueezy",
            )

            logger.info(f"LemonSqueezy subscription created: {subscription.id}")
            return {"status": "success", "message": "Subscription activated"}

        elif event_name == "subscription_updated":
            # Subscription updated (could be renewal, plan change, etc.)
            status = attributes.get("status")

            if status == "active":
                subscription.status = "active"
                subscription.plan = "pro"
                # Update renewal date
                renews_at = attributes.get("renews_at")
                if renews_at:
                    subscription.period_end = datetime.fromisoformat(renews_at.replace("Z", "+00:00"))

            elif status == "cancelled":
                subscription.status = "cancelled"
                subscription.cancelled_at = datetime.now(timezone.utc)
                subscription.auto_renew = False

            elif status in ("expired", "past_due"):
                subscription.status = "expired"
                subscription.plan = "free"
                subscription.auto_renew = False

            await self.session.flush()
            logger.info(f"LemonSqueezy subscription updated: {subscription.id}, status: {status}")
            return {"status": "success", "message": f"Subscription updated to {status}"}

        elif event_name == "subscription_cancelled":
            # Subscription cancelled
            subscription.status = "cancelled"
            subscription.cancelled_at = datetime.now(timezone.utc)
            subscription.auto_renew = False

            await self.session.flush()
            logger.info(f"LemonSqueezy subscription cancelled: {subscription.id}")
            return {"status": "success", "message": "Subscription cancelled"}

        elif event_name == "subscription_resumed":
            # Subscription resumed
            subscription.status = "active"
            subscription.cancelled_at = None
            subscription.auto_renew = True

            await self.session.flush()
            logger.info(f"LemonSqueezy subscription resumed: {subscription.id}")
            return {"status": "success", "message": "Subscription resumed"}

        elif event_name == "subscription_expired":
            # Subscription expired
            subscription.status = "expired"
            subscription.plan = "free"
            subscription.auto_renew = False

            await self.session.flush()
            logger.info(f"LemonSqueezy subscription expired: {subscription.id}")
            return {"status": "success", "message": "Subscription expired"}

        elif event_name == "subscription_payment_success":
            # Check billing_reason to determine if this is initial or renewal
            billing_reason = attributes.get("billing_reason", "renewal")

            if billing_reason == "initial":
                # Initial payment - transaction already created and completed in subscription_created
                # Just update subscription period if needed
                renews_at = attributes.get("renews_at")
                if renews_at:
                    subscription.period_end = datetime.fromisoformat(renews_at.replace("Z", "+00:00"))

                await self.session.flush()
                logger.info(f"LemonSqueezy initial payment confirmed: {subscription.id}")
                return {"status": "success", "message": "Initial payment confirmed"}

            # Renewal payment - create new transaction record
            amount = int(float(attributes.get("total", 1900)))

            renewal_transaction = SubscriptionTransaction(
                subscription_id=subscription.id,
                amount=amount,
                currency="USD",
                status="completed",
                transaction_type="renewal",
                period_start=subscription.period_end or datetime.now(timezone.utc),
                period_end=(subscription.period_end or datetime.now(timezone.utc)) + timedelta(days=30),
                payment_method="lemonsqueezy",
                external_id=ls_subscription_id,
                webhook_id=webhook_id,
                completed_at=datetime.now(timezone.utc),
            )
            self.session.add(renewal_transaction)

            # Update subscription period
            renews_at = attributes.get("renews_at")
            if renews_at:
                subscription.period_end = datetime.fromisoformat(renews_at.replace("Z", "+00:00"))
            else:
                subscription.period_end = (subscription.period_end or datetime.now(timezone.utc)) + timedelta(days=30)

            subscription.status = "active"

            await self.session.flush()

            # Log renewal event for metrics
            await EventLogger.log_subscription_renewed(
                db=self.session,
                subscription_id=subscription.id,
                user_id=subscription.user_id,
                plan="pro",
                amount=amount,
                currency="USD",
                payment_provider="lemonsqueezy",
            )

            logger.info(f"LemonSqueezy renewal payment success: {subscription.id}")
            return {"status": "success", "message": "Renewal payment recorded"}

        elif event_name == "subscription_payment_failed":
            # Payment failed
            if transaction:
                transaction.status = "failed"
                transaction.webhook_id = webhook_id

            logger.warning(f"LemonSqueezy payment failed for subscription: {subscription.id}")
            return {"status": "failed", "message": "Payment failed"}

        elif event_name == "order_created":
            # Order created (one-time or first subscription payment)
            if transaction:
                transaction.webhook_id = webhook_id
                # Order is just created, wait for subscription_created for activation
            return {"status": "pending", "message": "Order created, awaiting subscription"}

        elif event_name == "order_refunded":
            # Refund processed
            if transaction:
                transaction.status = "refunded"
                transaction.webhook_id = webhook_id

            await self.session.flush()
            logger.info(f"LemonSqueezy order refunded for subscription: {subscription.id}")
            return {"status": "refunded", "message": "Refund processed"}

        else:
            logger.warning(f"Unhandled LemonSqueezy webhook event: {event_name}")
            return {"status": "ignored", "message": f"Event {event_name} not handled"}
