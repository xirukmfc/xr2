import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PublicShare(Base):
    """Public sharing model for prompt versions"""
    __tablename__ = "public_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    token = Column(String(64), nullable=False, unique=True, index=True)

    # Foreign keys
    prompt_version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Optional expiration
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    prompt_version = relationship("PromptVersion", back_populates="public_shares")
    creator = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('ix_public_shares_token_active', 'token', 'is_active'),
        Index('ix_public_shares_version_active', 'prompt_version_id', 'is_active'),
    )

    def __repr__(self):
        return f"<PublicShare(id={self.id}, token={self.token[:8]}..., active={self.is_active})>"