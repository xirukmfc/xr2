import time
import asyncio
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

SAFE_PATHS = {
    "/",
    "/health",
    "/docs", "/redoc", "/openapi.json",
    "/admin-docs", "/admin-docs/", "/admin-docs/openapi.json",
}


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Комплексный middleware для защиты от DDoS, брутфорса и других атак
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.redis_client = None
        self.request_counts: Dict[str, Dict[str, int]] = {}
        self.blocked_ips: Dict[str, float] = {}
        
        # Настройки защиты
        self.max_requests_per_minute = int(getattr(settings, 'MAX_REQUESTS_PER_IP_PER_MINUTE', 100))
        self.max_requests_per_api_key = int(getattr(settings, 'MAX_REQUESTS_PER_API_KEY_PER_MINUTE', 1000))
        self.block_duration = 300  # 5 минут блокировки
        self.cleanup_interval = 60  # Очистка каждую минуту
        
        # Запускаем периодическую очистку
        asyncio.create_task(self._periodic_cleanup())
    
    async def _get_redis_client(self):
        """Получение Redis клиента"""
        if not self.redis_client:
            try:
                self.redis_client = redis.from_url(
                    getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0'),
                    decode_responses=True
                )
            except Exception as e:
                logger.warning(f"Redis недоступен: {e}")
                self.redis_client = None
        return self.redis_client
    
    async def _periodic_cleanup(self):
        """Периодическая очистка старых записей"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                current_time = time.time()
                
                # Очистка заблокированных IP
                expired_ips = [
                    ip for ip, block_time in self.blocked_ips.items()
                    if current_time - block_time > self.block_duration
                ]
                for ip in expired_ips:
                    del self.blocked_ips[ip]
                
                # Очистка счетчиков запросов
                expired_requests = []
                for key, data in self.request_counts.items():
                    if current_time - data.get('first_request', 0) > 60:
                        expired_requests.append(key)
                
                for key in expired_requests:
                    del self.request_counts[key]
                    
            except Exception as e:
                logger.error(f"Ошибка при очистке: {e}")
    
    def _get_client_ip(self, request: Request) -> str:
        """Получение реального IP клиента"""
        # Проверяем заголовки прокси
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _get_api_key(self, request: Request) -> Optional[str]:
        """Извлечение API ключа из заголовков"""
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            return authorization[7:]
        return None
    
    def _is_suspicious_request(self, request: Request) -> bool:
        """Проверка на подозрительные запросы"""
        # Skip security checks for localhost in development
        client_ip = self._get_client_ip(request)
        if client_ip in ['127.0.0.1', 'localhost', '::1']:
            return False
            
        user_agent = request.headers.get("User-Agent", "").lower()
        
        # Подозрительные User-Agent
        suspicious_patterns = [
            "sqlmap", "nikto", "nmap", "masscan", "zap", "burp",
            "wget", "curl", "python-requests", "bot", "crawler",
            "scanner", "exploit", "hack"
        ]
        
        for pattern in suspicious_patterns:
            if pattern in user_agent:
                return True
        
        # Пустой User-Agent
        if not user_agent:
            return True
        
        # Подозрительные пути
        suspicious_paths = [
            "/.env", "/config", "/wp-admin", "/phpmyadmin",
            "/.git", "/.svn", "/backup", "/test", "/debug"
        ]
        
        for path in suspicious_paths:
            if path in request.url.path:
                return True
        
        return False
    
    async def _check_rate_limit(self, request: Request) -> bool:
        """Проверка лимитов запросов"""
        client_ip = self._get_client_ip(request)
        api_key = self._get_api_key(request)
        current_time = time.time()
        
        # Проверка блокировки IP
        if client_ip in self.blocked_ips:
            block_time = self.blocked_ips[client_ip]
            if current_time - block_time < self.block_duration:
                return False
            else:
                del self.blocked_ips[client_ip]
        
        # Проверка Redis (если доступен)
        redis_client = await self._get_redis_client()
        if redis_client:
            try:
                # Лимит по IP
                ip_key = f"rate_limit:ip:{client_ip}"
                ip_count = await redis_client.incr(ip_key)
                if ip_count == 1:
                    await redis_client.expire(ip_key, 60)
                
                if ip_count > self.max_requests_per_minute:
                    # Блокируем IP
                    self.blocked_ips[client_ip] = current_time
                    await redis_client.setex(f"blocked_ip:{client_ip}", self.block_duration, "1")
                    return False
                
                # Лимит по API ключу
                if api_key:
                    api_key_key = f"rate_limit:api_key:{api_key}"
                    api_count = await redis_client.incr(api_key_key)
                    if api_count == 1:
                        await redis_client.expire(api_key_key, 60)
                    
                    if api_count > self.max_requests_per_api_key:
                        return False
                        
            except Exception as e:
                logger.warning(f"Ошибка Redis: {e}")
        
        # Fallback на локальное хранение
        else:
            # Лимит по IP
            ip_key = f"ip:{client_ip}"
            if ip_key not in self.request_counts:
                self.request_counts[ip_key] = {
                    'count': 0,
                    'first_request': current_time
                }
            
            data = self.request_counts[ip_key]
            if current_time - data['first_request'] > 60:
                data['count'] = 0
                data['first_request'] = current_time
            
            data['count'] += 1
            
            if data['count'] > self.max_requests_per_minute:
                self.blocked_ips[client_ip] = current_time
                return False
            
            # Лимит по API ключу
            if api_key:
                api_key_key = f"api_key:{api_key}"
                if api_key_key not in self.request_counts:
                    self.request_counts[api_key_key] = {
                        'count': 0,
                        'first_request': current_time
                    }
                
                api_data = self.request_counts[api_key_key]
                if current_time - api_data['first_request'] > 60:
                    api_data['count'] = 0
                    api_data['first_request'] = current_time
                
                api_data['count'] += 1
                
                if api_data['count'] > self.max_requests_per_api_key:
                    return False
        
        return True
    
    async def dispatch(self, request: Request, call_next):
        """Основная логика middleware"""
        try:
            # Skip security checks for health endpoint
            path = request.url.path
            # пускаем служебные пути без проверок
            if path in SAFE_PATHS or any(path.startswith(p) for p in ("/docs/", "/admin-docs/")):
                return await call_next(request)

            # Проверка на подозрительные запросы
            if self._is_suspicious_request(request):
                logger.warning(f"Подозрительный запрос от {self._get_client_ip(request)}: {path}")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Access denied"}
                )
            
            # Проверка лимитов запросов
            if not await self._check_rate_limit(request):
                client_ip = self._get_client_ip(request)
                logger.warning(f"Превышен лимит запросов для IP: {client_ip}")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Too many requests",
                        "retry_after": self.block_duration
                    },
                    headers={"Retry-After": str(self.block_duration)}
                )
            
            # Добавляем заголовки безопасности
            response = await call_next(request)
            
            # Заголовки безопасности
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            
            # Логирование подозрительной активности
            if response.status_code >= 400:
                client_ip = self._get_client_ip(request)
                logger.warning(f"HTTP {response.status_code} от {client_ip}: {path}")
            
            return response
            
        except Exception as e:
            logger.error(f"Ошибка в SecurityMiddleware: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error"}
            )

