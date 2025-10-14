import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Enum,
    Table,
    UniqueConstraint,
    Index,
    Text,
    Integer,
    JSON,
    event
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PromptStatus(str, enum.Enum):
    """Enum for prompt statuses"""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class VersionStatus(str, enum.Enum):
    """Enum for version statuses"""
    DRAFT = "draft"  # New version, has not been in production yet
    TESTING = "testing"  # Version under testing
    PRODUCTION = "production"  # Current active version
    INACTIVE = "inactive"  # Was in production, but no longer in use
    DEPRECATED = "deprecated"  # Outdated version, not recommended for use


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False, index=True)
    color = Column(String(7), nullable=False, default="#3B82F6")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        UniqueConstraint("created_by", "name", name="uq_tags_owner_name"),
    )

    def __repr__(self):
        return f"<Tag {self.name}>"


prompt_tags = Table(
    "prompt_tags",
    Base.metadata,
    Column("prompt_id", UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="CASCADE"),
           primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_pt_tag_id", "tag_id"),
    Index("ix_pt_prompt_id", "prompt_id"),
)


class Prompt(Base):
    """
    Prompt model - container for multiple versions
    This is what you create once and then iterate on with versions
    """
    __tablename__ = "prompts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), nullable=False, index=True)
    description = Column(Text)

    # Status of the prompt itself
    status = Column(Enum(PromptStatus), nullable=False, default=PromptStatus.DRAFT, index=True)

    # Workspace association
    workspace_id = Column(UUID(as_uuid=True), ForeignKey('workspaces.id'), nullable=False, index=True)

    # Currently deployed production version
    production_version_id = Column(UUID(as_uuid=True),
                                   ForeignKey('prompt_versions.id', use_alter=True, name='fk_production_version'),
                                   nullable=True)

    # Version being edited/viewed
    current_version_id = Column(UUID(as_uuid=True),
                                ForeignKey('prompt_versions.id', use_alter=True, name='fk_current_version'),
                                nullable=True)

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Last deployment info
    last_deployed_at = Column(DateTime(timezone=True), nullable=True)
    last_deployed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="prompts")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    last_deployer = relationship("User", foreign_keys=[last_deployed_by])

    versions = relationship("PromptVersion",
                            foreign_keys="PromptVersion.prompt_id",
                            back_populates="prompt",
                            cascade="all, delete-orphan",
                            order_by="PromptVersion.version_number.desc()")

    production_version = relationship("PromptVersion",
                                      foreign_keys=[production_version_id],
                                      post_update=True)
    current_version = relationship("PromptVersion",
                                   foreign_keys=[current_version_id],
                                   post_update=True)

    tags = relationship("Tag",
                        secondary=prompt_tags,
                        backref="prompts",
                        lazy="selectin")
    events = relationship("PromptEvent", back_populates="prompt", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('workspace_id', 'slug', name='_workspace_prompt_slug_uc'),
    )

    def __repr__(self):
        return f"<Prompt {self.name}>"

    def deploy_version(self, version_id: UUID, user_id: UUID):
        """Deploy a specific version to production"""
        self.production_version_id = version_id
        self.last_deployed_at = func.now()
        self.last_deployed_by = user_id
        self.updated_by = user_id
        for v in self.versions:
            if str(v.id) == str(version_id):
                v.status = VersionStatus.PRODUCTION
                v.deployed_at = func.now()
                v.deployed_by = user_id
            elif v.status == VersionStatus.PRODUCTION:
                v.status = VersionStatus.DEPRECATED


