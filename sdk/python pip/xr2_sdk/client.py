from __future__ import annotations

import time
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
)
from .config import BASE_URL


DEFAULT_TIMEOUT_SECONDS = 10.0


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
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        total_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        self.base_url = BASE_URL.rstrip("/")
        self.timeout = timeout
        self._session = _build_requests_session(total_retries, backoff_factor)
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def get_prompt(
        self,
        *,
        slug: str,
        version_number: Optional[int] = None,
        status: Optional[str] = None,
    ) -> PromptContentResponse:
        payload = GetPromptRequest(
            slug=slug,
            source_name="python_sdk",
            version_number=version_number,
            status=status,
        ).model_dump(exclude_none=True)

        url = f"{self.base_url}/api/v1/get-prompt"
        resp = self._session.post(url, json=payload, headers=self._headers, timeout=self.timeout)
        resp.raise_for_status()
        return PromptContentResponse.model_validate(resp.json())

    def track_event(
        self,
        *,
        trace_id: str,
        event_name: str,
        category: str,
        fields: dict,
    ) -> EventResponse:
        payload = EventRequest(
            trace_id=trace_id,
            event_name=event_name,
            category=category,
            fields=fields,
        ).model_dump()

        url = f"{self.base_url}/api/v1/events"
        resp = self._session.post(url, json=payload, headers=self._headers, timeout=self.timeout)
        resp.raise_for_status()
        return EventResponse.model_validate(resp.json())


class AsyncxR2Client:
    def __init__(
        self,
        api_key: str,
        *,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        total_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        self.base_url = BASE_URL.rstrip("/")
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
            except (httpx.ConnectError, httpx.ReadError, httpx.RemoteProtocolError, httpx.HTTPStatusError) as exc:
                if attempt >= self._total_retries:
                    raise
                sleep_s = self._backoff_factor * (2 ** attempt)
                await httpx.AsyncClient().aclose()  # no-op to satisfy lint; not used
                time.sleep(sleep_s)
                attempt += 1

    async def get_prompt(
        self,
        *,
        slug: str,
        version_number: Optional[int] = None,
        status: Optional[str] = None,
    ) -> PromptContentResponse:
        payload = GetPromptRequest(
            slug=slug,
            source_name="python_sdk",
            version_number=version_number,
            status=status,
        ).model_dump(exclude_none=True)

        url = f"{self.base_url}/api/v1/get-prompt"
        resp = await self._post_with_retry(url, json=payload)
        resp.raise_for_status()
        return PromptContentResponse.model_validate(resp.json())

    async def track_event(
        self,
        *,
        trace_id: str,
        event_name: str,
        category: str,
        fields: dict,
    ) -> EventResponse:
        payload = EventRequest(
            trace_id=trace_id,
            event_name=event_name,
            category=category,
            fields=fields,
        ).model_dump()

        url = f"{self.base_url}/api/v1/events"
        resp = await self._post_with_retry(url, json=payload)
        resp.raise_for_status()
        return EventResponse.model_validate(resp.json())


