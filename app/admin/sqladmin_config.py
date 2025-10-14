from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.concurrency import run_in_threadpool
from fastapi import FastAPI
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from wtforms import Form, StringField, BooleanField, PasswordField
from wtforms.validators import DataRequired, Email, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload, aliased

from app.core.database import sync_engine, SyncSessionLocal
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.models.workspace import Workspace
from app.models.prompt import Prompt, PromptVersion, Tag
from app.models.llm import LLMProvider, UserAPIKey
from app.models.product_api_key import ProductAPIKey, ProductAPILog
from app.models.user_limits import UserLimits, GlobalLimits, UserAPIUsage


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username, password = form["username"], form["password"]

        with SyncSessionLocal() as session:
            user_result = session.execute(
                select(User).where(User.username == username)
            )
            user = user_result.scalar_one_or_none()

            if user and verify_password(password, user.hashed_password):
                if user.is_superuser:
                    request.session.update({"token": "authenticated", "user_id": str(user.id)})
                    user.last_login = datetime.now(timezone.utc)
                    session.commit()
                    session.refresh(user)
                    return True

        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        return token == "authenticated"


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.username, User.email, User.is_active, User.created_at]
    column_details_exclude_list = [User.hashed_password]
    form_excluded_columns = [User.id, User.hashed_password, User.created_at, User.updated_at, User.last_login]

    # Add search functionality for username and email
    # column_searchable_list = [User.username, User.email]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Show more items per page for compact view
    page_size = 25
    page_size_options = [10, 25, 50, 100]

    can_delete = True
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-users"

    async def scaffold_form(self) -> type[Form]:
        class UserForm(Form):
            username = StringField('Username', validators=[DataRequired()])
            email = StringField('Email', validators=[DataRequired(), Email()])
            full_name = StringField('Full Name', validators=[Optional()])
            password = PasswordField('Password', validators=[DataRequired()])
            is_active = BooleanField('Is Active', default=True)
            is_superuser = BooleanField('Is Superuser', default=False)

        return UserForm

    async def insert_model(self, request: Request, data: dict) -> User:
        def _insert_sync() -> User:
            password = data.pop('password', None)
            if not password:
                raise ValueError("Password is required")

            data['hashed_password'] = get_password_hash(password)

            with SyncSessionLocal() as session:
                # 1) Create user
                user = User(**data)
                session.add(user)
                session.commit()
                session.refresh(user)

                # 2) Check if this user already has a personal workspace
                existing_ws = session.execute(
                    select(Workspace).where(
                        Workspace.owner_id == user.id,
                        Workspace.slug == "personal"
                    )
                ).scalar_one_or_none()

                if not existing_ws:
                    # 3) Create personal workspace
                    ws = Workspace(
                        name="personal",
                        slug="personal",
                        owner_id=user.id,
                        is_active=True,
                    )
                    session.add(ws)
                    try:
                        session.commit()
                        session.refresh(ws)
                    except IntegrityError:
                        session.rollback()
                        fallback_slug = f"personal-{str(user.id)[:8]}"
                        ws = Workspace(
                            name="personal",
                            slug=fallback_slug,
                            owner_id=user.id,
                            is_active=True,
                        )
                        session.add(ws)
                        session.commit()
                        session.refresh(ws)

                    # 4) Add owner as workspace member with admin role
                    ws.members.append(user)
                    session.commit()

                return user

        return await run_in_threadpool(_insert_sync)

    async def update_model(self, request: Request, pk: str, data: dict) -> User:
        """Update user (in threadpool)."""

        def _update_sync() -> User:
            password = data.pop('password', None)
            if password:
                data['hashed_password'] = get_password_hash(password)

            with SyncSessionLocal() as session:
                result = session.execute(select(User).where(User.id == pk))
                user = result.scalar_one()

                for key, value in data.items():
                    if hasattr(user, key):
                        setattr(user, key, value)

                session.commit()
                session.refresh(user)
                return user

        return await run_in_threadpool(_update_sync)

    async def delete_model(self, request: Request, pk: str) -> bool:
        """Custom delete method to handle workspace ownership transfer before user deletion."""

        def _delete_sync() -> bool:
            with SyncSessionLocal() as session:
                # Get the user to be deleted
                result = session.execute(select(User).where(User.id == pk))
                user_to_delete = result.scalar_one_or_none()

                if not user_to_delete:
                    return False

                # Check if user owns any workspaces
                workspaces_result = session.execute(
                    select(Workspace).where(Workspace.owner_id == pk)
                )
                owned_workspaces = workspaces_result.scalars().all()

                # Check if this would leave the system without any admin users
                admin_count_result = session.execute(
                    select(User).where(
                        User.is_superuser == True,
                        User.is_active == True
                    )
                )
                total_admins = len(admin_count_result.scalars().all())

                if user_to_delete.is_superuser and total_admins <= 1:
                    raise ValueError(
                        f"Cannot delete user {user_to_delete.username}: "
                        f"This is the only active admin user in the system. "
                        f"Please create another admin user before deleting this one."
                    )

                if owned_workspaces:
                    # Find another admin user to transfer ownership to
                    admin_result = session.execute(
                        select(User).where(
                            User.is_superuser == True,
                            User.id != pk,
                            User.is_active == True
                        ).limit(1)
                    )
                    new_owner = admin_result.scalar_one_or_none()

                    if not new_owner:
                        # No other admin available - cannot delete user
                        raise ValueError(
                            f"Cannot delete user {user_to_delete.username}: "
                            f"User owns {len(owned_workspaces)} workspace(s) and no other admin user "
                            f"is available to transfer ownership to. Please create another admin user first."
                        )

                    # Transfer ownership of all workspaces to the new owner
                    for workspace in owned_workspaces:
                        workspace.owner_id = new_owner.id
                        # Also ensure the new owner is a member of the workspace if not already
                        if new_owner not in workspace.members:
                            workspace.members.append(new_owner)

                    session.commit()
                    print(f"Transferred ownership of {len(owned_workspaces)} workspace(s) from "
                          f"{user_to_delete.username} to {new_owner.username}")

                # Now safe to delete the user
                session.delete(user_to_delete)
                session.commit()
                return True

        try:
            return await run_in_threadpool(_delete_sync)
        except ValueError as e:
            # Re-raise ValueError to show an error message in admin interface
            raise e
        except Exception as e:
            # Handle other database errors
            raise ValueError(f"Failed to delete user: {str(e)}")


