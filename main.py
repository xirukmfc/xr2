import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import logging

# Configure logging to suppress SQLAlchemy engine logs
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)

from app.core.database import init_db
from app.core.config import settings
from app.api import router as api_router
from app.middleware.product_logging import ProductAPILoggingMiddleware
from app.middleware.rate_limiter import RateLimitMiddleware, rate_limiter
from app.middleware.swagger_auth import SwaggerAuthMiddleware
from app.middleware.security import SecurityMiddleware
from fastapi import Form
from fastapi.responses import RedirectResponse, Response

# Product API routes (separate router for external API)
from app.api.product import router as product_router

# Public API routes (limited to 2 methods)
from app.api.public_api import public_api_router

# Statistics API routes
from app.api.statistics import router as statistics_router

# Conversion Funnels API routes
from app.api.conversion_funnels import router as conversion_funnels_router

# Event Definitions API routes
from app.api.event_definitions import router as event_definitions_router

# Additional API routes for admin documentation
# Note: Individual routers are already included in api_router

# Setup admin interface after app creation
from app.admin.sqladmin_config import create_admin

# Load environment variables
load_dotenv()

os.environ["FORWARDED_ALLOW_IPS"] = "*"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for application initialization and shutdown"""

    # Startup events
    from app.core.database import engine
    from app.services.scheduler import scheduler
    
    app.state.db_engine = engine
    await init_db()
    
    # Start statistics aggregation scheduler
    await scheduler.start()
    
    print("✅ Database initialized")
    print("📊 Statistics scheduler started")
    print("🚀 xR2 Platform is ready!")
    print("📊 Admin interface: http://localhost:8000/admin")
    print("🔐 Admin Swagger (protected): http://localhost:8000/admin-docs")
    print("📚 Public API docs: http://localhost:8000/docs")

    yield  # Application is running

    # Shutdown events
    from app.services.scheduler import scheduler
    await scheduler.stop()
    print("🛑 Shutting down xR2 Platform")


# Create main FastAPI application with public docs
app = FastAPI(
    title="xR2 Public API",
    description="Public API with limited access - only get-prompt and events",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    servers=[{"url": "https://xr2.uk", "description": "Production"}],
    root_path_in_servers=False,
)

# Add security middleware (should be first for maximum protection)
app.add_middleware(SecurityMiddleware)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["xr2.uk", "www.xr2.uk", "localhost", "127.0.0.1"]
)

# Add Swagger authentication middleware (protects admin docs)
# Add Swagger authentication middleware (temporarily disabled for testing)
# app.add_middleware(SwaggerAuthMiddleware, admin_path="/admin-docs")

# Add product API logging middleware
app.add_middleware(ProductAPILoggingMiddleware)

# Add session middleware for admin auth
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Proxy headers middleware - Trust nginx proxy headers
from starlette.middleware.base import BaseHTTPMiddleware

class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Trust X-Forwarded-* headers from nginx
        if "x-forwarded-proto" in request.headers:
            request.scope["scheme"] = request.headers["x-forwarded-proto"]
        if "x-forwarded-host" in request.headers:
            request.scope["server"] = (request.headers["x-forwarded-host"], 443 if request.scope.get("scheme") == "https" else 80)
        response = await call_next(request)
        return response

app.add_middleware(ProxyHeadersMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include only public API routes (2 methods) in main app
app.include_router(public_api_router, prefix="/api/v1")

# Include internal API routes (for actual API functionality)
# These routes work but don't appear in public Swagger (include_in_schema=False)
app.include_router(api_router, prefix="/internal", include_in_schema=False)
app.include_router(statistics_router, prefix="/internal", include_in_schema=False)
app.include_router(event_definitions_router, prefix="/internal", include_in_schema=False)

# Include product API routes
app.include_router(product_router, prefix="/api/v1")

# Public sharing endpoints (no authentication required)
from app.api.public_share import public_router as public_share_router
app.include_router(public_share_router, include_in_schema=False)

admin = create_admin(app)

# Add admin documentation routes directly to main app
# This avoids the /admin-docs prefix issue in Swagger URLs

# Add login endpoint for admin docs
@app.post("/admin-docs/login", include_in_schema=False)
async def admin_login(username: str = Form(...), password: str = Form(...)):
    """Admin login endpoint for Swagger access"""
    from app.core.database import get_session
    from app.core.security import verify_password
    from app.models.user import User
    from sqlalchemy import select
    
    # Get database session
    async for session in get_session():
        # Check if user exists and is superuser
        result = await session.execute(
            select(User).where(User.username == username, User.is_superuser == True)
        )
        user = result.scalar_one_or_none()
        
        if user and verify_password(password, user.hashed_password):
            # Создаем простую сессию (в реальном проекте используйте JWT или сессии)
            response = RedirectResponse(url="/admin-docs/", status_code=302)
            response.set_cookie(
                "swagger_session", 
                "admin_authenticated", 
                max_age=3600,  # 1 час
                httponly=True,
                secure=False,  # В продакшене должно быть True
                samesite="lax"
            )
            return response
        else:
            return Response(
                content="<html><body><h1>Invalid credentials</h1><a href='/'>Try again</a></body></html>",
                media_type="text/html",
                status_code=401
            )

# Create admin documentation app with proper URL handling
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

@app.get("/admin-docs/", include_in_schema=False)
async def admin_docs():
    """Admin documentation with all API endpoints"""
    return get_swagger_ui_html(
        openapi_url="/admin-docs/openapi.json",
        title="xR2 Admin API Documentation",
        swagger_ui_parameters={"defaultModelsExpandDepth": -1}
    )

@app.get("/admin-docs/openapi.json", include_in_schema=False)
async def admin_openapi():
    """OpenAPI schema for admin documentation with all internal and external APIs"""
    # Create a temporary app with all routes for documentation
    temp_app = FastAPI(title="xR2 Admin API Documentation")
    
    # Include all external API routes
    temp_app.include_router(public_api_router, prefix="/api/v1")
    
    # Include all internal API routes
    temp_app.include_router(api_router, prefix="/internal")
    temp_app.include_router(statistics_router, prefix="/internal")
    temp_app.include_router(event_definitions_router, prefix="/internal")

    return get_openapi(
        title="xR2 Admin API Documentation",
        version="1.0.0",
        description="Full API documentation…",
        routes=temp_app.routes,
        servers=[{"url": "https://xr2.uk", "description": "Production"}]
    )



@app.get("/health", include_in_schema=False)
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "xR2 Platform"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        proxy_headers=True,
        forwarded_allow_ips="*",
        reload=False,
    )
