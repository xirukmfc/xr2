"""YooKassa payment gateway integration service"""

import httpx
import logging
from typing import Optional, Dict, Any
from uuid import uuid4
import ipaddress

from app.core.config import settings

logger = logging.getLogger(__name__)

# YooKassa API endpoint
YOOKASSA_API_URL = "https://api.yookassa.ru/v3"

# YooKassa webhook IP ranges (for IP verification)
# https://yookassa.ru/developers/using-api/webhooks#ip
YOOKASSA_WEBHOOK_IPS = [
    "185.71.76.0/27",
    "185.71.77.0/27",
    "77.75.153.0/25",
    "77.75.156.11/32",
    "77.75.156.35/32",
    "77.75.154.128/25",
    "2a02:5180::/32",
]


class YooKassaService:
    """Service for interacting with YooKassa payment gateway"""

    def __init__(self):
        self.shop_id = settings.YOOKASSA_SHOP_ID
        self.secret_key = settings.YOOKASSA_SECRET_KEY
        self.test_mode = settings.YOOKASSA_TEST_MODE
        self.return_url = settings.YOOKASSA_RETURN_URL or f"{settings.FRONTEND_URL}/settings"

    @property
    def is_configured(self) -> bool:
        """Check if YooKassa credentials are configured"""
        return bool(self.shop_id and self.secret_key)

    def _get_auth(self) -> tuple:
        """Get HTTP Basic Auth credentials"""
        return (self.shop_id, self.secret_key)

    def _generate_idempotency_key(self) -> str:
        """Generate unique idempotency key for request"""
        return str(uuid4())

    async def create_payment(
        self,
        amount: int,
        currency: str,
        description: str,
        return_url: Optional[str] = None,
        save_payment_method: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
        customer_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a payment in YooKassa

        Args:
            amount: Amount in minor units (kopecks for RUB)
            currency: Currency code (RUB)
            description: Payment description
            return_url: URL to redirect after payment
            save_payment_method: Save card for recurring payments
            metadata: Additional metadata (e.g., transaction_id)
            customer_email: Customer email for receipt (required in live mode)

        Returns:
            Payment object from YooKassa API
        """
        if not self.is_configured:
            raise ValueError("YooKassa is not configured")

        # Convert kopecks to rubles for API
        amount_value = f"{amount / 100:.2f}"

        payload = {
            "amount": {
                "value": amount_value,
                "currency": currency
            },
            "confirmation": {
                "type": "redirect",
                "return_url": return_url or self.return_url
            },
            "capture": True,
            "description": description,
        }

        if save_payment_method:
            payload["save_payment_method"] = True

        # Receipt is required for live payments (54-FZ)
        if customer_email and not self.test_mode:
            payload["receipt"] = {
                "customer": {
                    "email": customer_email
                },
                "items": [
                    {
                        "description": description,
                        "quantity": "1.00",
                        "amount": {
                            "value": amount_value,
                            "currency": currency
                        },
                        "vat_code": 1,
                        "payment_subject": "service",
                        "payment_mode": "full_payment"
                    }
                ]
            }

        if metadata:
            payload["metadata"] = metadata

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{YOOKASSA_API_URL}/payments",
                json=payload,
                auth=self._get_auth(),
                headers={
                    "Idempotence-Key": self._generate_idempotency_key(),
                    "Content-Type": "application/json"
                }
            )

            if response.status_code not in (200, 201):
                logger.error(f"YooKassa create_payment failed: {response.status_code} - {response.text}")
                raise ValueError(f"YooKassa API error: {response.status_code}")

            return response.json()

    async def create_autopayment(
        self,
        payment_method_id: str,
        amount: int,
        currency: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create an autopayment using saved payment method

        Args:
            payment_method_id: Saved payment method ID from YooKassa
            amount: Amount in minor units (kopecks for RUB)
            currency: Currency code (RUB)
            description: Payment description
            metadata: Additional metadata

        Returns:
            Payment object from YooKassa API
        """
        if not self.is_configured:
            raise ValueError("YooKassa is not configured")

        # Convert kopecks to rubles for API
        amount_value = f"{amount / 100:.2f}"

        payload = {
            "amount": {
                "value": amount_value,
                "currency": currency
            },
            "capture": True,
            "description": description,
            "payment_method_id": payment_method_id
        }

        if metadata:
            payload["metadata"] = metadata

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{YOOKASSA_API_URL}/payments",
                json=payload,
                auth=self._get_auth(),
                headers={
                    "Idempotence-Key": self._generate_idempotency_key(),
                    "Content-Type": "application/json"
                }
            )

            if response.status_code not in (200, 201):
                logger.error(f"YooKassa create_autopayment failed: {response.status_code} - {response.text}")
                raise ValueError(f"YooKassa API error: {response.status_code}")

            return response.json()

    async def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Get payment details from YooKassa

        Args:
            payment_id: YooKassa payment ID

        Returns:
            Payment object from YooKassa API
        """
        if not self.is_configured:
            raise ValueError("YooKassa is not configured")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{YOOKASSA_API_URL}/payments/{payment_id}",
                auth=self._get_auth()
            )

            if response.status_code != 200:
                logger.error(f"YooKassa get_payment failed: {response.status_code} - {response.text}")
                raise ValueError(f"YooKassa API error: {response.status_code}")

            return response.json()

    @staticmethod
    def verify_webhook_ip(client_ip: str) -> bool:
        """
        Verify that webhook request comes from YooKassa IP range

        Args:
            client_ip: Client IP address from request

        Returns:
            True if IP is in YooKassa whitelist
        """
        try:
            ip = ipaddress.ip_address(client_ip)

            for ip_range in YOOKASSA_WEBHOOK_IPS:
                network = ipaddress.ip_network(ip_range, strict=False)
                if ip in network:
                    return True

            logger.warning(f"Webhook request from non-YooKassa IP: {client_ip}")
            return False
        except ValueError as e:
            logger.error(f"Invalid IP address format: {client_ip} - {e}")
            return False


# Global service instance
yookassa_service = YooKassaService()
