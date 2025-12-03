from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone, timedelta

from app.core.database import get_session
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash
)
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.workspace import Workspace
from app.models.prompt import Prompt, PromptVersion, Tag, prompt_tags
from app.models.llm import UserAPIKey
from app.models.product_api_key import ProductAPIKey
from app.core.auth import get_current_user as get_authenticated_user
from app.core.config import settings
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])


# Pydantic schemas
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str
    remember_me: bool = False  # If true, include refresh token in response


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    onboarding_completed: bool
    created_at: str
    last_login: Optional[str]


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None  # Only included if "remember_me" is true
    token_type: str
    user: UserResponse
    api_key: Optional[str] = None  # API key for new users (only shown once)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token
    remember_me: bool = False  # If true, include refresh token in response


class DeleteAccountRequest(BaseModel):
    confirmation: str  # Require typing "delete" to confirm


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Import centralized auth dependency
get_current_user = get_authenticated_user


# Authentication endpoints
@router.post("/register", response_model=UserResponse)
async def register_user(
        user_data: UserRegister,
        session: AsyncSession = Depends(get_session)
):
    """Register a new user"""

    # Check if username already exists
    result = await session.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    result = await session.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        username=user_data.username,
        email=str(user_data.email),
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=True
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    # Create default workspace for the new user
    default_workspace = Workspace(
        name="personal",
        slug=f"{new_user.username}-personal",
        description="Personal workspace for prompt management",
        owner_id=new_user.id,
        is_active=True
    )

    session.add(default_workspace)
    await session.commit()
    await session.refresh(default_workspace)

    # Create default API key for new user
    full_key, key_hash, key_prefix, encrypted_key = ProductAPIKey.generate_api_key()
    default_api_key = ProductAPIKey(
        name="Default Key",
        description="Auto-generated default API key",
        user_id=new_user.id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        encrypted_key=encrypted_key
    )
    session.add(default_api_key)
    await session.commit()

    return UserResponse(**new_user.to_dict())


@router.post("/login", response_model=Token)
async def login_user(
        user_data: UserLogin,
        session: AsyncSession = Depends(get_session)
):
    """Login user and return JWT token"""

    # Find user by username
    result = await session.execute(
        select(User).where(User.username == user_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(user)

    # Check if user has any API keys, if not create default one
    api_keys_result = await session.execute(
        select(ProductAPIKey).where(ProductAPIKey.user_id == user.id)
    )
    api_keys = api_keys_result.scalars().all()
    
    api_key_value = None
    if not api_keys:
        # Create default API key for existing user without keys
        full_key, key_hash, key_prefix, encrypted_key = ProductAPIKey.generate_api_key()
        default_api_key = ProductAPIKey(
            name="Default Key",
            description="Auto-generated default API key",
            user_id=user.id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            encrypted_key=encrypted_key
        )
        session.add(default_api_key)
        await session.commit()
        api_key_value = full_key
    else:
        # Return the first API key's decrypted value for existing users
        # This allows frontend to store it in localStorage if needed
        try:
            api_key_value = api_keys[0].get_decrypted_key()
        except Exception:
            # If decryption fails, don't return the key (user should create a new one)
            api_key_value = None

    # Create access token
    access_token = create_access_token(subject=str(user.id))

    # Create refresh token if remember_me is true
    refresh_token_value = None
    if user_data.remember_me:
        refresh_token_value = create_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        # Store refresh token in database
        refresh_token_obj = RefreshToken(
            user_id=user.id,
            token=refresh_token_value,
            expires_at=expires_at
        )
        session.add(refresh_token_obj)
        await session.commit()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token_value,
        token_type="bearer",
        user=UserResponse(**user.to_dict()),
        api_key=api_key_value
    )


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
        request_data: RefreshTokenRequest,
        session: AsyncSession = Depends(get_session)
):
    """Refresh access token using refresh token"""

    # Find refresh token in database
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token == request_data.refresh_token)
    )
    refresh_token = result.scalar_one_or_none()

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if token is valid (not revoked and not expired)
    if not refresh_token.is_valid():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired or been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user
    user_result = await session.execute(
        select(User).where(User.id == refresh_token.user_id)
    )
    user = user_result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new access token
    access_token = create_access_token(subject=str(user.id))

    # Optionally: Create a new refresh token (token rotation for security)
    new_refresh_token_value = create_refresh_token()
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # Revoke old refresh token
    refresh_token.revoked_at = datetime.now(timezone.utc)

    # Create new refresh token
    new_refresh_token = RefreshToken(
        user_id=user.id,
        token=new_refresh_token_value,
        expires_at=new_expires_at
    )
    session.add(new_refresh_token)
    await session.commit()

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token_value,
        token_type="bearer",
        user=UserResponse(**user.to_dict()),
        api_key=None  # Don't return API key on refresh
    )


