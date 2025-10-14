import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
import datetime
import httpx

from app.core.database import get_session
from app.models.llm import LLMProvider, UserAPIKey
from app.models.user import User
from app.core.auth import get_current_user

# Optimized HTTP client with connection pooling for external API calls
# This will reuse connections instead of creating new ones for each request
http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(30.0, connect=10.0),  # 30s total, 10s connect timeout
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
    # Connection pooling settings for better performance with external APIs
    http2=True,  # Use HTTP/2 when available for better multiplexing
)

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models for API requests/responses
class LLMModelInfo(BaseModel):
    """Model information for LLM Provider"""
    id: str
    name: str
    description: Optional[str] = None
    context_window: Optional[int] = None


class LLMProviderResponse(BaseModel):
    """Response model for LLM Provider"""
    id: UUID
    name: str
    display_name: str
    description: Optional[str] = None
    is_active: bool
    api_base_url: Optional[str] = None
    models: List[LLMModelInfo] = Field(default_factory=list, description="Available models for this provider")
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class UserAPIKeyCreate(BaseModel):
    """Request model for creating user API key"""
    name: str = Field(..., min_length=1, max_length=100, description="User-defined name for the API key")
    provider_id: UUID = Field(..., description="ID of the LLM provider")
    api_key: str = Field(..., min_length=1, description="The actual API key")


class UserAPIKeyUpdate(BaseModel):
    """Request model for updating user API key"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    api_key: Optional[str] = Field(None, min_length=1)


class UserAPIKeyResponse(BaseModel):
    """Response model for User API Key"""
    id: UUID
    name: str
    user_id: UUID
    provider_id: UUID
    provider_name: Optional[str] = None
    provider_display_name: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            name=obj.name,
            user_id=obj.user_id,
            provider_id=obj.provider_id,
            provider_name=obj.provider.name if obj.provider else None,
            provider_display_name=obj.provider.display_name if obj.provider else None,
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )


# LLM Provider endpoints (public, for frontend to list available providers)

@router.get("/providers", response_model=List[LLMProviderResponse])
async def get_active_providers(session: AsyncSession = Depends(get_session)):
    """Get list of active LLM providers"""
    result = await session.execute(
        select(LLMProvider)
        .where(LLMProvider.is_active == True)
        .order_by(LLMProvider.display_name)
    )
    providers = result.scalars().all()
    return [LLMProviderResponse.model_validate(provider) for provider in providers]


# User API Key endpoints (require authentication)

@router.get("/api-keys", response_model=List[UserAPIKeyResponse])
async def get_user_api_keys(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get current user's API keys"""
    result = await session.execute(
        select(UserAPIKey)
        .where(UserAPIKey.user_id == current_user.id)
        .order_by(UserAPIKey.created_at.desc())
    )
    api_keys = result.scalars().all()

    # Load provider relationships
    for key in api_keys:
        if key.provider_id:
            provider_result = await session.execute(
                select(LLMProvider).where(LLMProvider.id == key.provider_id)
            )
            key.provider = provider_result.scalar_one_or_none()

    return [UserAPIKeyResponse.from_orm(key) for key in api_keys]


