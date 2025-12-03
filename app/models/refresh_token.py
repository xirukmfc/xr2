from sqlalchemy import Column, String, DateTime, UUID, ForeignKey, func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class RefreshToken(Base):
    """Refresh token model for persistent user sessions"""

    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    device_info = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)

    # Relationships
    user = relationship("User", backref="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken: {self.id} for user {self.user_id}>"

    def is_valid(self):
        """Check if token is still valid"""
        from datetime import datetime, timezone
        return (
            self.revoked_at is None and
            self.expires_at > datetime.now(timezone.utc)
        )

    def to_dict(self):
        """Convert refresh token to dictionary for API responses"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "device_info": self.device_info,
            "ip_address": self.ip_address,
        }
