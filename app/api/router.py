# app/api/router.py

from fastapi import APIRouter
from app.api import analytics, ab_tests, event_definitions, custom_funnel_configurations

# Create the main internal API router
internal_router = APIRouter(prefix="/api/internal")

# Include all analytics-related routers
internal_router.include_router(analytics.router, tags=["analytics"])
internal_router.include_router(ab_tests.router, tags=["ab-tests"])
internal_router.include_router(event_definitions.router, tags=["event-definitions"])
internal_router.include_router(custom_funnel_configurations.router, tags=["custom-funnel-configurations"])

# You can add this router to your main FastAPI app with:
# app.include_router(internal_router)