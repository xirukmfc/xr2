"""Subscription API endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

from app.core.database import get_session
from app.core.auth import get_current_user
from app.models.user import User
from app.services.subscription import SubscriptionService


router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


# Pydantic schemas
class UpgradeRequest(BaseModel):
    locale: str = "en"  # 'en' for USD, 'ru' for RUB


class CompleteTransactionRequest(BaseModel):
    payment_method: Optional[str] = None
    external_id: Optional[str] = None


class LimitsInfo(BaseModel):
    max_prompts: int
    max_api_requests_per_month: int


class SubscriptionResponse(BaseModel):
    id: str
    plan: str
    status: str
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    days_remaining: int
    auto_renew: bool
    currency: str
    cancelled_at: Optional[str] = None
    is_active: bool
    limits: LimitsInfo
    is_superuser: bool = False
    payment_provider: Optional[str] = None  # "yookassa" | "lemonsqueezy" | null


class TransactionResponse(BaseModel):
    id: str
    amount: int
    currency: str
    amount_display: str
    status: str
    transaction_type: str
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]


class UpgradeResponse(BaseModel):
    transaction_id: str
    amount: int
    currency: str
    amount_display: str
    status: str
    message: str


class YooKassaUpgradeResponse(BaseModel):
    transaction_id: str
    redirect_url: str
    amount: int
    currency: str
    amount_display: str


class LemonSqueezyUpgradeResponse(BaseModel):
    transaction_id: str
    redirect_url: str
    amount: int
    currency: str
    amount_display: str


class ActionResponse(BaseModel):
    success: bool
    message: str
    period_end: Optional[str] = None
    requires_payment: Optional[bool] = None  # True when subscription expired and needs new payment
    payment_provider: Optional[str] = None  # Provider to use for new payment


class CompleteTransactionResponse(BaseModel):
    success: bool
    message: str
    subscription: dict


@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get current user's subscription with limits"""
    service = SubscriptionService(session)
    subscription_data = await service.get_current_subscription(current_user.id)
    return SubscriptionResponse(**subscription_data)


@router.get("/transactions", response_model=TransactionListResponse)
async def get_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get transaction history for current user"""
    service = SubscriptionService(session)
    transactions = await service.get_transactions(current_user.id, limit=limit, offset=offset)
    return TransactionListResponse(transactions=transactions)


@router.post("/upgrade", response_model=UpgradeResponse)
async def upgrade_to_pro(
    request: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Initiate upgrade to Pro plan
    Creates a pending transaction for manual payment
    """
    service = SubscriptionService(session)
    try:
        result = await service.upgrade_to_pro(current_user.id, locale=request.locale)
        await session.commit()
        return UpgradeResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/cancel", response_model=ActionResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Cancel subscription (disable auto-renew)
    Subscription remains active until period_end
    """
    service = SubscriptionService(session)
    try:
        result = await service.cancel_subscription(current_user.id)
        await session.commit()
        return ActionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/resume", response_model=ActionResponse)
async def resume_subscription(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Resume cancelled subscription (re-enable auto-renew)"""
    service = SubscriptionService(session)
    try:
        result = await service.resume_subscription(current_user.id)
        await session.commit()
        return ActionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/upgrade/yookassa", response_model=YooKassaUpgradeResponse)
async def upgrade_to_pro_yookassa(
    request: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Initiate upgrade to Pro plan via YooKassa
    Returns redirect URL for YooKassa payment page
    """
    service = SubscriptionService(session)
    try:
        result = await service.initiate_yookassa_payment(current_user.id, locale=request.locale)
        await session.commit()
        return YooKassaUpgradeResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/upgrade/lemonsqueezy", response_model=LemonSqueezyUpgradeResponse)
async def upgrade_to_pro_lemonsqueezy(
    request: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Initiate upgrade to Pro plan via LemonSqueezy (USD)
    Returns redirect URL for LemonSqueezy checkout page
    """
    service = SubscriptionService(session)
    try:
        result = await service.initiate_lemonsqueezy_payment(current_user.id, locale=request.locale)
        await session.commit()
        return LemonSqueezyUpgradeResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/transactions/{transaction_id}/complete", response_model=CompleteTransactionResponse)
async def complete_transaction(
    transaction_id: UUID,
    request: CompleteTransactionRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Complete a pending transaction (admin only)
    Activates the subscription
    """
    # Only superusers can complete transactions manually
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can complete transactions",
        )

    service = SubscriptionService(session)
    try:
        result = await service.complete_transaction(
            transaction_id,
            payment_method=request.payment_method,
            external_id=request.external_id,
        )
        await session.commit()
        return CompleteTransactionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
