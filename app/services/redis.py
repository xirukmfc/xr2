import redis.asyncio as redis
from app.core.config import settings
import json
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)


class RedisClient:
    def __init__(self):
        self._client = None

    async def connect(self):
        """Establish connection to Redis"""
        try:
            self._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            await self._client.ping()
            logger.info(f"Successfully connected to Redis at {settings.REDIS_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        """Close Redis connection"""
        if self._client:
            await self._client.close()
            logger.info("Redis connection closed")

    async def setex(self, key: str, ttl: int, value: Any):
        """Set key with expiration time"""
        if not self._client:
            await self.connect()

        if isinstance(value, (dict, list)):
            value = json.dumps(value)

        return await self._client.setex(key, ttl, value)

    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        if not self._client:
            await self.connect()

        return await self._client.get(key)

    async def delete(self, key: str) -> int:
        """Delete key"""
        if not self._client:
            await self.connect()

        return await self._client.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self._client:
            await self.connect()

        return bool(await self._client.exists(key))

    async def sadd(self, key: str, *values) -> int:
        """Add values to a set"""
        if not self._client:
            await self.connect()

        return await self._client.sadd(key, *values)

    async def scard(self, key: str) -> int:
        """Get the number of members in a set"""
        if not self._client:
            await self.connect()

        return await self._client.scard(key)

    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration time for a key"""
        if not self._client:
            await self.connect()

        return await self._client.expire(key, ttl)


# Global Redis client instance
redis_client = RedisClient()