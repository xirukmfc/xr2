from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class LLMProvider(Base):
    """LLM Provider model for admin configuration"""

    __tablename__ = "llm_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)  # e.g., "OpenAI", "Anthropic"
    display_name = Column(String(100), nullable=False)  # e.g., "OpenAI GPT", "Anthropic Claude"
    description = Column(Text)

    # Configuration
    is_active = Column(Boolean, default=True)
    api_base_url = Column(String(500))  # Optional base URL for API calls
    models = Column(JSON, default=list)  # List of available models for this provider

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user_api_keys = relationship("UserAPIKey", back_populates="provider", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LLMProvider: {self.name}>"

    def to_dict(self):
        """Convert provider to dictionary for API responses"""
        return {
            "id": str(self.id),
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description,
            "is_active": self.is_active,
            "api_base_url": self.api_base_url,
            "models": self.models or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class UserAPIKey(Base):
    """User API Key model for storing user-specific LLM API keys"""

    __tablename__ = "user_api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False)  # User-defined name for the key

    # References
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey('llm_providers.id'), nullable=False, index=True)

    # API Key (encrypted/hashed in production)
    encrypted_key = Column(Text, nullable=False)  # Store encrypted API key

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    provider = relationship("LLMProvider", back_populates="user_api_keys")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uq_user_api_key_name'),
    )

    def __repr__(self):
        try:
            provider_name = self.provider.name if self.provider else 'Unknown Provider'
        except:
            provider_name = 'Unknown Provider'
        return f"<UserAPIKey: {self.name} ({provider_name})>"

    def to_dict(self, include_key=False):
        """Convert API key to dictionary for API responses"""
        result = {
            "id": str(self.id),
            "name": self.name,
            "user_id": str(self.user_id),
            "provider_id": str(self.provider_id),
            "provider_name": self.provider.name if self.provider else None,
            "provider_display_name": self.provider.display_name if self.provider else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        # Only include the actual key if explicitly requested (for admin or when editing)
        if include_key:
            result["encrypted_key"] = self.encrypted_key

        return result
