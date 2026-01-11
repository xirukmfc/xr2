from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
import time
import json
import uuid
from typing import Dict, Any, Optional
import random

from app.models.product_api_key import ProductAPIKey, ProductAPILog
from app.core.product_auth import safe_json_serialize


class ProductAPILoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all product API requests, including validation errors"""
    
    async def dispatch(self, request: Request, call_next):
        # Only log requests to /api/v1/ endpoints
        if not request.url.path.startswith("/api/v1/"):
            response = await call_next(request)
            return response
            
        start_time = time.perf_counter()
        
        # Read request body for logging
        # Note: request.body() caches the body, so it's safe to call multiple times
        request_body = None
        try:
            body_bytes = await request.body()
            request_body = json.loads(body_bytes) if body_bytes else None
        except Exception:
            request_body = None
        
        # Extract API key from Authorization header
        api_key = None
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            api_key_value = auth_header[7:]
            
            # Get API key from database
            async with AsyncSession(bind=request.app.state.db_engine) as session:
                try:
                    from sqlalchemy import select
                    key_hash = ProductAPIKey.hash_key(api_key_value)
                    stmt = select(ProductAPIKey).where(ProductAPIKey.key_hash == key_hash)
                    result = await session.execute(stmt)
                    api_key = result.scalar_one_or_none()
                except Exception as e:
                    print(f"Error getting API key: {e}")
        
        # Process the request
        response = None
        error_message = None
        status_code = 500  # Default in case of exception
        response_body = None

        try:
            response = await call_next(request)
            status_code = response.status_code

            # Read response body for logging
            response_body_bytes = None
            original_headers = dict(response.headers) if hasattr(response, 'headers') else {}
            original_media_type = getattr(response, 'media_type', 'application/json')
            
            try:
                # For StreamingResponse (which is what FastAPI uses), read body_iterator
                if hasattr(response, 'body_iterator'):
                    response_body_bytes = b""
                    async for chunk in response.body_iterator:
                        response_body_bytes += chunk
                    
                    # Try to parse as JSON
                    if response_body_bytes:
                        try:
                            response_body = json.loads(response_body_bytes.decode('utf-8'))
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            # If not JSON, store as string
                            response_body = response_body_bytes.decode('utf-8', errors='replace')
                    
                    # Recreate response with the body we read
                    from starlette.responses import Response
                    response = Response(
                        content=response_body_bytes,
                        status_code=status_code,
                        headers=original_headers,
                        media_type=original_media_type
                    )
                # For non-streaming responses, read body directly
                elif hasattr(response, 'body'):
                    body_bytes = response.body
                    if body_bytes:
                        try:
                            response_body = json.loads(body_bytes.decode('utf-8'))
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            response_body = body_bytes.decode('utf-8', errors='replace')
                else:
                    # If we can't read the body, log a warning
                    print(f"[WARNING] Cannot read response body for {request.method} {request.url.path} - response type: {type(response)}")
            except Exception as e:
                print(f"Error reading response body: {e}")
                import traceback
                print(traceback.format_exc())
                # If we can't read the body, continue without it
                # But still try to recreate response if we consumed it
                if response_body_bytes:
                    from starlette.responses import Response
                    response = Response(
                        content=response_body_bytes,
                        status_code=status_code,
                        headers=original_headers,
                        media_type=original_media_type
                    )

            # Extract error message from headers if available
            # (Some frameworks set error details in headers)
            if status_code >= 400:
                error_message = f"HTTP {status_code}"
                # Try to extract error from response body if available
                if response_body and isinstance(response_body, dict):
                    if 'detail' in response_body:
                        if isinstance(response_body['detail'], str):
                            error_message = response_body['detail']
                        elif isinstance(response_body['detail'], dict) and 'message' in response_body['detail']:
                            error_message = response_body['detail']['message']
                    elif 'message' in response_body:
                        error_message = response_body['message']

            # Log the request with response body
            await self._log_request(
                request=request,
                api_key=api_key,
                request_body=request_body,
                response_body=response_body,
                status_code=status_code,
                start_time=start_time,
                error_message=error_message
            )

            return response

        except Exception as e:
            # Log failed requests
            error_message = str(e)
            await self._log_request(
                request=request,
                api_key=api_key,
                request_body=request_body,
                response_body=None,
                status_code=status_code,
                start_time=start_time,
                error_message=error_message
            )
            raise
    
    async def _log_request(
        self,
        request: Request,
        api_key: Optional[ProductAPIKey],
        request_body: Optional[Dict[str, Any]],
        response_body: Optional[Dict[str, Any]],
        status_code: int,
        start_time: float,
        error_message: Optional[str] = None
    ):
        """Log the API request to database"""
        if not api_key:
            # Can't log without API key
            return

        # Check if this request was already logged (prevent duplicates)
        if hasattr(request.state, '_api_logged') and request.state._api_logged:
            print(f"[WARNING] Duplicate log attempt prevented for {request.method} {request.url.path}")
            return

        # Mark request as logged
        request.state._api_logged = True

        try:
            async with AsyncSession(bind=request.app.state.db_engine) as session:
                # Calculate latency with high precision
                end_time = time.perf_counter()
                latency_seconds = end_time - start_time
                # Use higher precision and add microsecond precision to avoid identical values
                latency_ms = round(latency_seconds * 1000, 3)
                # Convert to int with microsecond precision (multiply by 1000 to get microseconds)
                latency_ms_int = int(latency_seconds * 1000000) // 1000  # This preserves microsecond precision

                # Generate unique request ID
                request_id = str(uuid.uuid4())

                # Extract request information
                endpoint = str(request.url.path)
                method = request.method
                request_params = safe_json_serialize(dict(request.query_params))

                # Get client information
                client_ip = request.client.host if request.client else "unknown"
                user_agent = request.headers.get("user-agent", "unknown")

                # Get metadata from request.state if available
                prompt_id = getattr(request.state, 'prompt_id', None)
                prompt_version_id = getattr(request.state, 'prompt_version_id', None)
                trace_id = getattr(request.state, 'trace_id', None)

                # Create log entry
                log_entry = ProductAPILog(
                    api_key_id=api_key.id,
                    request_id=request_id,
                    trace_id=trace_id,
                    endpoint=endpoint,
                    method=method,
                    request_params=request_params,
                    request_body=safe_json_serialize(request_body),
                    response_body=safe_json_serialize(response_body),
                    latency_ms=latency_ms_int,
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
            # Log errors silently - they're already handled by the application logger
            pass