class WorkspaceAdmin(ModelView, model=Workspace):
    column_list = [
        Workspace.id,
        Workspace.name,
        Workspace.slug,
        Workspace.owner,
        Workspace.is_active,
        Workspace.created_at,
    ]
    column_list_selectin_related = [Workspace.owner]
    column_details_selectin_related = [Workspace.owner]

    # Add search functionality for workspace name and owner
    # column_searchable_list = [Workspace.name, Workspace.slug]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Show more items per page for compact view
    page_size = 25
    page_size_options = [10, 25, 50, 100]

    column_labels = {
        Workspace.owner: "Owner",
    }

    column_formatters = {
        Workspace.owner: lambda obj, attr: obj.owner.username if obj.owner else str(obj.owner_id)
    }

    name = "Workspace"
    name_plural = "Workspaces"
    icon = "fa-solid fa-building"


class TagAdmin(ModelView, model=Tag):
    column_list = [Tag.id, Tag.name, Tag.color, Tag.creator, Tag.created_at]
    column_list_selectin_related = [Tag.creator]
    column_details_selectin_related = [Tag.creator]

    column_filters = [
        Tag.created_at,
        Tag.creator,  # Filter by creator relationship
    ]

    column_searchable_list = [Tag.name]

    column_labels = {
        Tag.creator: "Creator",
    }

    column_formatters = {
        Tag.creator: lambda obj, attr: getattr(obj.creator, "username", None) or str(obj.created_by)
    }

    name = "Tag"
    name_plural = "Tags"
    icon = "fa-solid fa-tag"

    # Show more items per page for compact view
    page_size = 25
    page_size_options = [10, 25, 50, 100]

    # Custom search will be handled by the built-in functionality
    # with column_searchable_list and column_filters