@router.post("/api-keys", response_model=UserAPIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_user_api_key(
        key_data: UserAPIKeyCreate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Create a new API key for the current user"""

    # Check if provider exists and is active
    provider_result = await session.execute(
        select(LLMProvider)
        .where(LLMProvider.id == key_data.provider_id)
        .where(LLMProvider.is_active == True)
    )
    provider = provider_result.scalar_one_or_none()

    if not provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider not found or inactive"
        )

    # Check if user already has a key with this name
    existing_result = await session.execute(
        select(UserAPIKey)
        .where(UserAPIKey.user_id == current_user.id)
        .where(UserAPIKey.name == key_data.name)
    )
    existing_key = existing_result.scalar_one_or_none()

    if existing_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an API key with this name"
        )

    # For now, store the key as plain text (in production, this should be encrypted)
    # TODO: Implement proper encryption for API keys
    new_key = UserAPIKey(
        name=key_data.name,
        user_id=current_user.id,
        provider_id=key_data.provider_id,
        encrypted_key=key_data.api_key  # TODO: encrypt this
    )

    session.add(new_key)
    await session.commit()
    await session.refresh(new_key)

    # Load provider relationship
    new_key.provider = provider

    return UserAPIKeyResponse.from_orm(new_key)


@router.get("/api-keys/{key_id}", response_model=UserAPIKeyResponse)
async def get_user_api_key(
        key_id: UUID,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Get a specific API key for the current user"""
    result = await session.execute(
        select(UserAPIKey)
        .where(UserAPIKey.id == key_id)
        .where(UserAPIKey.user_id == current_user.id)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Load provider relationship
    if api_key.provider_id:
        provider_result = await session.execute(
            select(LLMProvider).where(LLMProvider.id == api_key.provider_id)
        )
        api_key.provider = provider_result.scalar_one_or_none()

    return UserAPIKeyResponse.from_orm(api_key)


@router.put("/api-keys/{key_id}", response_model=UserAPIKeyResponse)
async def update_user_api_key(
        key_id: UUID,
        key_data: UserAPIKeyUpdate,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Update an API key for the current user"""
    result = await session.execute(
        select(UserAPIKey)
        .where(UserAPIKey.id == key_id)
        .where(UserAPIKey.user_id == current_user.id)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check for name conflicts if name is being updated
    if key_data.name and key_data.name != api_key.name:
        existing_result = await session.execute(
            select(UserAPIKey)
            .where(UserAPIKey.user_id == current_user.id)
            .where(UserAPIKey.name == key_data.name)
            .where(UserAPIKey.id != key_id)
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an API key with this name"
            )

    # Update fields
    if key_data.name is not None:
        api_key.name = key_data.name
    if key_data.api_key is not None:
        api_key.encrypted_key = key_data.api_key  # TODO: encrypt this

    await session.commit()
    await session.refresh(api_key)

    # Load provider relationship
    if api_key.provider_id:
        provider_result = await session.execute(
            select(LLMProvider).where(LLMProvider.id == api_key.provider_id)
        )
        api_key.provider = provider_result.scalar_one_or_none()

    return UserAPIKeyResponse.from_orm(api_key)


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_api_key(
        key_id: UUID,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Delete an API key for the current user"""
    result = await session.execute(
        select(UserAPIKey)
        .where(UserAPIKey.id == key_id)
        .where(UserAPIKey.user_id == current_user.id)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    await session.delete(api_key)
    await session.commit()


# Test Run schemas and endpoints

class TestRunRequest(BaseModel):
    """Request model for testing prompts with LLM"""
    provider: str = Field(..., description="LLM provider name (e.g., 'openai', 'anthropic')")
    model: str = Field(..., description="Model name")
    temperature: float = Field(..., ge=0.0, le=2.0, description="Temperature for generation")
    max_output_tokens: int = Field(..., ge=1, description="Maximum tokens to generate")
    systemPrompt: str = Field(..., description="System prompt")
    userPrompt: str = Field(..., description="User prompt")
    variables: Optional[Dict[str, Any]] = Field(None, description="Variables for prompt")
    tools: Optional[List[Any]] = Field(None, description="Tools/functions for the model")


class TestRunResponse(BaseModel):
    """Response model for test run results"""
    text: str = Field(..., description="Generated text response")
    usage: Optional[Dict[str, int]] = Field(None, description="Token usage statistics")
    costUsd: Optional[float] = Field(None, description="Estimated cost in USD")


# Pricing data (cost per 1K tokens in USD)
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    'gpt-4o': {'input': 0.0025, 'output': 0.01},
    'gpt-4o-mini': {'input': 0.00015, 'output': 0.0006},
    'gpt-4-turbo': {'input': 0.01, 'output': 0.03},
    'gpt-4': {'input': 0.03, 'output': 0.06},
    'gpt-3.5-turbo': {'input': 0.0005, 'output': 0.0015},
    'claude-3.5-sonnet': {'input': 0.003, 'output': 0.015},
    'claude-3.5-haiku': {'input': 0.00025, 'output': 0.00125},
    'claude-3-opus': {'input': 0.015, 'output': 0.075},
    'claude-3-sonnet': {'input': 0.003, 'output': 0.015},
    'claude-3-haiku': {'input': 0.00025, 'output': 0.00125},
    'gemini-2.5-pro': {'input': 0.00125, 'output': 0.005},
    'gemini-2.5-flash': {'input': 0.000075, 'output': 0.0003},
    'gemini-1.5-pro': {'input': 0.00125, 'output': 0.005},
    'gemini-1.5-flash': {'input': 0.000075, 'output': 0.0003},
}


def calculate_cost(model: str, prompt_tokens: int = 0, completion_tokens: int = 0) -> Optional[float]:
    """Calculate cost based on model pricing"""
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        return None

    input_cost = (prompt_tokens / 1000) * pricing['input']
    output_cost = (completion_tokens / 1000) * pricing['output']
    return input_cost + output_cost


async def get_user_api_key_by_provider(
        provider_name: str,
        user_id: UUID,
        session: AsyncSession
) -> Optional[str]:
    """Get user's API key for a specific provider"""
    # Use exact match instead of ilike for better performance
    provider_result = await session.execute(
        select(LLMProvider)
        .where(LLMProvider.name == provider_name.lower())
        .where(LLMProvider.is_active == True)
    )
    provider = provider_result.scalar_one_or_none()

    if not provider:
        # Fallback to ilike if exact match fails
        provider_result = await session.execute(
            select(LLMProvider)
            .where(LLMProvider.name.ilike(f'%{provider_name}%'))
            .where(LLMProvider.is_active == True)
        )
        provider = provider_result.scalar_one_or_none()

    if not provider:
        return None

    # Then find user's API key for this provider
    key_result = await session.execute(
        select(UserAPIKey)
        .where(UserAPIKey.user_id == user_id)
        .where(UserAPIKey.provider_id == provider.id)
        .limit(1)
    )
    user_key = key_result.scalar_one_or_none()

    return user_key.encrypted_key if user_key else None


async def call_openai_api(
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_output_tokens: int,
        tools: Optional[List[Any]] = None
) -> TestRunResponse:
    """Call OpenAI API"""
    messages = []

    if system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt})

    messages.append({"role": "user", "content": user_prompt})

    request_data = {
        "model": model,
        "messages": messages,
    }

    # GPT-5 and o1 models have different parameter requirements
    if model.startswith("gpt-5") or model.startswith("o1"):
        request_data["max_completion_tokens"] = max_output_tokens  # Remove str()
        # GPT-5 and o1 models only support temperature = 1 (default)
        if temperature != 1.0:
            request_data["temperature"] = 1.0  # Remove str(), set to 1.0
        else:
            request_data["temperature"] = temperature  # Remove str()
    else:
        request_data["max_tokens"] = max_output_tokens  # Remove str()
        request_data["temperature"] = temperature  # Remove str()

    if tools:
        request_data["tools"] = tools

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Use shared HTTP client with connection pooling for better performance
    response = await http_client.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=request_data
    )

    if response.status_code != 200:
        error_text = response.text
        raise HTTPException(
            status_code=response.status_code,
            detail=f"OpenAI API error: {error_text}"
        )

    data = response.json()
    usage = data.get("usage", {})
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

    cost_usd = None
    if usage:
        cost_usd = calculate_cost(
            model,
            usage.get("prompt_tokens", 0),
            usage.get("completion_tokens", 0)
        )

    return TestRunResponse(
        text=text,
        usage={
            "total": usage.get("total_tokens"),
            "prompt_tokens": usage.get("prompt_tokens"),
            "completion_tokens": usage.get("completion_tokens")
        } if usage else None,
        costUsd=cost_usd
    )


async def call_claude_api(
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[List[Any]] = None
) -> TestRunResponse:
    """Call Claude API"""
    # Map model names to Anthropic API model names
    model_mapping = {
        'claude-4.1-opus': 'claude-3-5-sonnet-20241022',
        'claude-4-sonnet': 'claude-3-5-sonnet-20241022',
        'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
        'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
        'claude-3-opus': 'claude-3-opus-20240229',
        'claude-3-sonnet': 'claude-3-sonnet-20240229',
        'claude-3-haiku': 'claude-3-haiku-20240307',
    }

    api_model = model_mapping.get(model, model)

    request_data = {
        "model": api_model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": user_prompt}]
    }

    if system_prompt.strip():
        request_data["system"] = system_prompt

    if tools:
        request_data["tools"] = tools

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    }

    # Use shared HTTP client with connection pooling for better performance
    response = await http_client.post(
        "https://api.anthropic.com/v1/messages",
        headers=headers,
        json=request_data
    )

    if response.status_code != 200:
        error_text = response.text
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Claude API error: {error_text}"
        )

    data = response.json()
    text = data.get("content", [{}])[0].get("text", "")
    usage = data.get("usage", {})

    cost_usd = None
    if usage:
        # Map Claude model name to pricing model name
        pricing_model = model
        if model.startswith('claude-4') or model.startswith('claude-3-5-sonnet') or model == 'claude-3.5-sonnet':
            pricing_model = 'claude-3.5-sonnet'
        elif model.startswith('claude-3-5-haiku') or model == 'claude-3.5-haiku':
            pricing_model = 'claude-3.5-haiku'
        elif model.startswith('claude-3-opus') or model == 'claude-3-opus':
            pricing_model = 'claude-3-opus'
        elif model.startswith('claude-3-sonnet') or model == 'claude-3-sonnet':
            pricing_model = 'claude-3-sonnet'
        elif model.startswith('claude-3-haiku') or model == 'claude-3-haiku':
            pricing_model = 'claude-3-haiku'

        cost_usd = calculate_cost(
            pricing_model,
            usage.get("input_tokens", 0),
            usage.get("output_tokens", 0)
        )

    return TestRunResponse(
        text=text,
        usage={
            "total": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            "prompt_tokens": usage.get("input_tokens"),
            "completion_tokens": usage.get("output_tokens")
        } if usage else None,
        costUsd=cost_usd
    )


