from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application configuration settings"""

    # Environment
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str
    POSTGRES_PASSWORD: Optional[str] = None  # Used for database setup

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Admin
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    ADMIN_EMAIL: str

    # Application
    PROJECT_NAME: str = "xR2 Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    CORS_ORIGINS: Optional[str] = "*"

    # Redis (for caching and background tasks)
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None  # Used for Redis auth if needed

    # API Keys
    ANTHROPIC_API_KEY: Optional[str] = None

    # OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 100
    MAX_REQUESTS_PER_IP_PER_MINUTE: int = 100
    MAX_REQUESTS_PER_API_KEY_PER_MINUTE: int = 1000

    # Monitoring
    GRAFANA_PASSWORD: Optional[str] = None

    # SSL Configuration
    SSL_CERT_PATH: Optional[str] = None
    SSL_KEY_PATH: Optional[str] = None

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE_PATH: Optional[str] = None

    # Email Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None

    # External API Configuration
    EXTERNAL_API_BASE_URL: Optional[str] = None
    EXTERNAL_API_TIMEOUT: int = 30

    # Backup Configuration
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_SCHEDULE: str = "0 2 * * *"

    # Performance Configuration
    WORKER_PROCESSES: int = 4
    MAX_CONNECTIONS: int = 1000
    TIMEOUT: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields instead of raising errors


# Global settings instance
settings = Settings()
