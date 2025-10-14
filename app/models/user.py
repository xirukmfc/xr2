from sqlalchemy import Column, String, Boolean, DateTime, UUID, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
import uuid

from app.core.database import Base


class User(Base):
    """User model for authentication and user management"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # User details
    full_name = Column(String(100))

    # Status flags
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    # ADD THIS: Virtual field for password (not saved in DB)
    @hybrid_property
    def password(self):
        """Virtual field for password input in admin panel"""
        return ""

    @password.setter
    def password(self, value):
        """Automatically hash password when setting"""
        if value:
            from app.core.security import get_password_hash
            self.hashed_password = get_password_hash(value)

    def __repr__(self):
        return f"<User: {self.username}>"

    # Relationships
    workspaces = relationship("Workspace", secondary="workspace_members", back_populates="members")
    limits = relationship("UserLimits", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        """Convert user to dictionary for API responses"""
        return {
            "id": str(self.id),
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