class PromptAdmin(ModelView, model=Prompt):
    column_list = [
        Prompt.id,
        Prompt.name,
        Prompt.slug,
        Prompt.status,
        Prompt.workspace,
        Prompt.creator,
        Prompt.updater,
        Prompt.created_at,
        Prompt.updated_at
    ]

    column_list_selectin_related = [Prompt.workspace, Prompt.creator, Prompt.updater]
    column_details_selectin_related = [
        Prompt.workspace,
        Prompt.creator,
        Prompt.updater,
        Prompt.versions,
        Prompt.production_version,
        Prompt.current_version
    ]

    # Add search functionality for prompt name, slug, and creator
    # column_searchable_list = [Prompt.name, Prompt.slug]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        Prompt.workspace: "Workspace",
        Prompt.creator: "Creator",
        Prompt.updater: "Last Updated By",
    }

    column_formatters = {
        Prompt.workspace: lambda obj, attr: getattr(obj.workspace, "name", None) or str(obj.workspace_id),
        Prompt.creator: lambda obj, attr: getattr(obj.creator, "username", None) or str(obj.created_by),
        Prompt.updater: lambda obj, attr: getattr(obj.updater, "username", None) or str(
            obj.updated_by) if obj.updated_by else "Not updated"
    }

    name = "Prompt"
    name_plural = "Prompts"
    icon = "fa-solid fa-file-text"

    # Show more items per page for a compact view
    page_size = 25
    page_size_options = [10, 25, 50, 100]

    def scaffold_list_query(self):
        """Custom list query that includes creator for searching"""
        user_alias = aliased(User)
        return (
            select(Prompt)
            .options(
                selectinload(Prompt.workspace),
                selectinload(Prompt.creator),
                selectinload(Prompt.updater)
            )
            .outerjoin(user_alias, Prompt.created_by == user_alias.id)
        )

    def scaffold_search_query(self, query, search_term):
        """Custom search that includes a creator username"""
        if not search_term:
            return query

        user_alias = aliased(User)

        # Re-build the query with proper alias for search
        return (
            select(Prompt)
            .options(
                selectinload(Prompt.workspace),
                selectinload(Prompt.creator),
                selectinload(Prompt.updater)
            )
            .outerjoin(user_alias, Prompt.created_by == user_alias.id)
            .where(
                or_(
                    Prompt.name.ilike(f"%{search_term}%"),
                    Prompt.slug.ilike(f"%{search_term}%"),
                    user_alias.username.ilike(f"%{search_term}%"),
                    user_alias.email.ilike(f"%{search_term}%")
                )
            )
        )


