"""LemonSqueezy payment gateway integration service for USD payments"""

import httpx
import hmac
import hashlib
import logging
from typing import Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# LemonSqueezy API endpoint
LEMONSQUEEZY_API_URL = "https://api.lemonsqueezy.com/v1"


class LemonSqueezyService:
    """Service for interacting with LemonSqueezy payment gateway"""

    def __init__(self):
        self.api_key = settings.LEMONSQUEEZY_API_KEY
        self.store_id = settings.LEMONSQUEEZY_STORE_ID
        self.variant_id = settings.LEMONSQUEEZY_VARIANT_ID
        self.webhook_secret = settings.LEMONSQUEEZY_WEBHOOK_SECRET
        self.test_mode = settings.LEMONSQUEEZY_TEST_MODE
        self.return_url = settings.LEMONSQUEEZY_RETURN_URL or f"{settings.FRONTEND_URL}/settings"

    @property
    def is_configured(self) -> bool:
        """Check if LemonSqueezy credentials are configured"""
        return bool(self.api_key and self.store_id and self.variant_id)

    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json"
        }

    async def create_checkout(
        self,
        user_email: str,
        user_name: Optional[str] = None,
        custom_price: Optional[int] = None,
        custom_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a checkout session in LemonSqueezy

        Args:
            user_email: Customer email for prefilling
            user_name: Customer name for prefilling
            custom_price: Price in cents (if overriding default)
            custom_data: Custom metadata (e.g., user_id, transaction_id)

        Returns:
            Checkout object with URL for redirect
        """
        if not self.is_configured:
            raise ValueError("LemonSqueezy is not configured")

        # Build checkout data
        checkout_data = {
            "email": user_email,
        }

        if user_name:
            checkout_data["name"] = user_name

        if custom_data:
            checkout_data["custom"] = custom_data

        # Build request payload (JSON:API format)
        payload = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": checkout_data,
                    "checkout_options": {
                        "button_color": "#7047EB"
                    },
                    "product_options": {
                        "redirect_url": self.return_url,
                        "receipt_button_text": "Go to Dashboard",
                        "receipt_link_url": self.return_url
                    },
                    "test_mode": self.test_mode
                },
                "relationships": {
                    "store": {
                        "data": {
                            "type": "stores",
                            "id": str(self.store_id)
                        }
                    },
                    "variant": {
                        "data": {
                            "type": "variants",
                            "id": str(self.variant_id)
                        }
                    }
                }
            }
        }

        # Add custom price if specified
        if custom_price:
            payload["data"]["attributes"]["custom_price"] = custom_price

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{LEMONSQUEEZY_API_URL}/checkouts",
                json=payload,
                headers=self._get_headers(),
                timeout=30.0
            )

            if response.status_code not in (200, 201):
                logger.error(f"LemonSqueezy create_checkout failed: {response.status_code} - {response.text}")
                raise ValueError(f"LemonSqueezy API error: {response.status_code} - {response.text}")

            return response.json()

    async def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Get subscription details from LemonSqueezy

        Args:
            subscription_id: LemonSqueezy subscription ID

        Returns:
            Subscription object from LemonSqueezy API
        """
        if not self.is_configured:
            raise ValueError("LemonSqueezy is not configured")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{LEMONSQUEEZY_API_URL}/subscriptions/{subscription_id}",
                headers=self._get_headers(),
                timeout=30.0
            )

            if response.status_code != 200:
                logger.error(f"LemonSqueezy get_subscription failed: {response.status_code} - {response.text}")
                raise ValueError(f"LemonSqueezy API error: {response.status_code}")

            return response.json()

    async def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Cancel a subscription in LemonSqueezy

        Args:
            subscription_id: LemonSqueezy subscription ID

        Returns:
            Updated subscription object
        """
        if not self.is_configured:
            raise ValueError("LemonSqueezy is not configured")

        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{LEMONSQUEEZY_API_URL}/subscriptions/{subscription_id}",
                headers=self._get_headers(),
                timeout=30.0
            )

            if response.status_code != 200:
                logger.error(f"LemonSqueezy cancel_subscription failed: {response.status_code} - {response.text}")
                raise ValueError(f"LemonSqueezy API error: {response.status_code}")

            return response.json()

    async def resume_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Resume a cancelled subscription in LemonSqueezy
        (only works if subscription hasn't expired yet)

        Args:
            subscription_id: LemonSqueezy subscription ID

        Returns:
            Updated subscription object
        """
        if not self.is_configured:
            raise ValueError("LemonSqueezy is not configured")

        payload = {
            "data": {
                "type": "subscriptions",
                "id": str(subscription_id),
                "attributes": {
                    "cancelled": False
                }
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{LEMONSQUEEZY_API_URL}/subscriptions/{subscription_id}",
                json=payload,
                headers=self._get_headers(),
                timeout=30.0
            )

            if response.status_code != 200:
                logger.error(f"LemonSqueezy resume_subscription failed: {response.status_code} - {response.text}")
                raise ValueError(f"LemonSqueezy API error: {response.status_code}")

            return response.json()

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify that webhook request comes from LemonSqueezy

        Args:
            payload: Raw request body bytes
            signature: X-Signature header value

        Returns:
            True if signature is valid
        """
        if not self.webhook_secret:
            logger.warning("LemonSqueezy webhook secret not configured")
            return False

        try:
            # Create HMAC SHA256 hash
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()

            # Compare signatures
            is_valid = hmac.compare_digest(expected_signature, signature)

            if not is_valid:
                logger.warning(f"Invalid LemonSqueezy webhook signature")

            return is_valid
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False


# Global service instance
lemonsqueezy_service = LemonSqueezyService()
