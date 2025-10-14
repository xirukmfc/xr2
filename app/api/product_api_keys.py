from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

from app.core.database import get_session
from app.models.product_api_key import ProductAPIKey, ProductAPILog
from app.models.user import User
from app.core.auth import get_current_user
from app.services.statistics import StatisticsService

router = APIRouter(prefix="/keys-for-external-use", tags=["keys for external use"])


class ProductAPIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name for the API key")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")


class ProductAPIKeyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Name for the API key")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")


class ProductAPIKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    api_key: str  # Now includes the full API key for visibility
    user_id: str
    total_requests: int
    total_usage: int = 0  # Total usage across all time
    last_used_at: Optional[datetime]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class ProductAPIKeyWithSecret(BaseModel):
    """Response model that includes the secret key (only returned on creation)"""
    id: str
    name: str
    key_prefix: str
    api_key: str  # The actual key - only shown once
    user_id: str
    total_requests: int
    total_usage: int = 0  # Total usage across all time
    last_used_at: Optional[datetime]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


@router.get("/", response_model=List[ProductAPIKeyResponse])
async def get_product_api_keys(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all product API keys for the current user"""
    try:
        stmt = select(ProductAPIKey).where(
            ProductAPIKey.user_id == current_user.id
        ).offset(skip).limit(limit).order_by(ProductAPIKey.created_at.desc())
        
        result = await session.execute(stmt)
        api_keys = result.scalars().all()
        
        # Get total usage statistics for all API keys
        stats_service = StatisticsService(session)
        
        keys_with_stats = []
        for key in api_keys:
            key_data = key.to_dict()
            
            # Get total usage stats across all time
            try:
                # Get count of all logs for this API key
                count_stmt = select(func.count(ProductAPILog.id)).where(
                    ProductAPILog.api_key_id == key.id
                )
                count_result = await session.execute(count_stmt)
                total_usage = count_result.scalar() or 0
                key_data["total_usage"] = total_usage
            except Exception:
                key_data["total_usage"] = 0
            
            keys_with_stats.append(ProductAPIKeyResponse(**key_data))
        
        return keys_with_stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving API keys: {str(e)}"
        )


@router.post("/", response_model=ProductAPIKeyWithSecret, status_code=status.HTTP_201_CREATED)
async def create_product_api_key(
    key_data: ProductAPIKeyCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new product API key"""
    try:
        # Check if user already has a key with this name
        stmt = select(ProductAPIKey).where(
            and_(
                ProductAPIKey.user_id == current_user.id,
                ProductAPIKey.name == key_data.name
            )
        )
        result = await session.execute(stmt)
        existing_key = result.scalar_one_or_none()
        
        if existing_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="API key with this name already exists"
            )
        
        # Generate new API key
        full_key, key_hash, key_prefix, encrypted_key = ProductAPIKey.generate_api_key()

        # Create new API key record
        new_key = ProductAPIKey(
            name=key_data.name,
            description=key_data.description,
            user_id=current_user.id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            encrypted_key=encrypted_key
        )
        
        session.add(new_key)
        await session.commit()
        await session.refresh(new_key)
        
        # Return the key with the secret (only time it's shown)
        response_data = new_key.to_dict()
        response_data["api_key"] = full_key
        response_data["total_usage"] = 0  # New key has no usage
        
        return ProductAPIKeyWithSecret(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating API key: {str(e)}"
        )


@router.get("/{key_id}", response_model=ProductAPIKeyResponse)
async def get_product_api_key(
    key_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific product API key"""
    try:
        stmt = select(ProductAPIKey).where(
            and_(
                ProductAPIKey.id == key_id,
                ProductAPIKey.user_id == current_user.id
            )
        )
        result = await session.execute(stmt)
        api_key = result.scalar_one_or_none()
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return ProductAPIKeyResponse(**api_key.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving API key: {str(e)}"
        )


@router.put("/{key_id}", response_model=ProductAPIKeyResponse)
async def update_product_api_key(
    key_id: UUID,
    key_data: ProductAPIKeyUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a product API key"""
    try:
        stmt = select(ProductAPIKey).where(
            and_(
                ProductAPIKey.id == key_id,
                ProductAPIKey.user_id == current_user.id
            )
        )
        result = await session.execute(stmt)
        api_key = result.scalar_one_or_none()
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        # Check for name conflicts if name is being changed
        if key_data.name and key_data.name != api_key.name:
            stmt = select(ProductAPIKey).where(
                and_(
                    ProductAPIKey.user_id == current_user.id,
                    ProductAPIKey.name == key_data.name,
                    ProductAPIKey.id != key_id
                )
            )
            result = await session.execute(stmt)
            existing_key = result.scalar_one_or_none()
            
            if existing_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="API key with this name already exists"
                )
        
        # Update fields
        update_data = key_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(api_key, field, value)
        
        await session.commit()
        await session.refresh(api_key)
        
        return ProductAPIKeyResponse(**api_key.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating API key: {str(e)}"
        )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_api_key(
    key_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a product API key"""
    try:
        stmt = select(ProductAPIKey).where(
            and_(
                ProductAPIKey.id == key_id,
                ProductAPIKey.user_id == current_user.id
            )
        )
        result = await session.execute(stmt)
        api_key = result.scalar_one_or_none()
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        await session.delete(api_key)
        await session.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting API key: {str(e)}"
        )


@router.get("/{key_id}/logs", response_model=List[dict])
async def get_api_key_logs(
    key_id: UUID,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get logs for a specific API key"""
    try:
        # First verify the key belongs to the user
        stmt = select(ProductAPIKey).where(
            and_(
                ProductAPIKey.id == key_id,
                ProductAPIKey.user_id == current_user.id
            )
        )
        result = await session.execute(stmt)
        api_key = result.scalar_one_or_none()
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        # Get logs for the key
        stmt = select(ProductAPILog).where(
            ProductAPILog.api_key_id == key_id
        ).offset(skip).limit(limit).order_by(ProductAPILog.created_at.desc())
        
        result = await session.execute(stmt)
        logs = result.scalars().all()
        
        return [log.to_dict() for log in logs]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving API key logs: {str(e)}"
        )
