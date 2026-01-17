from sqlalchemy import Column, String, UUID, TIMESTAMP, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime


class SystemEvent(Base):
    """Model for tracking system_docs-wide events for monitoring dashboard."""
    __tablename__ = "system_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Event classification
    event_type = Column(String(100), nullable=False, index=True)
    # Examples: 'user_registered', 'prompt_created', 'api_key_created',
    #           'test_with_ai', 'ab_test_created', 'ab_test_started', 'api_request'

    # Resource reference
    resource_type = Column(String(50), nullable=False, index=True)
    # Examples: 'user', 'prompt', 'prompt_version', 'api_key', 'test_run',
    #           'event_definition', 'funnel', 'ab_test', 'api'

    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Actor information
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=True, index=True)

    # Action details
    action = Column(String(50), nullable=False)
    # Examples: 'create', 'start', 'complete', 'request'

    status = Column(String(20), nullable=False, default='success')
    # 'success', 'failure'

    # For API requests breakdown by source
    source_name = Column(String(255), nullable=True, index=True)

    # Detailed data
    event_data = Column(JSONB, nullable=True)
    # Structured data about the event, e.g.:
    # {
    #   'prompt_name': 'my-prompt',
    #   'model': 'gpt-4',
    #   'latency_ms': 234,
    #   'endpoint': '/api/v1/get-prompt'
    # }

    # Error tracking
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    workspace = relationship("Workspace", foreign_keys=[workspace_id])

    __table_args__ = (
        Index('idx_system_events_workspace_created', 'workspace_id', 'created_at'),
        Index('idx_system_events_user_created', 'user_id', 'created_at'),
        Index('idx_system_events_type_created', 'event_type', 'created_at'),
        Index('idx_system_events_source_created', 'source_name', 'created_at'),
    )

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "event_type": self.event_type,
            "resource_type": self.resource_type,
            "resource_id": str(self.resource_id) if self.resource_id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "workspace_id": str(self.workspace_id) if self.workspace_id else None,
            "action": self.action,
            "status": self.status,
            "source_name": self.source_name,
            "event_data": self.event_data,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<SystemEvent: {self.event_type}/{self.action} [{self.status}]>"
