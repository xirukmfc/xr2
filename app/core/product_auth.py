from fastapi import HTTPException, status, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
from uuid import UUID
import time
import uuid
import json
from datetime import datetime, timezone

from app.core.database import get_session
from app.models.product_api_key import ProductAPIKey, ProductAPILog
from app.models.user import User

# Security scheme for API key authentication
product_api_security = HTTPBearer(scheme_name="ProductAPIKey")


class RateLimiter:
    """Simple in-memory rate limiter for API keys"""

    def __init__(self):
        self.requests = {}  # key_id -> [(timestamp, count), ...]

    def check_rate_limit(self, key_id: str, hourly_limit: int, daily_limit: int) -> tuple[bool, str]:
        """
        Check if the API key has exceeded rate limits
        Returns: (is_allowed, error_message)
        """
        now = time.time()
        hour_ago = now - 3600
        day_ago = now - 86400

        # Get or create request history for this key
        if key_id not in self.requests:
            self.requests[key_id] = []

        requests = self.requests[key_id]

        # Clean old requests
        requests[:] = [req for req in requests if req[0] > day_ago]

        # Count requests in last hour and day
        hourly_count = sum(1 for req in requests if req[0] > hour_ago)
        daily_count = len(requests)

        # Check limits
        if hourly_count >= hourly_limit:
            return False, f"Rate limit exceeded: {hourly_count}/{hourly_limit} requests per hour"

        if daily_count >= daily_limit:
            return False, f"Rate limit exceeded: {daily_count}/{daily_limit} requests per day"

        # Record this request
        requests.append((now, 1))

        return True, ""


# Global rate limiter instance
rate_limiter = RateLimiter()


def json_serialize(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif hasattr(obj, 'to_dict'):
        return obj.to_dict()
    elif hasattr(obj, '__dict__'):
        # For other objects, try to convert to dict
        return {k: json_serialize(v) for k, v in obj.__dict__.items() if not k.startswith('_')}
    else:
        return str(obj)


def safe_json_serialize(data):
    """Safely serialize data to JSON, handling non-serializable objects"""
    if data is None:
        return None
    try:
        # First try regular JSON serialization
        json.dumps(data)
        return data
    except (TypeError, ValueError):
        # If that fails, recursively clean the data
        if isinstance(data, dict):
            return {k: safe_json_serialize(v) for k, v in data.items()}
        elif isinstance(data, (list, tuple)):
            return [safe_json_serialize(item) for item in data]
        else:
            return json_serialize(data)


async def get_product_api_key(
        credentials: HTTPAuthorizationCredentials = Depends(product_api_security),
        session: AsyncSession = Depends(get_session)
) -> ProductAPIKey:
    """
    Authenticate and validate product API key
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    api_key = credentials.credentials

    # Hash the provided key for lookup
    key_hash = ProductAPIKey.hash_key(api_key)

    # Find the API key in database
    stmt = select(ProductAPIKey).where(
        and_(
            ProductAPIKey.key_hash == key_hash,
            ProductAPIKey.is_active == True
        )
    )
    result = await session.execute(stmt)
    db_key = result.scalar_one_or_none()

    if not db_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update usage statistics
    db_key.total_requests += 1
    db_key.last_used_at = datetime.now(timezone.utc)
    await session.commit()

    return db_key


async def log_product_api_request(
        request: Request,
        api_key: ProductAPIKey,
        response_data: dict,
        status_code: int,
        latency_ms: int,
        error_message: Optional[str] = None,
        request_payload: Optional[dict] = None,
        prompt_id: Optional[UUID] = None,
        prompt_version_id: Optional[UUID] = None,
        trace_id: Optional[str] = None,
        session: AsyncSession = Depends(get_session)
):
    """
    Log API request for analytics and monitoring
    """
    try:
        # Generate unique request ID
        request_id = str(uuid.uuid4())

        # Extract request information
        endpoint = str(request.url.path)
        method = request.method
        request_params = safe_json_serialize(dict(request.query_params))

        # Get client information
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")

        # Use the provided request payload instead of trying to read the body
        request_body = safe_json_serialize(request_payload) if request_payload else None

        # Create log entry
        log_entry = ProductAPILog(
            api_key_id=api_key.id,
            request_id=request_id,
            trace_id=trace_id,
            endpoint=endpoint,
            method=method,
            request_params=request_params,
            request_body=request_body,
            response_body=safe_json_serialize(response_data),
            latency_ms=latency_ms,
            status_code=status_code,
            error_message=error_message,
            is_success=(status_code < 400),
            client_ip=client_ip,
            user_agent=user_agent,
            prompt_id=prompt_id,
            prompt_version_id=prompt_version_id
        )

        session.add(log_entry)
        await session.commit()

    except Exception as e:
        # Don't fail the request if logging fails
        print(f"Failed to log API request: {e}")
        pass


async def get_user_from_api_key(
        api_key: ProductAPIKey,
        session: AsyncSession
) -> User:
    """
    Get the user associated with the API key and validate user status
    """
    stmt = select(User).where(
        and_(
            User.id == api_key.user_id,
            User.is_active == True
        )
    )
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is invalid: associated user not found or inactive"
        )

    return user
