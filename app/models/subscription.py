"""Subscription models for user plans and payment transactions"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class UserSubscription(Base):
    """Model for user subscription plans"""

    __tablename__ = "user_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Plan info
    plan = Column(String(20), nullable=False, default="free")  # free, pro, enterprise
    status = Column(String(20), nullable=False, default="active")  # active, cancelled, expired, pending

    # Billing period
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)

    # Subscription settings
    auto_renew = Column(Boolean, nullable=False, default=True)
    currency = Column(String(3), nullable=False, default="USD")  # USD or RUB

    # Cancellation tracking
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Payment provider IDs
    payment_method_id = Column(String(255), nullable=True)  # YooKassa recurring payment method
    external_subscription_id = Column(String(255), nullable=True, index=True)  # LemonSqueezy subscription ID

    # Payment provider used for this subscription
    payment_provider = Column(String(20), nullable=True)  # "yookassa" | "lemonsqueezy"

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscription")
    transactions = relationship("SubscriptionTransaction", back_populates="subscription", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UserSubscription user_id={self.user_id} plan={self.plan} status={self.status}>"

    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active

        A subscription is active if:
        - status is 'active' OR 'cancelled' (cancelled still works until period_end)
        - AND for paid plans: period_end hasn't passed yet
        """
        # Expired or pending subscriptions are not active
        if self.status not in ("active", "cancelled"):
            return False
        # Free plan is always active
        if self.plan == "free":
            return True
        # Paid plans: check if period hasn't ended
        if self.period_end and self.period_end < datetime.now(timezone.utc):
            return False
        return True

    @property
    def days_remaining(self) -> int:
        """Get days remaining in current period"""
        if not self.period_end:
            return -1  # Unlimited for free plan
        delta = self.period_end - datetime.now(timezone.utc)
        return max(0, delta.days)


class SubscriptionTransaction(Base):
    """Model for subscription payment transactions"""

    __tablename__ = "subscription_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)

    # Payment details
    amount = Column(Integer, nullable=False)  # cents/kopecks
    currency = Column(String(3), nullable=False)  # USD or RUB
    status = Column(String(20), nullable=False, default="pending")  # pending, completed, failed, refunded
    transaction_type = Column(String(20), nullable=False)  # subscription, renewal, upgrade, refund

    # Period this transaction covers
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)

    # External payment info
    external_id = Column(String(255), nullable=True)  # for payment gateway (Stripe, YooKassa)
    payment_method = Column(String(50), nullable=True)  # manual, stripe, yookassa
    webhook_id = Column(String(255), nullable=True, unique=True, index=True)  # for idempotent webhook processing

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    subscription = relationship("UserSubscription", back_populates="transactions")

    def __repr__(self):
        return f"<SubscriptionTransaction id={self.id} amount={self.amount} {self.currency} status={self.status}>"

    @property
    def amount_display(self) -> str:
        """Get formatted amount for display"""
        if self.currency == "USD":
            return f"${self.amount / 100:.2f}"
        elif self.currency == "RUB":
            return f"{self.amount / 100:.0f}₽"
        return f"{self.amount / 100:.2f} {self.currency}"