async def call_gemini_api(
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_output_tokens: int,
        tools: Optional[List[Any]] = None
) -> TestRunResponse:
    """Call Google Gemini API"""

    # Prepare the content
    parts = []
    if system_prompt.strip():
        parts.append({"text": f"System: {system_prompt}\n\nUser: {user_prompt}"})
    else:
        parts.append({"text": user_prompt})

    request_data = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        }
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Use shared HTTP client with connection pooling for better performance
    response = await http_client.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        headers=headers,
        json=request_data
    )

    if response.status_code != 200:
        error_text = response.text
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Gemini API error: {error_text}"
        )

    data = response.json()
    text = ""
    usage_metadata = data.get("usageMetadata", {})

    if "candidates" in data and len(data["candidates"]) > 0:
        candidate = data["candidates"][0]
        if "content" in candidate and "parts" in candidate["content"]:
            text = candidate["content"]["parts"][0].get("text", "")

    cost_usd = None
    if usage_metadata:
        cost_usd = calculate_cost(
            model,
            usage_metadata.get("promptTokenCount", 0),
            usage_metadata.get("candidatesTokenCount", 0)
        )

    return TestRunResponse(
        text=text,
        usage={
            "total": usage_metadata.get("totalTokenCount"),
            "prompt_tokens": usage_metadata.get("promptTokenCount"),
            "completion_tokens": usage_metadata.get("candidatesTokenCount")
        } if usage_metadata else None,
        costUsd=cost_usd
    )


