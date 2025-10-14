import logging
import re
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import anthropic
import google.generativeai as genai
import tiktoken
from datetime import datetime, timedelta
import os

from app.core.database import get_session

logger = logging.getLogger(__name__)

router = APIRouter()


# Token calculation models
class TokenizeRequest(BaseModel):
    systemText: str = ""
    userText: str = ""
    assistantText: str = ""
    models: List[str]


class TokenizeResponse(BaseModel):
    results: Dict[str, int]


# Model mappings (same as in TypeScript version)
CLAUDE_MODEL_MAPPING = {
    "claude-4.1-opus": "claude-3-5-sonnet-20241022",
    "claude-4-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3.5-haiku": "claude-3-5-haiku-20241022",
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-sonnet": "claude-3-sonnet-20240229",
    "claude-3-haiku": "claude-3-haiku-20240307",
}

GEMINI_MODEL_MAPPING = {
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.0-flash-exp": "gemini-2.0-flash-exp",
    "gemini-2.0-flash": "gemini-2.0-flash-exp",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-1.5-flash": "gemini-1.5-flash",
}

# Simple in-memory cache with TTL
token_cache = {}
CACHE_TTL = 60  # 60 seconds


def get_cached(model: str, text: str) -> Optional[int]:
    """Get cached token count if still valid"""
    key = f"{model}:{hash(text)}"
    if key in token_cache:
        cached_data = token_cache[key]
        if datetime.now() - cached_data["timestamp"] < timedelta(seconds=CACHE_TTL):
            return cached_data["tokens"]
        else:
            del token_cache[key]
    return None


def set_cached(model: str, text: str, tokens: int):
    """Cache token count with timestamp"""
    key = f"{model}:{hash(text)}"
    token_cache[key] = {
        "tokens": tokens,
        "timestamp": datetime.now()
    }


def estimate_tokens_sync(text: str, model: str) -> int:
    """
    Synchronous version with tiktoken - simple without extra coefficients
    """
    if not text:
        return 0

    if model.startswith('gpt-'):
        try:
            # Select correct encoding
            if '4o' in model.lower() or '5' in model.lower():
                encoding = tiktoken.get_encoding("o200k_base")
            else:
                encoding = tiktoken.get_encoding("cl100k_base")

            # Accurate token count without extra additions
            tokens = encoding.encode(text, disallowed_special=())
            return len(tokens)

        except Exception as e:
            logger.warning(f"Tiktoken failed for {model}: {e}, using estimation")

    # Fallback for all other cases
    has_cyrillic = bool(re.search(r'[А-Яа-яЁё]', text))

    if model.startswith('gpt-'):
        if has_cyrillic:
            cpt = 2.5  # Simple coefficient for Cyrillic
        else:
            cpt = 4.0
        return max(1, round(len(text) / cpt))
    elif model.startswith('claude-'):
        cpt = 1.8 if has_cyrillic else 3.5
    elif model.startswith('gemini-'):
        cpt = 3.2 if has_cyrillic else 4.2
    elif model.startswith('deepseek-'):
        cpt = 3.0 if has_cyrillic else 4.0
    else:
        cpt = 4.0

    return max(1, int(len(text) / cpt))


async def count_openai_tokens(system_text: str, user_text: str, assistant_text: str, model: str) -> int:
    """
    Accurate OpenAI token count using official algorithm
    """
    try:
        if '4o' in model.lower() or '5' in model.lower():
            encoding = tiktoken.get_encoding("o200k_base")
        else:
            encoding = tiktoken.get_encoding("cl100k_base")

        has_system = bool(system_text.strip()) if system_text else False
        has_assistant = bool(assistant_text.strip()) if assistant_text else False
        has_user = bool(user_text.strip()) if user_text else False

        # Mode 1: plain text (only user, no system/assistant)
        if has_user and not has_system and not has_assistant:
            text_tokens = encoding.encode(user_text, disallowed_special=())
            return len(text_tokens)

        # Mode 2: ChatML format - use official OpenAI algorithm
        messages = []
        if has_system:
            if '5' in model.lower():
                messages.append({"role": "developer", "content": system_text.strip()})
            else:
                messages.append({"role": "system", "content": system_text.strip()})
        if has_user:
            messages.append({"role": "user", "content": user_text.strip()})
        if has_assistant:
            messages.append({"role": "assistant", "content": assistant_text.strip()})

        if not messages:
            messages = [{"role": "user", "content": "Hello"}]

        # Official token counting algorithm for chat completions
        tokens_per_message = 3  # each message adds 3 tokens
        tokens_per_name = 1  # if there's a name in the message

        num_tokens = 0
        for message in messages:
            num_tokens += tokens_per_message
            for key, value in message.items():
                num_tokens += len(encoding.encode(value, disallowed_special=()))
                if key == "name":
                    num_tokens += tokens_per_name

        num_tokens += 3  # each response starts with <|start|>assistant<|message|>
        return num_tokens

    except Exception as e:
        logger.warning(f"OpenAI token counting failed for {model}: {e}, using fallback")
        combined_text = (system_text or "") + (user_text or "") + (assistant_text or "")
        try:
            if '4o' in model.lower() or '5' in model.lower():
                encoding = tiktoken.get_encoding("o200k_base")
            else:
                encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(combined_text, disallowed_special=()))
        except Exception:
            return estimate_tokens_sync(combined_text, model)


