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
    
    # API request limits per day
    max_api_requests_per_day = Column(Integer, nullable=False, default=100)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="limits")
    
    def __repr__(self):
        return f"<UserLimits user_id={self.user_id} prompts={self.max_prompts} api={self.max_api_requests_per_day}>"


class GlobalLimits(Base):
    """Model for storing global default limits"""
    
    __tablename__ = "global_limits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Default limits for new users
    default_max_prompts = Column(Integer, nullable=False, default=10)
    default_max_api_requests_per_day = Column(Integer, nullable=False, default=100)
    
    # Whether these settings are active
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<GlobalLimits prompts={self.default_max_prompts} api={self.default_max_api_requests_per_day}>"


class UserAPIUsage(Base):
    """Model for tracking daily API usage per user"""
    
    __tablename__ = "user_api_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Usage tracking
    date = Column(DateTime(timezone=True), nullable=False, index=True)  # Date for which usage is tracked (YYYY-MM-DD in UTC)
    api_requests_count = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    user = relationship("User")
    
    def __repr__(self):
        return f"<UserAPIUsage user_id={self.user_id} date={self.date.date()} requests={self.api_requests_count}>"
    
    @classmethod
    def get_today_date(cls):
        """Get today's date in UTC for tracking"""
        return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    @classmethod
    def get_next_reset_time(cls):
        """Get the next reset time (start of next day in UTC)"""
        today = cls.get_today_date()
        return today + timedelta(days=1)
