from __future__ import annotations

import asyncio
from typing import Optional

import httpx
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .models import (
    GetPromptRequest,
    PromptContentResponse,
    EventRequest,
    EventResponse,
    CheckAPIKeyResponse,
    Response,
)
from .config import BASE_URL


DEFAULT_TIMEOUT_SECONDS = 10.0


def _parse_error(resp) -> str:
    """Extract error message from response"""
    try:
        data = resp.json()
        detail = data.get("detail", {})
        if isinstance(detail, dict):
            return detail.get("message", str(detail))
        return str(detail)
    except Exception:
        return resp.text or f"HTTP {resp.status_code}"


def _build_requests_session(total_retries: int, backoff_factor: float) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=total_retries,
        read=total_retries,
        connect=total_retries,
        backoff_factor=backoff_factor,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "TRACE", "PATCH"),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


class xR2Client:
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str | None = None,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        total_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        self.base_url = (base_url or BASE_URL).rstrip("/")
        self.timeout = timeout
        self._session = _build_requests_session(total_retries, backoff_factor)
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def check_api_key(self) -> Response[CheckAPIKeyResponse]:
        """Validate the API key and get the username associated with it.

        Returns:
            Response[CheckAPIKeyResponse]: Response containing ok=True and username if valid
        """
        url = f"{self.base_url}/api/v1/check-api-key"
        try:
            resp = self._session.get(url, headers=self._headers, timeout=self.timeout)
            if not resp.ok:
                return Response(error=_parse_error(resp), status_code=resp.status_code)
            return Response(data=CheckAPIKeyResponse.model_validate(resp.json()))
        except Exception as e:
            return Response(error=str(e), status_code=0)

    def get_prompt(
        self,
        *,
        slug: str,
        version_number: Optional[int] = None,
        status: Optional[str] = None,
    ) -> Response[PromptContentResponse]:
        payload = GetPromptRequest(
            slug=slug,
            source_name="python_sdk",
            version_number=version_number,
            status=status,
        ).model_dump(exclude_none=True)

        url = f"{self.base_url}/api/v1/get-prompt"
        try:
            resp = self._session.post(url, json=payload, headers=self._headers, timeout=self.timeout)
            if not resp.ok:
                return Response(error=_parse_error(resp), status_code=resp.status_code)
            return Response(data=PromptContentResponse.model_validate(resp.json()))
        except Exception as e:
            return Response(error=str(e), status_code=0)

    def track_event(
        self,
        *,
        trace_id: str,
        event_name: str,
        source_name: str = "python_sdk",
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        value: Optional[float] = None,
        currency: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> Response[EventResponse]:
        payload = EventRequest(
            trace_id=trace_id,
            event_name=event_name,
            source_name=source_name,
            user_id=user_id,
            session_id=session_id,
            value=value,
            currency=currency,
            metadata=metadata or {},
        ).model_dump(exclude_none=True)

        url = f"{self.base_url}/api/v1/events"
        try:
            resp = self._session.post(url, json=payload, headers=self._headers, timeout=self.timeout)
            if not resp.ok:
                return Response(error=_parse_error(resp), status_code=resp.status_code)
            return Response(data=EventResponse.model_validate(resp.json()))
        except Exception as e:
            return Response(error=str(e), status_code=0)


class AsyncxR2Client:
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str | None = None,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        total_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        self.base_url = (base_url or BASE_URL).rstrip("/")
        self.timeout = timeout
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        # httpx has no built-in urllib3 Retry; implement lightweight retry
        self._total_retries = total_retries
        self._backoff_factor = backoff_factor
        self._client = httpx.AsyncClient(timeout=self.timeout)

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _post_with_retry(self, url: str, json: dict) -> httpx.Response:
        attempt = 0
        while True:
            try:
                return await self._client.post(url, json=json, headers=self._headers)
            except (httpx.ConnectError, httpx.ReadError, httpx.RemoteProtocolError, httpx.HTTPStatusError):
                if attempt >= self._total_retries:
                    raise
                sleep_s = self._backoff_factor * (2 ** attempt)
                await asyncio.sleep(sleep_s)
                attempt += 1

    async def _get_with_retry(self, url: str) -> httpx.Response:
        attempt = 0
        while True:
            try:
                return await self._client.get(url, headers=self._headers)
            except (httpx.ConnectError, httpx.ReadError, httpx.RemoteProtocolError, httpx.HTTPStatusError):
                if attempt >= self._total_retries:
                    raise
                sleep_s = self._backoff_factor * (2 ** attempt)
                await asyncio.sleep(sleep_s)
                attempt += 1

    async def check_api_key(self) -> Response[CheckAPIKeyResponse]:
        """Validate the API key and get the username associated with it.

        Returns:
            Response[CheckAPIKeyResponse]: Response containing ok=True and username if valid
        """
        url = f"{self.base_url}/api/v1/check-api-key"
        try:
            resp = await self._get_with_retry(url)
            if resp.status_code >= 400:
                return Response(error=_parse_error(resp), status_code=resp.status_code)
            return Response(data=CheckAPIKeyResponse.model_validate(resp.json()))
        except Exception as e:
            return Response(error=str(e), status_code=0)

    async def get_prompt(
        self,
        *,
        slug: str,
        version_number: Optional[int] = None,
        status: Optional[str] = None,
    ) -> Response[PromptContentResponse]:
        payload = GetPromptRequest(
            slug=slug,
            source_name="python_sdk",
            version_number=version_number,
            status=status,
        ).model_dump(exclude_none=True)

        url = f"{self.base_url}/api/v1/get-prompt"
        try:
            resp = await self._post_with_retry(url, json=payload)
            if resp.status_code >= 400:
                return Response(error=_parse_error(resp), status_code=resp.status_code)
            return Response(data=PromptContentResponse.model_validate(resp.json()))
        except Exception as e:
            return Response(error=str(e), status_code=0)

    async def track_event(
        self,
        *,
        trace_id: str,
        event_name: str,
        source_name: str = "python_sdk",
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        value: Optional[float] = None,
        currency: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> Response[EventResponse]:
        payload = EventRequest(
            trace_id=trace_id,
            event_name=event_name,
            source_name=source_name,
            user_id=user_id,
            session_id=session_id,
            value=value,
            currency=currency,
            metadata=metadata or {},
        ).model_dump(exclude_none=True)

        url = f"{self.base_url}/api/v1/events"
        try:
            resp = await self._post_with_retry(url, json=payload)
            if resp.status_code >= 400:
                return Response(error=_parse_error(resp), status_code=resp.status_code)
            return Response(data=EventResponse.model_validate(resp.json()))
        except Exception as e:
            return Response(error=str(e), status_code=0)


