from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, timedelta, timezone

from app.core.database import get_session
from app.models.product_api_key import ProductAPIKey, ProductAPILog
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/logs", tags=["api usage logs"])


class ProductAPILogResponse(BaseModel):
    """Response model for product API logs"""
    id: str
    api_key_id: str
    api_key_name: str
    request_id: Optional[str]
    endpoint: str
    method: str
    request_params: dict
    request_body: Optional[dict]
    response_body: Optional[dict]
    latency_ms: Optional[int]
    status_code: int
    error_message: Optional[str]
    is_success: bool
    client_ip: Optional[str]
    user_agent: Optional[str]
    created_at: datetime


class ProductAPILogListResponse(BaseModel):
    """Response model for paginated logs list"""
    logs: List[ProductAPILogResponse]
    total: int
    page: int
    per_page: int
    pages: int


class ProductAPILogStats(BaseModel):
    """Statistics about API usage"""
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_latency_ms: float
    requests_by_status: dict
    requests_by_endpoint: dict
    requests_by_api_key: dict


@router.get("/", response_model=ProductAPILogListResponse)
async def get_product_api_logs(
    # Filtering parameters
    api_key_id: Optional[str] = Query(None, description="Filter by API key ID"),
    status_code: Optional[int] = Query(None, description="Filter by HTTP status code"),
    endpoint: Optional[str] = Query(None, description="Filter by endpoint path"),
    method: Optional[str] = Query(None, description="Filter by HTTP method"),
    is_success: Optional[bool] = Query(None, description="Filter by success status"),
    date_from: Optional[datetime] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[datetime] = Query(None, description="Filter to date (ISO format)"),
    
    # Pagination parameters
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    
    # Dependencies
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get product API logs for the current user
    
    This endpoint allows you to view all API requests made with your product API keys
    with various filtering options for monitoring and analytics.
    """
    try:
        # Base query - only show logs for user's API keys
        stmt = select(ProductAPILog).join(ProductAPIKey).where(
            ProductAPIKey.user_id == current_user.id
        )
        
        # Apply filters
        if api_key_id:
            try:
                key_uuid = UUID(api_key_id)
                stmt = stmt.where(ProductAPILog.api_key_id == key_uuid)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid API key ID format"
                )
        
        if status_code:
            stmt = stmt.where(ProductAPILog.status_code == status_code)
        
        if endpoint:
            stmt = stmt.where(ProductAPILog.endpoint.ilike(f"%{endpoint}%"))
        
        if method:
            stmt = stmt.where(ProductAPILog.method == method.upper())
        
        if is_success is not None:
            stmt = stmt.where(ProductAPILog.is_success == is_success)
        
        if date_from:
            stmt = stmt.where(ProductAPILog.created_at >= date_from)
        
        if date_to:
            stmt = stmt.where(ProductAPILog.created_at <= date_to)
        
        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await session.execute(count_stmt)
        total = total_result.scalar()
        
        # Apply pagination and ordering
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(desc(ProductAPILog.created_at))
        
        # Execute query with API key relationship
        result = await session.execute(
            stmt.options(selectinload(ProductAPILog.api_key))
        )
        logs = result.scalars().all()
        
        # Convert to response format
        log_responses = []
        for log in logs:
            log_response = ProductAPILogResponse(
                id=str(log.id),
                api_key_id=str(log.api_key_id),
                api_key_name=log.api_key.name if log.api_key else "Unknown",
                request_id=log.request_id or "",
                endpoint=log.endpoint,
                method=log.method,
                request_params=log.request_params or {},
                request_body=log.request_body,
                response_body=log.response_body,
                latency_ms=log.latency_ms or 0,
                status_code=log.status_code,
                error_message=log.error_message,
                is_success=log.is_success,
                client_ip=log.client_ip or "",
                user_agent=log.user_agent,
                created_at=log.created_at
            )
            log_responses.append(log_response)
        
        # Create paginated response
        pages = (total + per_page - 1) // per_page
        response = ProductAPILogListResponse(
            logs=log_responses,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving logs: {str(e)}"
        )


@router.get("/stats", response_model=ProductAPILogStats)
async def get_product_api_stats(
    # Time range parameters
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    api_key_id: Optional[str] = Query(None, description="Filter by specific API key ID"),
    
    # Dependencies
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about product API usage
    
    Returns aggregated statistics for monitoring and analytics purposes.
    """
    try:
        # Calculate date range
        date_from = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Base query - only user's API keys
        base_stmt = select(ProductAPILog).join(ProductAPIKey).where(
            and_(
                ProductAPIKey.user_id == current_user.id,
                ProductAPILog.created_at >= date_from
            )
        )
        
        # Apply API key filter if provided
        if api_key_id:
            try:
                key_uuid = UUID(api_key_id)
                base_stmt = base_stmt.where(ProductAPILog.api_key_id == key_uuid)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid API key ID format"
                )
        
        # Get all logs for the period
        result = await session.execute(
            base_stmt.options(selectinload(ProductAPILog.api_key))
        )
        logs = result.scalars().all()
        
        if not logs:
            return ProductAPILogStats(
                total_requests=0,
                successful_requests=0,
                failed_requests=0,
                avg_latency_ms=0.0,
                requests_by_status={},
                requests_by_endpoint={},
                requests_by_api_key={}
            )
        
        # Calculate statistics
        total_requests = len(logs)
        successful_requests = len([log for log in logs if log.is_success])
        failed_requests = total_requests - successful_requests
        
        # Calculate average latency
        total_latency = sum(log.latency_ms for log in logs if log.latency_ms)
        avg_latency_ms = total_latency / len([log for log in logs if log.latency_ms]) if logs else 0.0
        
        # Group by status code
        requests_by_status = {}
        for log in logs:
            status_str = str(log.status_code)
            requests_by_status[status_str] = requests_by_status.get(status_str, 0) + 1
        
        # Group by endpoint
        requests_by_endpoint = {}
        for log in logs:
            endpoint = log.endpoint
            requests_by_endpoint[endpoint] = requests_by_endpoint.get(endpoint, 0) + 1
        
        # Group by API key
        requests_by_api_key = {}
        for log in logs:
            key_name = log.api_key.name if log.api_key else "Unknown"
            requests_by_api_key[key_name] = requests_by_api_key.get(key_name, 0) + 1
        
        return ProductAPILogStats(
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            avg_latency_ms=round(avg_latency_ms, 2),
            requests_by_status=requests_by_status,
            requests_by_endpoint=requests_by_endpoint,
            requests_by_api_key=requests_by_api_key
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving statistics: {str(e)}"
        )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_product_api_logs(
    # Filtering parameters for selective deletion
    api_key_id: Optional[str] = Query(None, description="Delete logs for specific API key only"),
    older_than_days: int = Query(30, ge=1, description="Delete logs older than X days"),
    
    # Dependencies
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Clear product API logs
    
    Allows users to clean up old logs to manage storage and maintain privacy.
    By default, deletes logs older than 30 days.
    """
    try:
        # Calculate cutoff date
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=older_than_days)
        
        # Base delete query - only user's API keys
        stmt = select(ProductAPILog.id).join(ProductAPIKey).where(
            and_(
                ProductAPIKey.user_id == current_user.id,
                ProductAPILog.created_at < cutoff_date
            )
        )
        
        # Apply API key filter if provided
        if api_key_id:
            try:
                key_uuid = UUID(api_key_id)
                stmt = stmt.where(ProductAPILog.api_key_id == key_uuid)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid API key ID format"
                )
        
        # Get IDs to delete
        result = await session.execute(stmt)
        log_ids = [row[0] for row in result.fetchall()]
        
        if log_ids:
            # Delete the logs
            delete_stmt = select(ProductAPILog).where(ProductAPILog.id.in_(log_ids))
            delete_result = await session.execute(delete_stmt)
            logs_to_delete = delete_result.scalars().all()
            
            for log in logs_to_delete:
                await session.delete(log)
            
            await session.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing logs: {str(e)}"
        )
