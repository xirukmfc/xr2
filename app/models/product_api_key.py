import uuid
import secrets
import string
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Text,
    Integer,
    JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ProductAPIKey(Base):
    """Model for API-as-Product keys that allow external access to prompts"""
    __tablename__ = "product_api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # API Key details
    name = Column(String(100), nullable=False)  # User-defined name for the key
    key_hash = Column(String(64), unique=True, nullable=False, index=True)  # Hashed API key
    key_prefix = Column(String(20), nullable=False)  # First few chars for identification
    encrypted_key = Column(Text, nullable=False)  # Encrypted full key for display to owner
    
    # User reference
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Usage tracking
    total_requests = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)  # Optional description
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    api_logs = relationship("ProductAPILog", back_populates="api_key", cascade="all, delete-orphan")
    
    @classmethod
    def generate_api_key(cls) -> tuple[str, str, str, str]:
        """
        Generate a new API key with prefix, hash, and encrypted version
        Returns: (full_key, key_hash, key_prefix, encrypted_key)
        """
        # Generate random key part
        alphabet = string.ascii_letters + string.digits
        key_part = ''.join(secrets.choice(alphabet) for _ in range(32))
        full_key = f"xr2_prod_{key_part}"

        # Hash the key for storage and verification
        import hashlib
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()

        # Store first 12 chars as prefix for identification
        key_prefix = full_key[:12] + "..."

        # Encrypt the full key for display to owner
        encrypted_key = cls._encrypt_key(full_key)

        return full_key, key_hash, key_prefix, encrypted_key

    @classmethod
    def _encrypt_key(cls, key: str) -> str:
        """Simple encryption for displaying keys to owners"""
        from app.core.config import settings
        from cryptography.fernet import Fernet
        import base64

        # Use a key derived from the secret key
        key_bytes = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].encode().ljust(32, b'\0'))
        f = Fernet(key_bytes)
        return f.encrypt(key.encode()).decode()

    @classmethod
    def _decrypt_key(cls, encrypted_key: str) -> str:
        """Decrypt a key for display to owner"""
        from app.core.config import settings
        from cryptography.fernet import Fernet
        import base64

        # Use a key derived from the secret key
        key_bytes = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].encode().ljust(32, b'\0'))
        f = Fernet(key_bytes)
        return f.decrypt(encrypted_key.encode()).decode()

    def get_decrypted_key(self) -> str:
        """Get the decrypted full API key"""
        if self.encrypted_key == 'LEGACY_KEY_NOT_RECOVERABLE':
            return self.key_prefix + "••••••••••••••••••••••••••••••••"
        try:
            return self._decrypt_key(self.encrypted_key)
        except Exception:
            return self.key_prefix + "••••••••••••••••••••••••••••••••"
    
    @classmethod
    def hash_key(cls, api_key: str) -> str:
        """Hash an API key for comparison"""
        import hashlib
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def to_dict(self, include_full_key=True):
        """Convert to dictionary for API responses"""
        result = {
            "id": str(self.id),
            "name": self.name,
            "key_prefix": self.key_prefix,
            "user_id": str(self.user_id),
            "total_requests": self.total_requests,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_full_key:
            # Include the decrypted full API key for owner
            try:
                result["api_key"] = self.get_decrypted_key()
            except Exception:
                result["api_key"] = self.key_prefix  # Fallback to prefix if decryption fails

        return result
    
    def __repr__(self):
        return f"<ProductAPIKey: {self.name} ({self.key_prefix})>"


class ProductAPILog(Base):
    """Model for logging API-as-Product requests and responses"""
    __tablename__ = "product_api_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # API Key reference
    api_key_id = Column(UUID(as_uuid=True), ForeignKey('product_api_keys.id'), nullable=False, index=True)
    
    # Request details
    request_id = Column(String(100), unique=True, index=True)
    trace_id = Column(String(100), nullable=True, index=True)  # For tracking events
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)

    # Prompt tracking (populated when possible from request data)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey('prompts.id'), nullable=True, index=True)
    prompt_version_id = Column(UUID(as_uuid=True), ForeignKey('prompt_versions.id'), nullable=True, index=True)
    
    # Request/Response data
    request_params = Column(JSON)  # Query parameters
    request_body = Column(JSON, nullable=True)  # Request body if any
    response_body = Column(JSON, nullable=True)  # Response data
    
    # Performance metrics
    latency_ms = Column(Integer)
    
    # Status tracking
    status_code = Column(Integer, nullable=False)
    error_message = Column(Text, nullable=True)
    is_success = Column(Boolean, default=True)
    
    # IP and User Agent
    client_ip = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    api_key = relationship("ProductAPIKey", back_populates="api_logs")
    prompt = relationship("Prompt", foreign_keys=[prompt_id])
    prompt_version = relationship("PromptVersion", foreign_keys=[prompt_version_id])
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "api_key_id": str(self.api_key_id),
            "request_id": self.request_id,
            "trace_id": self.trace_id,
            "endpoint": self.endpoint,
            "method": self.method,
            "request_params": self.request_params,
            "request_body": self.request_body,
            "response_body": self.response_body,
            "latency_ms": self.latency_ms,
            "status_code": self.status_code,
            "error_message": self.error_message,
            "is_success": self.is_success,
            "client_ip": self.client_ip,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f"<ProductAPILog: {self.method} {self.endpoint} [{self.status_code}]>"
