from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class CreatePublicShareRequest(BaseModel):
    """Request schema for creating a public share"""
    prompt_version_id: UUID = Field(..., description="ID of the prompt version to share")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration time")


class PublicShareResponse(BaseModel):
    """Response schema for public share"""
    id: UUID = Field(..., description="Unique identifier for the share")
    token: str = Field(..., description="Public token for accessing the share")
    share_url: str = Field(..., description="Full URL for accessing the shared prompt")
    created_at: datetime = Field(..., description="When the share was created")
    expires_at: Optional[datetime] = Field(None, description="When the share expires")


class PublicShareListResponse(BaseModel):
    """Response schema for listing public shares"""
    id: UUID
    token: str
    prompt_version_id: UUID
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool


class PublicPromptVariable(BaseModel):
    """Variable schema for public prompt"""
    name: str
    type: str
    defaultValue: Optional[str] = None
    isDefined: bool = True


class PublicPromptData(BaseModel):
    """Public prompt data that can be accessed without authentication"""
    prompt_name: str = Field(..., description="Name of the prompt")
    prompt_description: Optional[str] = Field(None, description="Description of the prompt")
    version_number: int = Field(..., description="Version number")
    system_prompt: Optional[str] = Field(None, description="System prompt text")
    user_prompt: Optional[str] = Field(None, description="User prompt text")
    assistant_prompt: Optional[str] = Field(None, description="Assistant prompt text")
    prompt_template: Optional[str] = Field(None, description="Single prompt template")
    variables: List[PublicPromptVariable] = Field(default_factory=list, description="Prompt variables")
    shared_by_name: Optional[str] = Field(None, description="Name of the user who shared")
    created_by_name: Optional[str] = Field(None, description="Name of the user who created the prompt")
    updated_by_name: Optional[str] = Field(None, description="Name of the user who last updated the prompt")
    created_at: datetime = Field(..., description="When the prompt version was created")
    updated_at: datetime = Field(..., description="When the prompt version was last updated")


class DeletePublicShareResponse(BaseModel):
    """Response schema for deleting a public share"""
    success: bool = Field(..., description="Whether the deletion was successful")
    message: Optional[str] = Field(None, description="Optional message")