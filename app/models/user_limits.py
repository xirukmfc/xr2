from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta, timezone
import uuid

from app.core.database import Base


class UserLimits(Base):
    """Model for storing user limits and quotas"""
    
    __tablename__ = "user_limits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Prompt limits
    max_prompts = Column(Integer, nullable=False, default=10)
    
    # API request limits per month
    max_api_requests_per_month = Column(Integer, nullable=False, default=100)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="limits")
    
    def __repr__(self):
        return f"<UserLimits user_id={self.user_id} prompts={self.max_prompts} api={self.max_api_requests_per_month}>"


class GlobalLimits(Base):
    """Model for storing global default limits"""
    
    __tablename__ = "global_limits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Default limits for new users
    default_max_prompts = Column(Integer, nullable=False, default=5)
    default_max_api_requests_per_month = Column(Integer, nullable=False, default=100)
    
    # Whether these settings are active
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<GlobalLimits prompts={self.default_max_prompts} api={self.default_max_api_requests_per_month}>"


class UserAPIUsage(Base):
    """Model for tracking monthly API usage per user"""

    __tablename__ = "user_api_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Usage tracking
    date = Column(DateTime(timezone=True), nullable=False, index=True)  # First day of month for which usage is tracked
    api_requests_count = Column(Integer, nullable=False, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("User")

    def __repr__(self):
        return f"<UserAPIUsage user_id={self.user_id} month={self.date.strftime('%Y-%m')} requests={self.api_requests_count}>"

    @classmethod
    def get_current_month_start(cls):
        """Get the first day of the current month in UTC for tracking"""
        now = datetime.now(timezone.utc)
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    @classmethod
    def get_next_reset_time(cls):
        """Get the next reset time (start of next month in UTC)"""
        current_month = cls.get_current_month_start()
        # Move to next month
        if current_month.month == 12:
            return current_month.replace(year=current_month.year + 1, month=1)
        else:
            return current_month.replace(month=current_month.month + 1)