class PromptVersionAdmin(ModelView, model=PromptVersion):
    column_list = [
        PromptVersion.id,
        PromptVersion.prompt,
        PromptVersion.version_number,
        PromptVersion.status,
        PromptVersion.usage_count,
        PromptVersion.creator,
        PromptVersion.updater,
        PromptVersion.created_at,
        PromptVersion.updated_at
    ]

    column_list_selectin_related = [PromptVersion.prompt, PromptVersion.creator, PromptVersion.updater]
    column_details_selectin_related = [PromptVersion.prompt, PromptVersion.creator, PromptVersion.updater]

    # Add search functionality - we can search by version number
    # column_searchable_list = [PromptVersion.version_number]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        PromptVersion.prompt: "Prompt",
        PromptVersion.creator: "Creator",
        PromptVersion.updater: "Last Updated By",
    }

    column_formatters = {
        PromptVersion.prompt: lambda obj, attr: getattr(obj.prompt, "name", None) or str(obj.prompt_id),
        PromptVersion.creator: lambda obj, attr: getattr(obj.creator, "username", None) or str(obj.created_by),
        PromptVersion.updater: lambda obj, attr: getattr(obj.updater, "username", None) or str(
            obj.updated_by) if obj.updated_by else "Not updated"
    }

    # Exclude large JSON fields from forms for better UX
    form_excluded_columns = [
        PromptVersion.id,
        PromptVersion.created_at,
        PromptVersion.updated_at,
        PromptVersion.deployed_at
    ]

    name = "Prompt Version"
    name_plural = "Prompt Versions"
    icon = "fa-solid fa-code-branch"

    # Show more items per page for a compact view
    page_size = 25
    page_size_options = [10, 25, 50, 100]

    def scaffold_list_query(self):
        """Custom list query that includes creator and prompt for searching"""
        return (
            select(PromptVersion)
            .options(
                selectinload(PromptVersion.prompt),
                selectinload(PromptVersion.creator),
                selectinload(PromptVersion.updater)
            )
            .join(User, PromptVersion.created_by == User.id, isouter=True)
            .join(Prompt, PromptVersion.prompt_id == Prompt.id, isouter=True)
        )

    def scaffold_search_query(self, query, search_term):
        """Custom search that includes creator username and prompt name"""
        if not search_term:
            return query

        return query.where(
            or_(
                PromptVersion.version_number.ilike(f"%{search_term}%"),
                Prompt.name.ilike(f"%{search_term}%"),
                User.username.ilike(f"%{search_term}%"),
                User.email.ilike(f"%{search_term}%")
            )
        )


class LLMProviderAdmin(ModelView, model=LLMProvider):
    """Admin interface for LLM Providers"""
    column_list = [
        LLMProvider.name,
        LLMProvider.display_name,
        LLMProvider.models,
        LLMProvider.is_active,
        LLMProvider.api_base_url,
        LLMProvider.created_at,
        LLMProvider.updated_at
    ]

    # column_searchable_list = [LLMProvider.name, LLMProvider.display_name]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        LLMProvider.name: "Provider Name",
        LLMProvider.display_name: "Display Name",
        LLMProvider.models: "Available Models",
        LLMProvider.is_active: "Active",
        LLMProvider.api_base_url: "API Base URL",
        LLMProvider.created_at: "Created",
        LLMProvider.updated_at: "Updated"
    }

    column_formatters = {
        LLMProvider.models: lambda obj, attr: ", ".join([m.get("name", m.get("id", "Unknown")) for m in (obj.models or [])]) if obj.models else "No models configured"
    }

    form_excluded_columns = [
        LLMProvider.id,
        LLMProvider.created_at,
        LLMProvider.updated_at,
        LLMProvider.user_api_keys
    ]

    name = "LLM Provider"
    name_plural = "LLM Providers"
    icon = "fa-solid fa-robot"

    page_size = 25
    page_size_options = [10, 25, 50, 100]


