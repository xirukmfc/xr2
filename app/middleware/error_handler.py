"""
Error Handler Middleware
Handles various runtime errors including client disconnection
"""
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.requests import Request

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle common errors gracefully
    """

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response

        except RuntimeError as e:
            error_msg = str(e)

            # Handle client disconnection
            if "Unexpected message received" in error_msg:
                logger.warning(
                    f"Client disconnected during request: "
                    f"{request.method} {request.url.path}"
                )
                # Return 499 (Client Closed Request) - nginx convention
                return JSONResponse(
                    status_code=499,
                    content={
                        "detail": "Client closed connection",
                        "error": "client_disconnected"
                    }
                )

            # Handle other runtime errors
            logger.error(
                f"Runtime error in {request.method} {request.url.path}: {error_msg}"
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error": "runtime_error"
                }
            )

        except Exception as e:
            # Catch-all for unexpected errors
            logger.exception(
                f"Unhandled exception in {request.method} {request.url.path}: {str(e)}"
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error": "unhandled_exception"
                }
            )
