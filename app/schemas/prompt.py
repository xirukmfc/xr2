from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from app.models.prompt import PromptStatus, VersionStatus


class TagResponse(BaseModel):
    id: str
    name: str
    color: str


class PromptVersionCreate(BaseModel):
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: List[dict] = []
    llm_config: dict = {}
    changelog: Optional[str] = None
    tag_ids: List[str] = []


class PromptVersionUpdate(BaseModel):
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: Optional[List[Any]] = None
    llm_config: Optional[Dict[str, Any]] = None
    status: Optional[VersionStatus] = None
    changelog: Optional[str] = None

    class Config:
        use_enum_values = True


class PromptVersionResponse(BaseModel):
    id: str
    prompt_id: str
    version_number: int
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: List[dict] = []
    llm_config: dict = {}
    status: str
    deployed_at: Optional[str] = None
    deployed_by: Optional[str] = None
    usage_count: int = 0
    avg_latency: Optional[int] = None
    changelog: Optional[str] = None
    created_by: str
    creator_name: str
    creator_full_name: str
    updated_by: Optional[str] = None
    updater_name: str = ""
    updater_full_name: str = ""
    created_at: str
    updated_at: str


class PromptUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PromptStatus] = None


class PromptResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    status: str
    workspace_id: str
    production_version_id: Optional[str] = None
    current_version_id: Optional[str] = None
    created_by: str
    updated_by: Optional[str] = None
    creator_name: Optional[str] = None
    creator_full_name: Optional[str] = None
    creator_email: Optional[str] = None
    updater_name: Optional[str] = None
    updater_full_name: Optional[str] = None
    created_at: str
    updated_at: str
    last_deployed_at: Optional[str] = None
    last_deployed_by: Optional[str] = None
    versions: List[PromptVersionResponse] = []
    production_version: Optional[PromptVersionResponse] = None
    current_version: Optional[PromptVersionResponse] = None
    tags: List[TagResponse] = []
    usage_24h: int = 0  # Usage count in last 24 hours


class CreatePromptRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: Optional[str] = None
    description: Optional[str] = None
    workspace_id: str
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    assistant_prompt: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: List[dict] = []
    llm_config: dict = {}
    tag_ids: List[str] = []


class UpdatePromptRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PromptStatus] = None
    tag_ids: Optional[List[str]] = None


class FindPromptRequest(BaseModel):
    """Request model for external API to find prompts"""
    # Required parameters
    api_key: str = Field(..., description="API key for authentication")
    slug: str = Field(..., description="Prompt slug to find")

    # Optional filters
    status: Optional[PromptStatus] = Field(None, description="Filter by prompt status")
    has_tags: Optional[List[str]] = Field(None,
                                          description="Filter by tags (prompt must have at least one of these tags)")

    class Config:
        use_enum_values = True


class FindPromptVersionRequest(BaseModel):
    """Request model for external API to find prompt versions"""
    # Required parameters  
    api_key: str = Field(..., description="API key for authentication")
    slug: str = Field(..., description="Prompt slug to verify ownership")

    # Optional filters
    version_number: Optional[int] = Field(None, description="Filter by specific version number")
    version_status: Optional[VersionStatus] = Field(None, description="Filter by version status")
    prompt_status: Optional[PromptStatus] = Field(None, description="Filter by parent prompt status")

    class Config:
        use_enum_values = True