class UserAPIKeyAdmin(ModelView, model=UserAPIKey):
    """Admin interface for User API Keys"""
    column_list = [
        UserAPIKey.name,
        UserAPIKey.user,
        UserAPIKey.provider,
        UserAPIKey.created_at,
        UserAPIKey.updated_at
    ]

    column_list_selectin_related = [UserAPIKey.user, UserAPIKey.provider]
    column_details_selectin_related = [UserAPIKey.user, UserAPIKey.provider]

    # column_searchable_list = [UserAPIKey.name]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        UserAPIKey.name: "Key Name",
        UserAPIKey.user: "User",
        UserAPIKey.provider: "Provider",
        UserAPIKey.encrypted_key: "API Key",
        UserAPIKey.created_at: "Created",
        UserAPIKey.updated_at: "Updated"
    }

    column_formatters = {
        UserAPIKey.user: lambda obj, attr: getattr(obj.user, "username", None) if obj.user else str(obj.user_id),
        UserAPIKey.provider: lambda obj, attr: getattr(obj.provider, "display_name", None) if obj.provider else str(
            obj.provider_id),
        UserAPIKey.encrypted_key: lambda obj, attr: "••••••••" + obj.encrypted_key[-4:] if obj.encrypted_key and len(
            obj.encrypted_key) > 4 else "••••••••"
    }

    form_excluded_columns = [
        UserAPIKey.id,
        UserAPIKey.created_at,
        UserAPIKey.updated_at
    ]

    # Security: Don't show the actual API key in forms by default
    column_details_exclude_list = [UserAPIKey.encrypted_key]

    name = "User LLM API Key"
    name_plural = "User LLM API Keys"
    icon = "fa-solid fa-key"

    page_size = 25
    page_size_options = [10, 25, 50, 100]

    def scaffold_list_query(self):
        """Custom list query that includes user and provider for searching"""
        return (
            select(UserAPIKey)
            .options(
                selectinload(UserAPIKey.user),
                selectinload(UserAPIKey.provider)
            )
            .join(User, UserAPIKey.user_id == User.id, isouter=True)
            .join(LLMProvider, UserAPIKey.provider_id == LLMProvider.id, isouter=True)
        )

    def scaffold_search_query(self, query, search_term):
        """Custom search that includes user and provider names"""
        if not search_term:
            return query

        return query.where(
            or_(
                UserAPIKey.name.ilike(f"%{search_term}%"),
                User.username.ilike(f"%{search_term}%"),
                User.email.ilike(f"%{search_term}%"),
                LLMProvider.name.ilike(f"%{search_term}%"),
                LLMProvider.display_name.ilike(f"%{search_term}%")
            )
        )


class ProductAPIKeyAdmin(ModelView, model=ProductAPIKey):
    """Admin interface for Product API Keys"""
    column_list = [
        ProductAPIKey.name,
        ProductAPIKey.key_prefix,
        ProductAPIKey.user,
        ProductAPIKey.total_requests,
        ProductAPIKey.last_used_at,
        ProductAPIKey.created_at
    ]

    column_list_selectin_related = [ProductAPIKey.user]
    column_details_selectin_related = [ProductAPIKey.user]

    # column_searchable_list = [ProductAPIKey.name, ProductAPIKey.key_prefix]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        ProductAPIKey.name: "Key Name",
        ProductAPIKey.key_prefix: "Key Prefix",
        ProductAPIKey.user: "Owner",
        ProductAPIKey.total_requests: "Total Requests",
        ProductAPIKey.last_used_at: "Last Used",
        ProductAPIKey.created_at: "Created"
    }

    column_formatters = {
        ProductAPIKey.user: lambda obj, attr: getattr(obj.user, "username", None) if obj.user else str(obj.user_id),
        ProductAPIKey.key_prefix: lambda obj, attr: obj.key_prefix + "••••••••" if obj.key_prefix else "Not set",
    }

    form_excluded_columns = [
        ProductAPIKey.id,
        ProductAPIKey.key_hash,
        ProductAPIKey.key_prefix,
        ProductAPIKey.total_requests,
        ProductAPIKey.last_used_at,
        ProductAPIKey.created_at,
        ProductAPIKey.updated_at
    ]

    # Security: Don't show the actual API key hash
    column_details_exclude_list = [ProductAPIKey.key_hash]

    name = "Product API Key"
    name_plural = "Product API Keys"
    icon = "fa-solid fa-shield-halved"

    page_size = 25
    page_size_options = [10, 25, 50, 100]

    def scaffold_list_query(self):
        """Custom list query that includes user for searching"""
        return (
            select(ProductAPIKey)
            .options(
                selectinload(ProductAPIKey.user)
            )
            .join(User, ProductAPIKey.user_id == User.id, isouter=True)
        )

    def scaffold_search_query(self, query, search_term):
        """Custom search that includes usernames"""
        if not search_term:
            return query

        return query.where(
            or_(
                ProductAPIKey.name.ilike(f"%{search_term}%"),
                ProductAPIKey.key_prefix.ilike(f"%{search_term}%"),
                User.username.ilike(f"%{search_term}%"),
                User.email.ilike(f"%{search_term}%")
            )
        )