async def count_claude_tokens(system_text: str, user_text: str, assistant_text: str, model: str) -> int:
    """Get accurate Claude token count via official Anthropic library"""
    try:
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not found, using estimation")
            return estimate_tokens_sync(system_text + user_text + assistant_text, model)

        mapped_model = CLAUDE_MODEL_MAPPING.get(model, model)

        # Build messages array properly
        messages = []
        if user_text:
            messages.append({'role': 'user', 'content': user_text})
        if assistant_text:
            messages.append({'role': 'assistant', 'content': assistant_text})

        # If no messages, create a minimal one for token counting
        if not messages:
            messages = [{'role': 'user', 'content': 'Hello'}]

        # Use official Anthropic library
        client = anthropic.Anthropic(api_key=api_key)

        # Prepare the request
        request_params = {
            'model': mapped_model,
            'messages': messages
        }

        # Add system message if provided
        if system_text:
            request_params['system'] = system_text

        response = client.messages.count_tokens(**request_params)

        return response.input_tokens

    except Exception as e:
        logger.warning(f"Claude token counting failed: {e}, using estimation")
        return estimate_tokens_sync(system_text + user_text + assistant_text, model)


async def count_gemini_tokens(system_text: str, user_text: str, assistant_text: str, model: str) -> int:
    """Get accurate Gemini token count via official Google library with proper message structure"""
    try:
        api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
        if not api_key:
            logger.warning("GEMINI_API_KEY not found, using estimation")
            return estimate_tokens_sync(system_text + user_text + assistant_text, model)

        genai.configure(api_key=api_key)
        mapped_model = GEMINI_MODEL_MAPPING.get(model, model)

        # Build contents for Gemini API
        contents = []

        # Gemini doesn't have separate system role, so we combine system + user
        user_message = ""
        if system_text:
            user_message += f"System: {system_text}\n\n"
        if user_text:
            user_message += f"User: {user_text}"

        if user_message:
            contents.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })

        # Add assistant message if provided
        if assistant_text:
            contents.append({
                "role": "model",  # Gemini uses "model" instead of "assistant"
                "parts": [{"text": assistant_text}]
            })

        # If no contents, add minimal message
        if not contents:
            contents = [{"role": "user", "parts": [{"text": "Hello"}]}]

        try:
            model_instance = genai.GenerativeModel(mapped_model)
            response = model_instance.count_tokens(contents)
            return response.total_tokens
        except Exception as e:
            logger.warning(f"Google GenAI failed: {e}, trying old library")

        # Fallback to old google-generativeai library

        return estimate_tokens_sync(system_text + user_text + assistant_text, model)

    except Exception as e:
        logger.warning(f"Gemini token counting failed: {e}, using estimation")
        return estimate_tokens_sync(system_text + user_text + assistant_text, model)


async def count_deepseek_tokens(system_text: str, user_text: str, assistant_text: str, model: str) -> int:
    """
    Nearly accurate DeepSeek token count via tiktoken in ChatML format.
    - deepseek-v3 / deepseek-chat: use cl100k_base
    - deepseek-coder: use p50k_base (for code)
    """
    try:
        import tiktoken  # ensure import inside for environment compatibility

        m = model.lower()
        if "coder" in m:
            encoding = tiktoken.get_encoding("p50k_base")
        else:
            encoding = tiktoken.get_encoding("cl100k_base")

        # Collect messages in ChatML format (similar to OpenAI)
        messages = []
        if system_text:
            messages.append({"role": "system", "content": system_text})
        if user_text:
            messages.append({"role": "user", "content": user_text})
        if assistant_text:
            messages.append({"role": "assistant", "content": assistant_text})
        if not messages:
            messages = [{"role": "user", "content": "Hello"}]

        total_tokens = 0
        for msg in messages:
            # <|im_start|>role\n + content + <|im_end|>
            total_tokens += 4  # ChatML service tokens
            total_tokens += len(encoding.encode(msg["role"])) - 1
            total_tokens += len(encoding.encode(msg["content"]))

        # If no assistant message - add tokens for response ending
        if not assistant_text:
            total_tokens += 2

        return total_tokens

    except Exception as e:
        logger.warning(f"DeepSeek token counting failed for {model}: {e}, using estimation")
        combined_text = (system_text or "") + (user_text or "") + (assistant_text or "")
        return estimate_tokens_sync(combined_text, model)


