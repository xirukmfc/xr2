"""
Public API endpoint for pricing information.
No authentication required - used by landing page.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
import json

from app.core.database import get_session
from app.models.pricing import PricingConfig

router = APIRouter()


class PricingPlanResponse(BaseModel):
    """Response model for a single pricing plan."""
    plan_name: str
    price_display: str  # Localized price display
    period_display: str  # Localized period display
    features: List[str]  # Localized features list

    class Config:
        from_attributes = True


class PricingResponse(BaseModel):
    """Response model for all pricing plans."""
    plans: List[PricingPlanResponse]
    locale: str


@router.get("/pricing", response_model=PricingResponse, tags=["public"])
async def get_pricing(
    locale: str = "en",
    session: AsyncSession = Depends(get_session)
):
    """
    Get pricing information for all plans.

    - locale: 'en' for English (USD), 'ru' for Russian (RUB)
    """
    result = await session.execute(
        select(PricingConfig)
        .where(PricingConfig.is_active == True)
        .order_by(PricingConfig.sort_order)
    )
    configs = result.scalars().all()

    plans = []
    for config in configs:
        # Select localized values
        if locale == "ru":
            price_display = config.price_rub_display
            period_display = config.billing_period_ru or "/мес"
            features_json = config.features_ru
        else:
            price_display = config.price_usd_display
            period_display = config.billing_period_en or "/month"
            features_json = config.features_en

        # Parse features JSON
        try:
            features = json.loads(features_json) if features_json else []
        except (json.JSONDecodeError, TypeError):
            features = []

        plans.append(PricingPlanResponse(
            plan_name=config.plan_name,
            price_display=price_display,
            period_display=period_display,
            features=features
        ))

    return PricingResponse(plans=plans, locale=locale)
