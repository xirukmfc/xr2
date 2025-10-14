from fastapi import APIRouter
from . import prompts, auth, tags, workspaces, llm, tokenize, stats, product_api_keys, product_logs, public_share, analytics, ab_tests_simple, custom_funnel_configurations, conversion_funnels

# Main API router
router = APIRouter()

router.include_router(auth.router)
router.include_router(prompts.router)
router.include_router(tags.router)
router.include_router(workspaces.router)
router.include_router(llm.router, prefix="/llm", tags=["models"])
router.include_router(tokenize.router, prefix="/llm", tags=["models"])
router.include_router(stats.router, prefix="/stats", tags=["stats"])
router.include_router(public_share.router)

# Internal product management routes
router.include_router(product_api_keys.router, tags=["keys for external use"])
router.include_router(product_logs.router, prefix="/api-usage", tags=["api usage logs"])

# Analytics routes
router.include_router(analytics.router, tags=["analytics"])
router.include_router(ab_tests_simple.router, tags=["ab-tests-simple"])
router.include_router(custom_funnel_configurations.router, tags=["custom-funnel-configurations"])
router.include_router(conversion_funnels.router, tags=["conversion-funnels"])


# Health check endpoint
@router.get("/health")
async def api_health():
    """API health check"""
    return {"status": "healthy", "message": "xR2 API is running"}
