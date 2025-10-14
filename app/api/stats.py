from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict
import time
from app.core.database import get_session
from app.models.prompt import Prompt
from app.models.product_api_key import ProductAPIKey
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter()

# Simple in-memory cache with TTL
_cache = {}
_cache_ttl = {}
CACHE_DURATION = 300  # 5 minutes


def get_cache_key(user_id: str, workspace_id: str = None) -> str:
    """Generate cache key for user stats"""
    return f"stats_{user_id}_{workspace_id or 'all'}"


def is_cache_valid(cache_key: str) -> bool:
    """Check if cache entry is still valid"""
    return (
            cache_key in _cache and
            cache_key in _cache_ttl and
            time.time() - _cache_ttl[cache_key] < CACHE_DURATION
    )


def set_cache(cache_key: str, data: Dict) -> None:
    """Set cache entry with current timestamp"""
    _cache[cache_key] = data
    _cache_ttl[cache_key] = time.time()


@router.get("/counts")
async def get_counts(
        workspace_id: str = None,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get counts of prompts and API keys for the current user"""
    cache_key = get_cache_key(str(current_user.id), workspace_id)

    # Check cache first
    if is_cache_valid(cache_key):
        return _cache[cache_key]

    # Get prompts count
    prompts_query = select(func.count(Prompt.id)).where(Prompt.created_by == current_user.id)
    if workspace_id:
        prompts_query = prompts_query.where(Prompt.workspace_id == workspace_id)

    prompts_result = await session.execute(prompts_query)
    prompts_count = prompts_result.scalar() or 0

    # Get Product API keys count (external API keys)
    api_keys_query = select(func.count(ProductAPIKey.id)).where(ProductAPIKey.user_id == current_user.id)
    api_keys_result = await session.execute(api_keys_query)
    api_keys_count = api_keys_result.scalar() or 0

    counts_data = {
        "prompts_count": prompts_count,
        "api_keys_count": api_keys_count,
        "cached_at": time.time()
    }

    # Cache the result
    set_cache(cache_key, counts_data)

    return counts_data


@router.post("/invalidate-cache")
async def invalidate_cache(
        current_user: User = Depends(get_current_user)
):
    """Invalidate cache for current user (useful after creating/deleting items)"""
    user_id = str(current_user.id)

    # Remove all cache entries for this user
    keys_to_remove = [key for key in _cache.keys() if key.startswith(f"stats_{user_id}_")]
    for key in keys_to_remove:
        _cache.pop(key, None)
        _cache_ttl.pop(key, None)

    return {"success": True, "message": "Cache invalidated"}
