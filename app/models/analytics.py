from sqlalchemy import Column, String, UUID, TIMESTAMP, Integer, Numeric, Boolean, JSON, ForeignKey, Index, \
    UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime


class PromptEvent(Base):
    __tablename__ = "prompt_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    trace_id = Column(String(100), nullable=False, index=True)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"))
    prompt_version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"))
    event_type = Column(String(50), nullable=False)
    outcome = Column(String(50))
    session_id = Column(String(100))
    user_id = Column(String(255))
    event_metadata = Column(JSONB)
    business_metrics = Column(JSONB)
    error_details = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="events")
    prompt = relationship("Prompt", back_populates="events")
    prompt_version = relationship("PromptVersion", back_populates="events")

    __table_args__ = (
        Index('idx_events_workspace_created', 'workspace_id', 'created_at'),
        Index('idx_events_prompt_outcome', 'prompt_id', 'outcome', 'created_at'),
    )


class PromptMetricsHourly(Base):
    __tablename__ = "prompt_metrics_hourly"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"))
    prompt_version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"))
    hour_bucket = Column(TIMESTAMP(timezone=True), nullable=False)
    total_requests = Column(Integer, default=0)
    successful_outcomes = Column(Integer, default=0)
    failed_outcomes = Column(Integer, default=0)
    partial_outcomes = Column(Integer, default=0)
    abandoned_outcomes = Column(Integer, default=0)
    total_revenue = Column(Numeric(12, 2), default=0)
    total_value = Column(Numeric(12, 2), default=0)
    conversion_count = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    avg_response_time_ms = Column(Integer)
    token_cost = Column(Numeric(10, 4), default=0)
    error_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('workspace_id', 'prompt_id', 'prompt_version_id', 'hour_bucket'),
        Index('idx_metrics_workspace_hour', 'workspace_id', 'hour_bucket'),
        Index('idx_metrics_prompt_hour', 'prompt_id', 'hour_bucket'),
    )


class EventDefinition(Base):
    __tablename__ = "event_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    event_name = Column(String(100), nullable=False)
    category = Column(String(100))
    description = Column(String)
    required_fields = Column(JSONB)
    optional_fields = Column(JSONB)
    validation_rules = Column(JSONB)
    success_criteria = Column(JSONB)
    alert_thresholds = Column(JSONB)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('workspace_id', 'event_name'),
    )


class ConversionFunnel(Base):
    __tablename__ = "conversion_funnels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String)

    # Source configuration (numerator)
    source_type = Column(String(50), nullable=False)  # 'prompt_requests' or 'event'
    source_event_name = Column(String(100))  # if source_type == 'event'
    source_prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"))  # if source_type == 'prompt_requests'

    # Target configuration (denominator)
    target_event_name = Column(String(100), nullable=False)
    target_event_category = Column(String(100))

    # Metric configuration
    metric_type = Column(String(50), nullable=False, default='count')  # 'count' or 'sum'
    metric_field = Column(String(100))  # field name for 'sum' metric_type (e.g., 'revenue', 'amount')

    # Time window settings
    conversion_window_hours = Column(Integer, default=24)  # How long to wait for conversion

    # Display settings
    is_active = Column(Boolean, default=True)
    color = Column(String(7), default='#3B82F6')  # Hex color for UI

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="conversion_funnels")
    created_by_user = relationship("User")
    source_prompt = relationship("Prompt", foreign_keys=[source_prompt_id])

    __table_args__ = (
        UniqueConstraint('workspace_id', 'name'),
        Index('idx_conversion_workspace', 'workspace_id', 'is_active'),
    )


class ABTest(Base):
    __tablename__ = "ab_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"))

    # Simple A/B test: only 2 versions
    version_a_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"))  # Control version
    version_b_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"))  # Variant version

    # Request tracking
    total_requests = Column(Integer, nullable=False)  # Total number of requests for this test
    version_a_requests = Column(Integer, default=0)  # Requests served with version A
    version_b_requests = Column(Integer, default=0)  # Requests served with version B

    # Status
    status = Column(String(50), default='draft')  # draft, running, completed, cancelled

    # Timestamps
    started_at = Column(TIMESTAMP(timezone=True))
    ended_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="ab_tests")
    prompt = relationship("Prompt", foreign_keys=[prompt_id])
    version_a = relationship("PromptVersion", foreign_keys=[version_a_id])
    version_b = relationship("PromptVersion", foreign_keys=[version_b_id])

    __table_args__ = (
        Index('idx_ab_test_workspace_status', 'workspace_id', 'status'),
        Index('idx_ab_test_prompt', 'prompt_id', 'status'),
    )


class CustomFunnelConfiguration(Base):
    __tablename__ = "custom_funnel_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String)
    event_steps = Column(ARRAY(String), nullable=False)  # Array of event names in order
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="custom_funnel_configurations")
    created_by_user = relationship("User")

    __table_args__ = (
        UniqueConstraint('workspace_id', 'name'),
        Index('idx_custom_funnel_workspace', 'workspace_id', 'is_active'),
    )