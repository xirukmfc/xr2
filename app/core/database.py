from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import logging

from .config import settings

# Create async engine with optimized connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    # Use proper connection pooling instead of NullPool for better performance
    pool_size=10,  # Number of connections to maintain in the pool
    max_overflow=20,  # Additional connections that can be created on demand
    echo=False,  # Disable SQL query logging
    future=True,
    # Connection health checks
    pool_pre_ping=True,
    pool_recycle=1800,  # Recycle connections every 30 minutes (was 1 hour)
    # Timeout settings for better error handling
    pool_timeout=30,  # Timeout when getting connection from pool
    connect_args={
        "server_settings": {
            "jit": "off"
        }
    }
)

# Create optimized sync engine for admin interface
sync_engine = create_engine(
    settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"),
    # Use smaller but dedicated connection pool for admin interface
    pool_size=3,  # Admin interface needs fewer connections
    max_overflow=5,
    echo=False,  # Disable SQL query logging
    # Connection health and recycling
    pool_pre_ping=True,
    pool_recycle=1800,  # Recycle connections every 30 minutes
    pool_timeout=20,  # Shorter timeout for admin interface
    connect_args={}
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Create sync session factory for admin interface
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False
)

# Create declarative base for models
Base = declarative_base()

# Logging
logger = logging.getLogger(__name__)


async def get_session() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            # Don't log 403/401 errors as critical database errors
            if "403" in str(e) or "401" in str(e) or "Not authenticated" in str(e):
                logger.debug(f"Authentication error in database session: {e}")
            else:
                logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database - create all tables"""
    try:
        # Import all models here to ensure they are registered with Base
        from app.models.user import User
        from app.models.workspace import Workspace
        from app.models.prompt import Prompt, PromptVersion, Tag
        from app.models.product_api_key import ProductAPIKey, ProductAPILog
        from app.models.prompt_stats import PromptStats
        from app.models.user_limits import UserLimits, GlobalLimits, UserAPIUsage
        
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            
        logger.info("✅ Database tables created successfully")
        
        # Create default admin user
        await create_default_admin()
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


async def create_default_admin():
    """Create default admin user and workspace"""
    try:
        from app.models.user import User
        from app.models.workspace import Workspace
        from app.core.security import get_password_hash

        async with AsyncSessionLocal() as session:
            # Check if admin already exists
            result = await session.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": settings.ADMIN_USERNAME}
            )
            admin_exists = result.first()

            if not admin_exists:
                # Create admin user
                hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
                admin_user = User(
                    username=settings.ADMIN_USERNAME,
                    email=settings.ADMIN_EMAIL,
                    hashed_password=hashed_password,
                    is_active=True,
                    is_superuser=True
                )
                session.add(admin_user)
                await session.commit()
                await session.refresh(admin_user)

                logger.info(f"✅ Default admin user created: {settings.ADMIN_USERNAME}")

                # Create default workspace for admin
                workspace = Workspace(
                    name="Default Workspace",
                    slug="default",
                    description="Default workspace for admin",
                    owner_id=admin_user.id,
                    is_active=True
                )
                session.add(workspace)
                await session.commit()
                await session.refresh(workspace)

                logger.info(f"✅ Default workspace created for admin: {workspace.name}")
            else:
                logger.info("ℹ️ Default admin user already exists")

                # Check if admin has a workspace
                admin_id = admin_exists[0]
                workspace_result = await session.execute(
                    text("SELECT id FROM workspaces WHERE owner_id = :owner_id"),
                    {"owner_id": admin_id}
                )
                workspace_exists = workspace_result.first()

                if not workspace_exists:
                    # Create default workspace for existing admin
                    workspace = Workspace(
                        name="Default Workspace",
                        slug="default",
                        description="Default workspace for admin",
                        owner_id=admin_id,
                        is_active=True
                    )
                    session.add(workspace)
                    await session.commit()
                    await session.refresh(workspace)

                    logger.info(f"✅ Default workspace created for existing admin: {workspace.name}")
                else:
                    logger.info("ℹ️ Default admin workspace already exists")

    except Exception as e:
        logger.error(f"❌ Failed to create default admin/workspace: {e}")


async def close_db():
    """Close database connections"""
    await engine.dispose()
