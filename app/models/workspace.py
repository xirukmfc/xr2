from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Table, UniqueConstraint

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

# Association table for workspace members (many-to-many relationship)
workspace_members = Table(
    'workspace_members',
    Base.metadata,
    Column('workspace_id', UUID(as_uuid=True), ForeignKey('workspaces.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('role', String(20), default='member'),  # admin, member, viewer
    Column('joined_at', DateTime(timezone=True), server_default=func.now())
)


class Workspace(Base):
    """Workspace model for multi-tenancy and team collaboration"""
    
    __tablename__ = "workspaces"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False, index=True)
    slug = Column(String(50), index=True, nullable=False)
    description = Column(Text)
    
    # Owner
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Settings
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("User", secondary=workspace_members, back_populates="workspaces")
    prompts = relationship("Prompt", back_populates="workspace", cascade="all, delete-orphan")
    events = relationship("PromptEvent", back_populates="workspace", cascade="all, delete-orphan")
    conversion_funnels = relationship("ConversionFunnel", back_populates="workspace", cascade="all, delete-orphan")
    custom_funnel_configurations = relationship("CustomFunnelConfiguration", back_populates="workspace", cascade="all, delete-orphan")
    ab_tests = relationship("ABTest", back_populates="workspace", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('owner_id', 'slug', name='uq_workspace_owner_slug'),
    )

    def __repr__(self):
        return self.name or f"Workspace(id={self.id})"
    
    def to_dict(self):
        """Convert workspace to dictionary for API responses"""
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "owner_id": str(self.owner_id),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
