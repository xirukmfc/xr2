"""Webhook endpoints for payment gateway integrations"""

import logging
from fastapi import APIRouter, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.core.database import AsyncSessionLocal
from app.services.subscription import SubscriptionService
from app.services.yookassa import yookassa_service
from app.services.lemonsqueezy import lemonsqueezy_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


class YooKassaWebhookPayload(BaseModel):
    """YooKassa webhook notification payload"""
    type: str  # notification type
    event: str  # event type (payment.succeeded, payment.canceled, etc.)
    object: Dict[str, Any]  # payment/refund object


class WebhookResponse(BaseModel):
    """Standard webhook response"""
    status: str
    message: str


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxy headers"""
    # Check for forwarded headers (nginx proxy)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip

    # Fallback to direct client IP
    if request.client:
        return request.client.host

    return ""


@router.post("/yookassa", response_model=WebhookResponse)
async def yookassa_webhook(request: Request):
    """
    Handle YooKassa webhook notifications

    YooKassa sends notifications about payment status changes:
    - payment.succeeded: Payment completed successfully
    - payment.canceled: Payment was canceled
    - payment.waiting_for_capture: Payment awaiting capture (not used - we auto-capture)
    - refund.succeeded: Refund was completed

    Webhook IP verification ensures requests come from YooKassa servers.
    Idempotent processing via webhook_id prevents duplicate processing.
    """
    # Get client IP for verification
    client_ip = get_client_ip(request)

    # Verify webhook IP (skip in test mode for local development)
    if not yookassa_service.test_mode:
        if not yookassa_service.verify_webhook_ip(client_ip):
            logger.warning(f"YooKassa webhook from unauthorized IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized IP address"
            )

    # Parse request body
    try:
        body = await request.json()
        logger.info(f"YooKassa webhook raw body: {body}")
    except Exception as e:
        logger.error(f"Failed to parse YooKassa webhook body: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON body"
        )

    # Extract webhook data
    # YooKassa sends: {"type": "notification", "event": "payment.succeeded", "object": {...}}
    event_type = body.get("event")
    payment_object = body.get("object", {})

    if not event_type:
        logger.error(f"Invalid YooKassa webhook format - missing event: {body}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid webhook format: missing 'event' field. Received keys: {list(body.keys())}"
        )

    if not payment_object:
        logger.error(f"Invalid YooKassa webhook format - missing object: {body}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook format: missing 'object' field"
        )

    # Generate webhook ID for idempotency
    # YooKassa includes payment.id and status, which together are unique per notification
    payment_id = payment_object.get("id", "")
    payment_status = payment_object.get("status", "")
    webhook_id = f"{event_type}:{payment_id}:{payment_status}"

    logger.info(f"YooKassa webhook received: {event_type} for payment {payment_id}")

    # Process webhook
    async with AsyncSessionLocal() as session:
        try:
            service = SubscriptionService(session)
            result = await service.process_yookassa_webhook(
                event_type=event_type,
                payment_data=payment_object,
                webhook_id=webhook_id
            )
            await session.commit()

            return WebhookResponse(
                status=result.get("status", "processed"),
                message=result.get("message", "Webhook processed")
            )

        except Exception as e:
            await session.rollback()
            logger.error(f"Error processing YooKassa webhook: {e}")
            # Return 200 to prevent YooKassa from retrying
            # Log error for manual investigation
            return WebhookResponse(
                status="error",
                message=f"Processing error: {str(e)}"
            )


@router.post("/lemonsqueezy", response_model=WebhookResponse)
async def lemonsqueezy_webhook(request: Request):
    """
    Handle LemonSqueezy webhook notifications

    LemonSqueezy sends notifications about subscription events:
    - subscription_created: New subscription created
    - subscription_updated: Subscription status changed
    - subscription_cancelled: Subscription cancelled
    - subscription_resumed: Subscription resumed
    - subscription_expired: Subscription expired
    - subscription_payment_success: Renewal payment successful
    - subscription_payment_failed: Payment failed
    - order_created: New order created
    - order_refunded: Order was refunded

    Signature verification ensures requests come from LemonSqueezy.
    """
    # Get raw body for signature verification
    raw_body = await request.body()

    # Get signature from header
    signature = request.headers.get("x-signature", "")

    # Verify signature (skip in test mode for local development)
    if not lemonsqueezy_service.test_mode:
        if not lemonsqueezy_service.verify_webhook_signature(raw_body, signature):
            logger.warning("Invalid LemonSqueezy webhook signature")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid signature"
            )

    # Parse request body
    try:
        body = await request.json()
        logger.info(f"LemonSqueezy webhook raw body: {body}")
    except Exception as e:
        logger.error(f"Failed to parse LemonSqueezy webhook body: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON body"
        )

    # Extract webhook data
    # LemonSqueezy sends: {"meta": {"event_name": "...", "custom_data": {...}}, "data": {...}}
    meta = body.get("meta", {})
    event_name = meta.get("event_name")
    custom_data = meta.get("custom_data", {})
    event_data = body.get("data", {})

    if not event_name:
        logger.error(f"Invalid LemonSqueezy webhook format - missing event_name: {body}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook format: missing 'meta.event_name' field"
        )

    # Generate webhook ID for idempotency
    # Use event ID from data if available, otherwise generate from event details
    data_id = event_data.get("id", "")
    webhook_id = f"ls:{event_name}:{data_id}"

    logger.info(f"LemonSqueezy webhook received: {event_name} for data {data_id}")

    # Process webhook
    async with AsyncSessionLocal() as session:
        try:
            service = SubscriptionService(session)
            result = await service.process_lemonsqueezy_webhook(
                event_name=event_name,
                event_data=event_data,
                custom_data=custom_data,
                webhook_id=webhook_id
            )
            await session.commit()

            return WebhookResponse(
                status=result.get("status", "processed"),
                message=result.get("message", "Webhook processed")
            )

        except Exception as e:
            await session.rollback()
            logger.error(f"Error processing LemonSqueezy webhook: {e}")
            # Return 200 to prevent LemonSqueezy from retrying
            return WebhookResponse(
                status="error",
                message=f"Processing error: {str(e)}"
            )