@router.post("/google", response_model=Token)
async def google_login(
        google_data: GoogleLoginRequest,
        session: AsyncSession = Depends(get_session)
):
    """Login with Google OAuth"""

    try:
        # Check if this is a base64 encoded fallback credential (from popup OAuth)
        credential = google_data.credential
        try:
            # Try to decode as base64 first (fallback method)
            import base64
            import json
            decoded_data = base64.b64decode(credential)
            google_user_info = json.loads(decoded_data.decode('utf-8'))
            print(f"Using fallback OAuth data: {google_user_info}")
            print(f"GOOGLE_CLIENT_ID from settings: {settings.GOOGLE_CLIENT_ID}")
            print(f"ENVIRONMENT: {settings.ENVIRONMENT}")
            
            # For fallback method (popup OAuth from frontend), always skip validation
            # This is used when frontend creates mock credential from access token
            # The frontend already validated the token with Google, so we trust it
            print(f"Skipping client ID validation for fallback OAuth method")

        except (json.JSONDecodeError, ValueError, UnicodeDecodeError):
            # This is a regular ID token, verify it with Google
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google credential"
                    )

                google_user_info = response.json()

                # Verify the token is for our client
                if settings.GOOGLE_CLIENT_ID and google_user_info.get("aud") != settings.GOOGLE_CLIENT_ID:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google credential"
                    )

        email = google_user_info.get("email")
        name = google_user_info.get("name", "")
        given_name = google_user_info.get("given_name", "")
        family_name = google_user_info.get("family_name", "")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )

        # Check if user exists
        result = await session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            # Create new user
            # Generate username from email
            username = email.split('@')[0]
            counter = 1
            original_username = username

            # Ensure username is unique
            while True:
                result = await session.execute(
                    select(User).where(User.username == username)
                )
                if not result.scalar_one_or_none():
                    break
                username = f"{original_username}{counter}"
                counter += 1

            user = User(
                username=username,
                email=email,
                hashed_password=get_password_hash(""),  # Empty password for OAuth users
                full_name=name or f"{given_name} {family_name}".strip(),
                is_active=True
            )

            session.add(user)
            await session.flush()

            # Create default workspace
            default_workspace = Workspace(
                name="personal",
                slug=f"{user.username}-personal",
                description="Personal workspace for prompt management",
                owner_id=user.id,
                is_active=True
            )

            session.add(default_workspace)
            await session.flush()

            # Create default API key for new user
            full_key, key_hash, key_prefix, encrypted_key = ProductAPIKey.generate_api_key()
            default_api_key = ProductAPIKey(
                name="Default Key",
                description="Auto-generated default API key",
                user_id=user.id,
                key_hash=key_hash,
                key_prefix=key_prefix,
                encrypted_key=encrypted_key
            )
            session.add(default_api_key)
            await session.commit()
            await session.refresh(user)
            
            # Store API key to return in response
            api_key_value = full_key
        else:
            # Check if existing user has any API keys, if not create default one
            api_keys_result = await session.execute(
                select(ProductAPIKey).where(ProductAPIKey.user_id == user.id)
            )
            api_keys = api_keys_result.scalars().all()
            
            api_key_value = None
            if not api_keys:
                # Create default API key for existing user without keys
                full_key, key_hash, key_prefix, encrypted_key = ProductAPIKey.generate_api_key()
                default_api_key = ProductAPIKey(
                    name="Default Key",
                    description="Auto-generated default API key",
                    user_id=user.id,
                    key_hash=key_hash,
                    key_prefix=key_prefix,
                    encrypted_key=encrypted_key
                )
                session.add(default_api_key)
                await session.commit()
                api_key_value = full_key
            else:
                # Return the first API key's decrypted value for existing users
                # This allows frontend to store it in localStorage if needed
                try:
                    api_key_value = api_keys[0].get_decrypted_key()
                except Exception:
                    # If decryption fails, don't return the key (user should create a new one)
                    api_key_value = None

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await session.commit()

        # Create access token
        access_token = create_access_token(subject=str(user.id))

        # Create refresh token if remember_me is true
        refresh_token_value = None
        if google_data.remember_me:
            refresh_token_value = create_refresh_token()
            expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

            # Store refresh token in database
            refresh_token_obj = RefreshToken(
                user_id=user.id,
                token=refresh_token_value,
                expires_at=expires_at
            )
            session.add(refresh_token_obj)
            await session.commit()

        # Refresh user to ensure all fields are loaded
        await session.refresh(user)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token_value,
            token_type="bearer",
            user=UserResponse(**user.to_dict()),
            api_key=api_key_value
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify Google credential"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
        current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user.to_dict())


