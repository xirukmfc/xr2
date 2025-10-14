"""
Rate limiting middleware to prevent abuse of API endpoints
"""
import time
from collections import defaultdict, deque
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter using sliding window"""

    def __init__(self):
        # Store request timestamps per IP
        self.requests: Dict[str, deque] = defaultdict(lambda: deque())

    def is_allowed(self, ip: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Check if request is allowed and return (allowed, remaining_requests)
        """
        now = time.time()
        window_start = now - window_seconds

        # Clean old requests outside the window
        ip_requests = self.requests[ip]
        while ip_requests and ip_requests[0] < window_start:
            ip_requests.popleft()

        # Check if we're under the limit
        current_requests = len(ip_requests)
        if current_requests >= max_requests:
            return False, 0

        # Add current request
        ip_requests.append(now)
        remaining = max_requests - (current_requests + 1)

        return True, remaining


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for FastAPI"""

    def __init__(self, app, limiter: RateLimiter = None):
        super().__init__(app)
        self.limiter = limiter or RateLimiter()

        # Rate limits per endpoint pattern (requests, window_seconds)
        self.limits = {
            '/internal/stats/counts': (30, 300),  # 30 requests per 5 minutes for stats
            '/internal/auth/': (20, 60),          # 20 auth requests per minute (for development)
            '/internal/keys-for-external-use': (50, 300),  # 50 API key operations per 5 minutes
            'default': (200, 300),                # Default: 200 requests per 5 minutes
        }

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Try to get real IP from headers (for reverse proxy setups)
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()

        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip

        # Fallback to client host
        return request.client.host if request.client else '127.0.0.1'

    def is_internal_ip(self, ip: str) -> bool:
        """Check if IP is from internal network (Docker, localhost, etc.)"""
        if not ip:
            return False

        # Common internal/private IP ranges
        internal_patterns = [
            '127.',         # localhost
            '172.16.',      # Docker default network
            '172.17.',      # Docker default network
            '172.18.',      # Docker custom network
            '172.19.',      # Docker custom network
            '172.20.',      # Docker custom network
            '172.21.',      # Docker custom network
            '192.168.',     # Private network / Docker host
            '10.',          # Private network
            'localhost',    # localhost hostname
        ]

        return any(ip.startswith(pattern) for pattern in internal_patterns)

    def get_rate_limit(self, path: str) -> Tuple[int, int]:
        """Get rate limit for specific path"""
        for pattern, limit in self.limits.items():
            if pattern == 'default':
                continue
            if path.startswith(pattern):
                return limit
        return self.limits['default']

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with rate limiting"""
        client_ip = self.get_client_ip(request)
        path = request.url.path

        # Skip rate limiting for certain paths, internal IPs, or in development mode
        if (path.startswith('/internal/admin/') or
            path.startswith('/health') or
            path.startswith('/docs') or
            path.startswith('/redoc') or
            self.is_internal_ip(client_ip)):  # Skip for internal networks (Docker, localhost, etc.)
            return await call_next(request)

        max_requests, window_seconds = self.get_rate_limit(path)
        allowed, remaining = self.limiter.is_allowed(client_ip, max_requests, window_seconds)

        if not allowed:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on path {path}")
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Max {max_requests} per {window_seconds} seconds.",
                    "retry_after": window_seconds
                }
            )

        # Process the request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Window"] = str(window_seconds)

        return response


# Global rate limiter instance
rate_limiter = RateLimiter()