async def estimate_tokens(system_text: str, user_text: str, assistant_text: str, model: str) -> int:
    """
    Main token estimation function - simplified version
    """
    combined_text = system_text + user_text + assistant_text
    if not combined_text:
        return 0

    # Check cache first
    cache_key = f"{model}:{hash(system_text + user_text + assistant_text)}"
    cached = get_cached(model, cache_key)
    if cached is not None:
        return cached

    try:
        if model.startswith('gpt-'):
            # Use fixed function for OpenAI
            tokens = await count_openai_tokens(system_text, user_text, assistant_text, model)
        elif model.startswith('claude-'):
            tokens = await count_claude_tokens(system_text, user_text, assistant_text, model)
        elif model.startswith('gemini-'):
            tokens = await count_gemini_tokens(system_text, user_text, assistant_text, model)
        elif model.startswith('deepseek-'):
            tokens = await count_deepseek_tokens(system_text, user_text, assistant_text, model)
        else:
            tokens = estimate_tokens_sync(combined_text, model)

        set_cached(model, cache_key, tokens)
        return tokens

    except Exception as e:
        logger.error(f"Token counting error for model {model}: {e}")
        tokens = estimate_tokens_sync(combined_text, model)
        set_cached(model, cache_key, tokens)
        return tokens


@router.post("/tokenize", response_model=TokenizeResponse)
async def tokenize_text(
        request: TokenizeRequest,
        session: AsyncSession = Depends(get_session)
):
    """
    Tokenize text for multiple models
    Returns token counts for system, user, and assistant text combined
    """
    try:
        results = {}

        # Process each model
        for model in request.models:
            total_tokens = await estimate_tokens(
                system_text=request.systemText or "",
                user_text=request.userText or "",
                assistant_text=request.assistantText or "",
                model=model
            )
            results[model] = total_tokens

        return TokenizeResponse(results=results)

    except Exception as e:
        logger.error(f"Tokenization error: {e}")
        raise HTTPException(status_code=500, detail="Internal tokenization error")


@router.post("/tokenize/quick", response_model=TokenizeResponse)
async def quick_estimate_tokens(request: TokenizeRequest):
    """Fast heuristic estimation without API calls"""
    try:
        results = {}

        for model in request.models:
            system_tokens = estimate_tokens_sync(request.systemText, model)
            user_tokens = estimate_tokens_sync(request.userText, model)
            assistant_tokens = estimate_tokens_sync(request.assistantText, model)

            total_tokens = system_tokens + user_tokens + assistant_tokens
            results[model] = total_tokens

        return TokenizeResponse(results=results)

    except Exception as e:
        logger.error(f"Quick estimation error: {e}")
        raise HTTPException(status_code=500, detail="Internal estimation error")


@router.post("/tokenize/precise", response_model=TokenizeResponse)
async def precise_count_tokens(request: TokenizeRequest):
    """Precise count via provider APIs"""
    try:
        results = {}

        # Process each model
        for model in request.models:
            # For Claude, pass parts separately
            if model.startswith('claude-'):
                total_tokens = await count_claude_tokens(
                    request.systemText,
                    request.userText,
                    request.assistantText,
                    model
                )
            else:
                # For other models, calculate separately and sum
                system_tokens = await estimate_tokens(request.systemText, "", "", model)
                user_tokens = await estimate_tokens("", request.userText, "", model)
                assistant_tokens = await estimate_tokens("", "", request.assistantText, model)
                total_tokens = system_tokens + user_tokens + assistant_tokens

            results[model] = total_tokens

        return TokenizeResponse(results=results)

    except Exception as e:
        logger.error(f"Precise tokenization error: {e}")
        raise HTTPException(status_code=500, detail="Internal tokenization error")


# Keep existing endpoint for backward compatibility
@router.post("/tokenize/estimate", response_model=TokenizeResponse)
async def estimate_tokens_fast(request: TokenizeRequest):
    """
    Fast token estimation using synchronous heuristics
    Used for real-time preview without API calls
    (Deprecated: use /tokenize/quick instead)
    """
    try:
        results = {}

        for model in request.models:
            system_tokens = estimate_tokens_sync(request.systemText, model)
            user_tokens = estimate_tokens_sync(request.userText, model)
            assistant_tokens = estimate_tokens_sync(request.assistantText, model)

            total_tokens = system_tokens + user_tokens + assistant_tokens
            results[model] = total_tokens

        return TokenizeResponse(results=results)

    except Exception as e:
        logger.error(f"Fast estimation error: {e}")
        raise HTTPException(status_code=500, detail="Internal estimation error")