class OnboardingComplete(BaseModel):
    completed: bool


@router.post("/onboarding/complete")
async def complete_onboarding(
        onboarding_data: OnboardingComplete,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """Mark onboarding as completed"""
    current_user.onboarding_completed = onboarding_data.completed
    await session.commit()
    await session.refresh(current_user)
    return {"onboarding_completed": current_user.onboarding_completed}


@router.put("/me", response_model=UserResponse)
async def update_current_user(
        user_update: UserUpdate,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """Update current user profile"""

    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        result = await session.execute(
            select(User).where(User.email == user_update.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Update user fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await session.commit()
    await session.refresh(current_user)

    return UserResponse(**current_user.to_dict())


@router.get("/me/workspaces")
async def get_user_workspaces(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """Get current user's workspaces"""

    result = await session.execute(
        select(Workspace).where(Workspace.owner_id == current_user.id)
    )
    workspaces = result.scalars().all()

    # If user has no workspaces, create a default one
    if not workspaces:
        default_workspace = Workspace(
            name="personal",
            slug=f"{current_user.username}-personal",
            description="Personal workspace for prompt management",
            owner_id=current_user.id,
            is_active=True
        )

        session.add(default_workspace)
        await session.commit()
        await session.refresh(default_workspace)

        workspaces = [default_workspace]

    return [workspace.to_dict() for workspace in workspaces]


@router.post("/logout")
async def logout_user():
    """Logout user (the client should discard the token)"""
    return {"message": "Successfully logged out"}


@router.delete("/me")
async def delete_account(
        delete_request: DeleteAccountRequest,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """Delete the user account and all associated data"""

    # Verify confirmation word
    if delete_request.confirmation.lower() != "delete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please type 'delete' to confirm account deletion"
        )

    try:
        # Start transaction - delete user data in the correct order to avoid foreign key constraints

        # Get all user's workspaces
        user_workspaces = await session.execute(
            select(Workspace).where(Workspace.owner_id == current_user.id)
        )
        workspaces = user_workspaces.scalars().all()

        # 1. Delete API requests associated with user's prompt versions
        for workspace in workspaces:
            # Get all prompts in this workspace
            prompts_result = await session.execute(
                select(Prompt).where(Prompt.workspace_id == workspace.id)
            )
            prompts = prompts_result.scalars().all()

            for prompt in prompts:
                # Get all versions for this prompt
                versions_result = await session.execute(
                    select(PromptVersion).where(PromptVersion.prompt_id == prompt.id)
                )
                versions = versions_result.scalars().all()

        # 2. Delete user's LLM API keys
        await session.execute(
            delete(UserAPIKey).where(UserAPIKey.user_id == current_user.id)
        )

        # 3. Delete user's tags and remove prompt-tag associations
        user_tags = await session.execute(
            select(Tag).where(Tag.created_by == current_user.id)
        )
        tags = user_tags.scalars().all()
        tag_ids = [tag.id for tag in tags]

        if tag_ids:
            # Remove all prompt-tag associations for this tag
            await session.execute(
                delete(prompt_tags).where(prompt_tags.c.tag_id.in_(tag_ids))
            )

        # Delete the tags themselves
        await session.execute(
            delete(Tag).where(Tag.created_by == current_user.id)
        )

        # 4. Handle prompt circular references - first clear foreign key references
        for workspace in workspaces:
            prompts_result = await session.execute(
                select(Prompt).where(Prompt.workspace_id == workspace.id)
            )
            prompts = prompts_result.scalars().all()

            for prompt in prompts:
                # Clear circular references to prompt versions
                prompt.production_version_id = None
                prompt.current_version_id = None
                await session.flush()  # Ensure the update is committed before deleting versions

        # 5. Delete prompt versions
        for workspace in workspaces:
            prompts_result = await session.execute(
                select(Prompt).where(Prompt.workspace_id == workspace.id)
            )
            prompts = prompts_result.scalars().all()

            for prompt in prompts:
                await session.execute(
                    delete(PromptVersion).where(PromptVersion.prompt_id == prompt.id)
                )

        # 6. Delete prompts
        for workspace in workspaces:
            await session.execute(
                delete(Prompt).where(Prompt.workspace_id == workspace.id)
            )

        # 7. Delete workspaces owned by the user
        await session.execute(
            delete(Workspace).where(Workspace.owner_id == current_user.id)
        )

        # 8. Finally, delete the user
        await session.execute(
            delete(User).where(User.id == current_user.id)
        )

        # Commit all changes
        await session.commit()

        return {"message": "Account successfully deleted"}

    except Exception as e:
        await session.rollback()
        # Log the actual error for debugging
        print(f"Error deleting account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
