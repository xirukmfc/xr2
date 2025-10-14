from __future__ import annotations

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class GetPromptRequest(BaseModel):
    slug: str
    source_name: str
    version_number: Optional[int] = None
    status: Optional[str] = Field(default=None, description="draft | testing | production | inactive | deprecated")


class PromptContentResponse(BaseModel):
    slug: str
    source_name: str
    version_number: int
    status: str

    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None

    variables: List[Dict[str, Any]] = Field(default_factory=list)
    model_config: Dict[str, Any] = Field(default_factory=dict)
    deployed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    trace_id: str

    ab_test_id: Optional[str] = None
    ab_test_name: Optional[str] = None
    ab_test_variant: Optional[str] = None


class EventRequest(BaseModel):
    trace_id: str
    event_name: str
    category: str
    fields: Dict[str, Any] = Field(default_factory=dict)


class EventResponse(BaseModel):
    status: str
    event_id: str
    trace_id: str
    event_name: str
    category: str
    timestamp: str
    is_duplicate: bool


