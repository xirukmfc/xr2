import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Integer,
    Index,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PromptStats(Base):
    """Aggregated statistics for prompt usage - updated periodically for performance"""
    __tablename__ = "prompt_stats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # What we're tracking stats for
    prompt_id = Column(UUID(as_uuid=True), ForeignKey('prompts.id'), nullable=False, index=True)
    prompt_version_id = Column(UUID(as_uuid=True), ForeignKey('prompt_versions.id'), nullable=True, index=True)
    source_name = Column(String(100), nullable=False, index=True)  # Who requested the prompt
    
    # Time period for these stats
    period_type = Column(String(20), nullable=False)  # 'hour', 'day'
    period_start = Column(DateTime(timezone=True), nullable=False, index=True)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Aggregated metrics
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)  # status_code < 400
    failed_requests = Column(Integer, default=0)      # status_code >= 400
    
    # Status code breakdown
    status_200_count = Column(Integer, default=0)
    status_400_count = Column(Integer, default=0) 
    status_401_count = Column(Integer, default=0)
    status_403_count = Column(Integer, default=0)
    status_404_count = Column(Integer, default=0)
    status_422_count = Column(Integer, default=0)
    status_500_count = Column(Integer, default=0)
    status_other_count = Column(Integer, default=0)
    
    # Performance metrics
    total_latency_ms = Column(Integer, default=0)      # Sum for calculating averages
    avg_latency_ms = Column(Integer, default=0)        # Cached average
    min_latency_ms = Column(Integer, nullable=True)
    max_latency_ms = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    prompt = relationship("Prompt", foreign_keys=[prompt_id])
    prompt_version = relationship("PromptVersion", foreign_keys=[prompt_version_id])
    
    # Ensure one stats record per prompt/version/source/period combination
    __table_args__ = (
        UniqueConstraint('prompt_id', 'prompt_version_id', 'source_name', 'period_type', 'period_start', 
                        name='_prompt_stats_unique'),
        Index('ix_prompt_stats_lookup', 'prompt_id', 'prompt_version_id', 'period_type', 'period_start'),
    )
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        success_rate = round((self.successful_requests / self.total_requests * 100) if self.total_requests > 0 else 0, 2)
        
        return {
            "id": str(self.id),
            "prompt_id": str(self.prompt_id),
            "prompt_version_id": str(self.prompt_version_id) if self.prompt_version_id else None,
            "source_name": self.source_name,
            "period_type": self.period_type,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate_percent": success_rate,
            "status_breakdown": {
                "200": self.status_200_count,
                "400": self.status_400_count,
                "401": self.status_401_count,
                "403": self.status_403_count,
                "404": self.status_404_count,
                "422": self.status_422_count,
                "500": self.status_500_count,
                "other": self.status_other_count
            },
            "avg_latency_ms": self.avg_latency_ms,
            "min_latency_ms": self.min_latency_ms,
            "max_latency_ms": self.max_latency_ms,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f"<PromptStats: {self.prompt_id}/{self.source_name} ({self.period_type})>"