class PromptVersion(Base):
    """
    Model for individual prompt versions
    This is what you create when you want to modify a prompt
    """
    __tablename__ = "prompt_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey('prompts.id'), nullable=False, index=True)

    # Version details
    version_number = Column(Integer, nullable=False)

    # PROMPT CONTENT - Supporting multiple message types
    # For chat models (GPT-3.5, GPT-4, Claude, etc.)
    system_prompt = Column(Text, nullable=True)  # System message
    user_prompt = Column(Text, nullable=True)  # User message template
    assistant_prompt = Column(Text, nullable=True)  # Optional assistant prefix

    # For completion models or single prompts
    prompt_template = Column(Text, nullable=True)  # Single prompt template

    # Variables that can be used in any of the prompts above
    # Example: [{"name": "company_name", "type": "string", "required": true, "default": null, "description": "Company name"}]
    variables = Column(JSON, default=list)

    # Model configuration
    model_config = Column(JSON, default=dict)  # {model: "gpt-4", temperature: 0.7, max_tokens: 1000, etc.}

    # Status
    status = Column(Enum(VersionStatus), nullable=False, default=VersionStatus.DRAFT, index=True)

    # Deployment info
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    deployed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # Performance metrics
    success_rate = Column(Integer, nullable=True)  # Percentage 0-100
    avg_latency = Column(Integer, nullable=True)  # Milliseconds
    avg_tokens = Column(Integer, nullable=True)
    total_cost = Column(Integer, default=0)  # In cents

    # Usage statistics
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))

    # Change tracking
    changelog = Column(Text)  # What changed in this version

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    prompt = relationship("Prompt",
                          foreign_keys=[prompt_id],
                          back_populates="versions")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    deployer = relationship("User", foreign_keys=[deployed_by])
    public_shares = relationship("PublicShare", back_populates="prompt_version", cascade="all, delete-orphan")
    events = relationship("PromptEvent", back_populates="prompt_version", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('prompt_id', 'version_number', name='_prompt_version_number_uc'),
    )

    def __repr__(self):
        return f"<PromptVersion {self.prompt_id} v{self.version_number} ({self.status})>"

    def get_rendered_prompts(self, variables: dict) -> dict:
        """
        Render prompts with provided variables
        Returns dict with rendered system_prompt, user_prompt, etc.
        """

        def replace_variables(text: str, vars: dict) -> str:
            if not text:
                return text
            # Replace {variable_name} with actual values
            for key, value in vars.items():
                text = text.replace(f"{{{key}}}", str(value))
            return text

        result = {}
        if self.system_prompt:
            result['system'] = replace_variables(self.system_prompt, variables)
        if self.user_prompt:
            result['user'] = replace_variables(self.user_prompt, variables)
        if self.assistant_prompt:
            result['assistant'] = replace_variables(self.assistant_prompt, variables)
        if self.prompt_template:
            result['prompt'] = replace_variables(self.prompt_template, variables)

        return result

    def _get_trackable_fields(self):
        """Return dict of fields that should be tracked for changes"""
        return {
            "system_prompt": self.system_prompt,
            "user_prompt": self.user_prompt,
            "assistant_prompt": self.assistant_prompt,
            "prompt_template": self.prompt_template,
            "variables": self.variables,
            "model_config": self.model_config,
            "status": self.status.value if self.status else None,
        }

    def to_dict(self):
        return {
            "id": str(self.id),
            "prompt_id": str(self.prompt_id),
            "version_number": self.version_number,
            "system_prompt": self.system_prompt,
            "user_prompt": self.user_prompt,
            "assistant_prompt": self.assistant_prompt,
            "prompt_template": self.prompt_template,
            "variables": self.variables,
            "model_config": self.model_config,
            "status": self.status.value,
            "deployed_at": self.deployed_at.isoformat() if self.deployed_at else None,
            "deployed_by": str(self.deployed_by) if self.deployed_by else None,
            "usage_count": self.usage_count,
            "avg_latency": self.avg_latency,
            "changelog": self.changelog,
            "created_by": str(self.created_by),
            "updated_by": str(self.updated_by) if self.updated_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def _generate_changelog(previous_data, current_data):
    """Generate changelog by comparing previous and current data"""
    changes = []

    for field, current_value in current_data.items():
        previous_value = previous_data.get(field)

        if previous_value != current_value:
            if field == "status":
                changes.append(f"Status changed from {previous_value} to {current_value}")
            elif field == "variables":
                changes.append("Variables configuration updated")
            elif field == "model_config":
                changes.append("Model configuration updated")
            elif field in ["system_prompt", "user_prompt", "assistant_prompt", "prompt_template"]:
                field_name = field.replace("_", " ").title()
                if previous_value is None:
                    changes.append(f"{field_name} added")
                elif current_value is None:
                    changes.append(f"{field_name} removed")
                else:
                    changes.append(f"{field_name} modified")

    return "; ".join(changes) if changes else "No significant changes"


@event.listens_for(PromptVersion, 'before_update')
def before_prompt_version_update(mapper, connection, target):
    """Store previous state before update"""
    if hasattr(target, '_previous_data'):
        return

    # Get the current state from database
    current_in_db = connection.execute(
        mapper.selectable.select().where(mapper.selectable.c.id == target.id)
    ).fetchone()

    if current_in_db:
        # Convert row to dict and store previous state
        target._previous_data = {
            "system_prompt": current_in_db.system_prompt,
            "user_prompt": current_in_db.user_prompt,
            "assistant_prompt": current_in_db.assistant_prompt,
            "prompt_template": current_in_db.prompt_template,
            "variables": current_in_db.variables,
            "model_config": current_in_db.model_config,
            "status": current_in_db.status,
        }


@event.listens_for(PromptVersion, 'after_update')
def after_prompt_version_update(mapper, connection, target):
    """Generate changelog after update"""
    if not hasattr(target, '_previous_data'):
        return

    current_data = target._get_trackable_fields()
    previous_data = target._previous_data

    # Generate changelog
    changelog = _generate_changelog(previous_data, current_data)

    # Update changelog field directly in database to avoid recursion
    if changelog and changelog != "No significant changes":
        connection.execute(
            mapper.selectable.update().where(
                mapper.selectable.c.id == target.id
            ).values(changelog=changelog)
        )

    # Clean up
    delattr(target, '_previous_data')