class ProductAPILogAdmin(ModelView, model=ProductAPILog):
    """Admin interface for Product API Logs"""
    column_list = [
        ProductAPILog.api_key,
        ProductAPILog.method,
        ProductAPILog.endpoint,
        ProductAPILog.status_code,
        ProductAPILog.latency_ms,
        ProductAPILog.created_at
    ]

    column_list_selectin_related = [ProductAPILog.api_key]
    column_details_selectin_related = [ProductAPILog.api_key]

    # column_searchable_list = [ProductAPILog.endpoint, ProductAPILog.method]  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        ProductAPILog.api_key: "API Key",
        ProductAPILog.method: "HTTP Method",
        ProductAPILog.endpoint: "Endpoint",
        ProductAPILog.status_code: "Status Code",
        ProductAPILog.latency_ms: "Latency (ms)",
        ProductAPILog.created_at: "Request Time"
    }

    column_formatters = {
        ProductAPILog.api_key: lambda obj,
                                      attr: f"{getattr(obj.api_key, 'name', 'Unknown')} ({getattr(obj.api_key, 'key_prefix', '')}••••••••)" if obj.api_key else str(
            obj.api_key_id),
    }

    # Read-only for audit trail
    can_create = False
    can_edit = False
    can_delete = True  # Allow deletion for cleanup

    # Exclude large JSON fields from detail view
    column_details_exclude_list = [
        ProductAPILog.request_body,
        ProductAPILog.response_body
    ]

    name = "Product API Log"
    name_plural = "Product API Logs"
    icon = "fa-solid fa-file-lines"

    page_size = 50
    page_size_options = [25, 50, 100, 200]

    def scaffold_list_query(self):
        """Custom list query that includes the API key for searching"""
        return (
            select(ProductAPILog)
            .options(
                selectinload(ProductAPILog.api_key)
            )
            .join(ProductAPIKey, ProductAPILog.api_key_id == ProductAPIKey.id, isouter=True)
        )


class GlobalLimitsAdmin(ModelView, model=GlobalLimits):
    """Admin interface for Global Limits"""
    column_list = [
        GlobalLimits.default_max_prompts,
        GlobalLimits.default_max_api_requests_per_day,
        GlobalLimits.is_active,
        GlobalLimits.created_at,
        GlobalLimits.updated_at
    ]

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        GlobalLimits.default_max_prompts: "Default Max Prompts",
        GlobalLimits.default_max_api_requests_per_day: "Default Max API Requests/Day",
        GlobalLimits.is_active: "Active",
        GlobalLimits.created_at: "Created",
        GlobalLimits.updated_at: "Updated"
    }

    form_excluded_columns = [
        GlobalLimits.id,
        GlobalLimits.created_at,
        GlobalLimits.updated_at
    ]

    name = "Global Limits"
    name_plural = "Global Limits"
    icon = "fa-solid fa-globe"

    page_size = 25
    page_size_options = [10, 25, 50, 100]


class UserLimitsAdmin(ModelView, model=UserLimits):
    """Admin interface for User Limits"""
    column_list = [
        UserLimits.user,
        UserLimits.max_prompts,
        UserLimits.max_api_requests_per_day,
        UserLimits.created_at,
        UserLimits.updated_at
    ]

    column_list_selectin_related = [UserLimits.user]
    column_details_selectin_related = [UserLimits.user]

    # column_searchable_list = []  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        UserLimits.user: "User",
        UserLimits.max_prompts: "Max Prompts",
        UserLimits.max_api_requests_per_day: "Max API Requests/Day",
        UserLimits.created_at: "Created",
        UserLimits.updated_at: "Updated"
    }

    column_formatters = {
        UserLimits.user: lambda obj, attr: getattr(obj.user, "username", None) if obj.user else str(obj.user_id),
    }

    form_excluded_columns = [
        UserLimits.id,
        UserLimits.created_at,
        UserLimits.updated_at
    ]

    name = "User Limits"
    name_plural = "User Limits"
    icon = "fa-solid fa-user-cog"

    page_size = 25
    page_size_options = [10, 25, 50, 100]

    def scaffold_list_query(self):
        """Custom list query that includes user for searching"""
        return (
            select(UserLimits)
            .options(
                selectinload(UserLimits.user)
            )
            .join(User, UserLimits.user_id == User.id, isouter=True)
        )

    def scaffold_search_query(self, query, search_term):
        """Custom search that includes usernames"""
        if not search_term:
            return query

        return query.where(
            or_(
                User.username.ilike(f"%{search_term}%"),
                User.email.ilike(f"%{search_term}%")
            )
        )


