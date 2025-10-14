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
        request_body = None
        try:
            # Read the body once and store it
            body_bytes = await request.body()
            request_body = json.loads(body_bytes) if body_bytes else None
        except Exception:
            request_body = None
        
        # Create a new request object with the body restored
        async def receive():
            return {"type": "http.request", "body": body_bytes, "more_body": False}
        
        # Replace the receive callable
        request._receive = receive
        
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
        try:
            response = await call_next(request)
            
            # Read response body for logging
            response_body = None
            error_message = None
            
            # For streaming responses, we need to read the body
            if hasattr(response, 'body_iterator'):
                # Collect all chunks
                body_chunks = []
                async for chunk in response.body_iterator:
                    body_chunks.append(chunk)
                
                # Reconstruct the body
                body_bytes = b''.join(body_chunks)
                
                # Parse JSON if possible
                try:
                    body_text = body_bytes.decode('utf-8')
                    if body_text:
                        response_body = json.loads(body_text)
                        
                        # Extract error message for failed requests
                        if response.status_code >= 400:
                            if isinstance(response_body, dict):
                                # Check for validation errors (422)
                                if response_body.get('detail') and isinstance(response_body['detail'], list):
                                    errors = response_body['detail']
                                    error_messages = []
                                    for error in errors:
                                        if isinstance(error, dict) and 'msg' in error:
                                            loc = " -> ".join(str(x) for x in error.get('loc', []))
                                            error_messages.append(f"{loc}: {error['msg']}")
                                    error_message = "; ".join(error_messages) if error_messages else json.dumps(response_body.get('detail'))
                                else:
                                    # Use json.dumps instead of str() to get proper JSON formatting
                                    detail = response_body.get('detail', response_body)
                                    error_message = json.dumps(detail) if isinstance(detail, (dict, list)) else str(detail)
                            else:
                                error_message = json.dumps(response_body) if isinstance(response_body, (dict, list)) else str(response_body)
                except Exception as e:
                    response_body = {"error": f"Failed to parse response: {str(e)}"}
                    if response.status_code >= 400:
                        error_message = f"Response parsing failed: {str(e)}"
                
                # Create a new response with the body for return
                from fastapi.responses import Response
                new_response = Response(
                    content=body_bytes,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.headers.get('content-type')
                )
                response = new_response
            
            # Log the request
            await self._log_request(
                request=request,
                api_key=api_key,
                request_body=request_body,
                response_body=response_body,
                status_code=response.status_code,
                start_time=start_time,
                error_message=error_message
            )
            
            return response
            
        except Exception as e:
            # Log failed requests
            error_response = {"error": str(e)}
            await self._log_request(
                request=request,
                api_key=api_key,
                request_body=request_body,
                response_body=error_response,
                status_code=500,
                start_time=start_time,
                error_message=str(e)
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
                
                # Console logging for debugging
                source_name = request_body.get('source_name', 'unknown') if request_body else 'unknown'
                print(f"[EXTERNAL API LOG] User: {api_key.user_id}")
                print(f"[EXTERNAL API LOG] Source: {source_name}")
                print(f"[EXTERNAL API LOG] Endpoint: {endpoint}")
                print(f"[EXTERNAL API LOG] Status: {status_code}")
                print(f"[EXTERNAL API LOG] Latency: {latency_seconds:.3f}s")
                if error_message:
                    print(f"[EXTERNAL API LOG] Error: {error_message}")
                
        except Exception as e:
            print(f"Failed to log API request in middleware: {e}")