@router.post("/test-run", response_model=TestRunResponse)
async def test_run_prompt(
        request: TestRunRequest,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Test a prompt with LLM using user's stored API key"""
    import time
    start_time = time.time()

    # Get user's API key for the specified provider
    key_lookup_start = time.time()
    api_key = await get_user_api_key_by_provider(
        request.provider,
        current_user.id,
        session
    )
    key_lookup_time = time.time() - key_lookup_start
    logger.info(f'API key lookup took {key_lookup_time:.3f}s')

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"No API key found for provider '{request.provider}'. Please add an API key first."
        )

    try:
        # Determine which API to call based on provider
        provider_lower = request.provider.lower()
        api_call_start = time.time()
        logger.info(f'Calling {provider_lower} API...')

        if 'openai' in provider_lower or 'gpt' in provider_lower:
            res = await call_openai_api(
                api_key=api_key,
                model=request.model,
                system_prompt=request.systemPrompt,
                user_prompt=request.userPrompt,
                temperature=request.temperature,
                max_output_tokens=request.max_output_tokens,
                tools=request.tools
            )
            api_call_time = time.time() - api_call_start
            total_time = time.time() - start_time
            logger.info(f'OpenAI API call took {api_call_time:.3f}s, total request: {total_time:.3f}s')
            return res

        elif 'anthropic' in provider_lower or 'claude' in provider_lower:
            return await call_claude_api(
                api_key=api_key,
                model=request.model,
                system_prompt=request.systemPrompt,
                user_prompt=request.userPrompt,
                temperature=request.temperature,
                max_tokens=request.max_output_tokens,
                tools=request.tools
            )

        elif 'google' in provider_lower or 'gemini' in provider_lower:
            return await call_gemini_api(
                api_key=api_key,
                model=request.model,
                system_prompt=request.systemPrompt,
                user_prompt=request.userPrompt,
                temperature=request.temperature,
                max_output_tokens=request.max_output_tokens,
                tools=request.tools
            )

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported provider: {request.provider}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calling LLM API: {str(e)}"
        )
