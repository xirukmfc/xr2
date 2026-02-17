from __future__ import annotations

import json as _json
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# ============== Response Wrapper ==============

from typing import Generic, TypeVar

T = TypeVar("T")


class Response(Generic[T]):
    """Wrapper for API responses with error handling"""
    
    def __init__(
        self,
        data: T | None = None,
        error: str | None = None,
        status_code: int = 200,
    ):
        self.data = data
        self.error = error
        self.status_code = status_code
        self.ok = error is None
    
    def __repr__(self) -> str:
        import json
        if self.ok and hasattr(self.data, 'model_dump'):
            data_dict = self.data.model_dump(mode='json')
            return json.dumps({"ok": True, "data": data_dict}, indent=2, ensure_ascii=False)
        elif self.ok:
            return json.dumps({"ok": True, "data": str(self.data)}, indent=2, ensure_ascii=False)
        return json.dumps({"ok": False, "error": self.error, "status_code": self.status_code}, indent=2, ensure_ascii=False)
    
    def __bool__(self) -> bool:
        """Allow `if response:` checks"""
        return self.ok
    
    def to_dict(self) -> dict:
        """Convert response to dictionary"""
        if self.ok and hasattr(self.data, 'model_dump'):
            return {"ok": True, "data": self.data.model_dump(mode='json')}
        return {"ok": False, "error": self.error, "status_code": self.status_code}


# Legacy exceptions (for those who prefer try/except)
class XR2Error(Exception):
    """Base exception for xR2 SDK"""
    def __init__(self, message: str, status_code: int = 0):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class PromptNotFoundError(XR2Error):
    pass


class AuthenticationError(XR2Error):
    pass


class APIError(XR2Error):
    pass


class VariableError(XR2Error):
    """Raised when required variables are missing."""
    def __init__(self, message: str, missing_variables: list[str] | None = None):
        super().__init__(message, status_code=0)
        self.missing_variables = missing_variables or []


# ============== Rendered Prompt ==============

class RenderedPrompt(BaseModel):
    """Result of rendering a prompt template with variable values."""
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None
    trace_id: str
    variables_used: Dict[str, Any] = Field(default_factory=dict)


# ============== Request Models ==============

class GetPromptRequest(BaseModel):
    slug: str
    source_name: str
    version_number: Optional[int] = None
    status: Optional[str] = Field(default=None, description="draft | testing | production | inactive | deprecated")


class PromptContentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    slug: str
    source_name: str
    version_number: int
    status: str

    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None

    variables: List[Dict[str, Any]] = Field(default_factory=list)
    prompt_model_config: Dict[str, Any] = Field(default_factory=dict, alias="model_config")
    deployed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    trace_id: str

    ab_test_id: Optional[str] = None
    ab_test_name: Optional[str] = None
    ab_test_variant: Optional[str] = None

    def render(
        self,
        values: Dict[str, Any] | None = None,
        *,
        strict: bool = True,
        use_defaults: bool = True,
        array_separator: str | None = None,
    ) -> RenderedPrompt:
        """Render prompt templates by replacing variable placeholders with values.

        Args:
            values: Variable values to substitute. Keys are variable names.
            strict: If True, raise VariableError when required variables are missing.
            use_defaults: If True, apply default values for variables not in `values`.
            array_separator: If set, join array values with this separator instead of JSON.

        Returns:
            RenderedPrompt with all placeholders replaced.

        Raises:
            VariableError: When strict=True and required variables have no value or default.
        """
        values = values or {}

        # Build lookup from variable definitions
        var_defs: Dict[str, Dict[str, Any]] = {}
        for var in self.variables:
            var_defs[var["name"]] = var

        # Resolve values: provided > default > missing
        resolved: Dict[str, Any] = {}
        missing: list[str] = []

        for name, defn in var_defs.items():
            if name in values:
                resolved[name] = values[name]
            elif use_defaults:
                # Support both "default" and "defaultValue" field names
                if "default" in defn and defn["default"] is not None:
                    resolved[name] = defn["default"]
                elif "defaultValue" in defn and defn["defaultValue"] is not None:
                    resolved[name] = defn["defaultValue"]
                elif defn.get("required", False):
                    missing.append(name)
            elif defn.get("required", False):
                missing.append(name)

        if strict and missing:
            raise VariableError(
                f"Missing required variables: {', '.join(missing)}",
                missing_variables=missing,
            )

        # Convert resolved values to strings
        str_values: Dict[str, str] = {}
        for name, val in resolved.items():
            if isinstance(val, bool):
                str_values[name] = str(val).lower()
            elif isinstance(val, list):
                if array_separator is not None:
                    str_values[name] = array_separator.join(str(item) for item in val)
                else:
                    str_values[name] = _json.dumps(val, ensure_ascii=False)
            else:
                str_values[name] = str(val)

        # Replace placeholders in prompt fields
        def _replace(text: str | None) -> str | None:
            if text is None:
                return None
            for name, val in str_values.items():
                text = text.replace("{{" + name + "}}", val)
                text = text.replace("{" + name + "}", val)
            return text

        return RenderedPrompt(
            system_prompt=_replace(self.system_prompt),
            user_prompt=_replace(self.user_prompt),
            assistant_prompt=_replace(self.assistant_prompt),
            trace_id=self.trace_id,
            variables_used=resolved,
        )


class EventRequest(BaseModel):
    trace_id: str = Field(..., description="Trace ID from GET /get-prompt response")
    event_name: str = Field(..., description="Event name as defined in dashboard event definitions")
    source_name: str = Field(..., description="Source identifier for tracking where events come from")

    # Standard optional fields
    user_id: Optional[str] = Field(None, description="User identifier")
    session_id: Optional[str] = Field(None, description="Session identifier")
    value: Optional[float] = Field(None, description="Numeric value for analytics (revenue, order amount, etc.)")
    currency: Optional[str] = Field(None, description="Currency code (USD, EUR, etc.)")

    # Custom fields go in metadata
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Custom event fields as defined in event definition metadata_schema"
    )


class EventResponse(BaseModel):
    status: str
    event_id: str
    trace_id: str
    event_name: str
    timestamp: str
    is_duplicate: bool


class CheckAPIKeyResponse(BaseModel):
    """Response model for API key validation"""
    ok: bool
    user: str