class UserAPIUsageAdmin(ModelView, model=UserAPIUsage):
    """Admin interface for User API Usage"""
    column_list = [
        UserAPIUsage.user,
        UserAPIUsage.date,
        UserAPIUsage.api_requests_count,
        UserAPIUsage.created_at
    ]

    column_list_selectin_related = [UserAPIUsage.user]
    column_details_selectin_related = [UserAPIUsage.user]

    # column_searchable_list = []  # Temporarily disabled due to SQLAdmin 0.21.0 bug

    # Filters temporarily disabled due to SQLAdmin 0.21.0 compatibility issues

    column_labels = {
        UserAPIUsage.user: "User",
        UserAPIUsage.date: "Date",
        UserAPIUsage.api_requests_count: "API Requests Count",
        UserAPIUsage.created_at: "Created"
    }

    column_formatters = {
        UserAPIUsage.user: lambda obj, attr: getattr(obj.user, "username", None) if obj.user else str(obj.user_id),
        UserAPIUsage.date: lambda obj, attr: obj.date.date() if obj.date else "Unknown"
    }

    # Read-only - usage is automatically tracked
    can_create = False
    can_edit = False
    can_delete = True  # Allow deletion for cleanup

    form_excluded_columns = [
        UserAPIUsage.id,
        UserAPIUsage.created_at,
        UserAPIUsage.updated_at
    ]

    name = "User API Usage"
    name_plural = "User API Usage"
    icon = "fa-solid fa-chart-line"

    page_size = 50
    page_size_options = [25, 50, 100, 200]

    def scaffold_list_query(self):
        """Custom list query that includes user for searching"""
        return (
            select(UserAPIUsage)
            .options(
                selectinload(UserAPIUsage.user)
            )
            .join(User, UserAPIUsage.user_id == User.id, isouter=True)
            .order_by(UserAPIUsage.date.desc())
        )

    def scaffold_search_query(self, query, search_term):
        """Custom search that includes usernames"""
        if not search_term:
            return query

        return query.where(
            or_(
                User.username.ilike(f"%{search_term}%"),
                User.email.ilike(f"%{search_term}%")
            )
        )


def create_admin(app: FastAPI) -> Admin:
    """Create and configure admin instance"""
    import os

    # Get the path to the templates directory
    template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')

    admin = Admin(
        app=app,
        engine=sync_engine,
        authentication_backend=AdminAuth(secret_key=settings.SECRET_KEY),
        title="xR2 Admin Panel",
        base_url="/admin",
        templates_dir=template_dir
    )

    # Add model views in logical order
    admin.add_view(UserAdmin)
    admin.add_view(WorkspaceAdmin)
    admin.add_view(TagAdmin)
    admin.add_view(PromptAdmin)
    admin.add_view(PromptVersionAdmin)

    # LLM Management
    admin.add_view(LLMProviderAdmin)
    admin.add_view(UserAPIKeyAdmin)

    # Product API Management
    admin.add_view(ProductAPIKeyAdmin)
    admin.add_view(ProductAPILogAdmin)

    # Limits Management
    admin.add_view(GlobalLimitsAdmin)
    admin.add_view(UserLimitsAdmin)
    admin.add_view(UserAPIUsageAdmin)

    return admin
