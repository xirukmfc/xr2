"""
Pricing configuration model for storing plan prices in different currencies.
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID


class PricingConfig(Base):
    """Pricing configuration for subscription plans."""
    __tablename__ = "pricing_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Plan identification
    plan_name = Column(String(50), unique=True, nullable=False)  # 'free', 'pro', 'enterprise'

    # USD pricing
    price_usd = Column(Integer, default=0)  # Price in cents (e.g., 2900 = $29)
    price_usd_display = Column(String(20), default="$0")  # Display string like "$29"

    # RUB pricing
    price_rub = Column(Integer, default=0)  # Price in kopecks (e.g., 290000 = 2900₽)
    price_rub_display = Column(String(20), default="0₽")  # Display string like "2900₽"

    # Billing period
    billing_period = Column(String(20), default="month")  # 'month', 'year', 'one-time'
    billing_period_en = Column(String(50), default="/month")  # Display: "/month", "/year"
    billing_period_ru = Column(String(50), default="/мес")  # Display: "/мес", "/год"

    # Plan features (JSON stored as text for simplicity)
    features_en = Column(Text, nullable=True)  # JSON array of features in English
    features_ru = Column(Text, nullable=True)  # JSON array of features in Russian

    # Status
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)  # For ordering plans on the page

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<PricingConfig(plan={self.plan_name}, usd={self.price_usd_display}, rub={self.price_rub_display})>"
