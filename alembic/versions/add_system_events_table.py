"""add_system_events_table

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('system_events',
        sa.Column('id', sa.UUID(), nullable=False, default=sa.text('gen_random_uuid()')),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('workspace_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='success'),
        sa.Column('source_name', sa.String(length=255), nullable=True),
        sa.Column('event_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    # Create indexes
    op.create_index('ix_system_events_event_type', 'system_events', ['event_type'])
    op.create_index('ix_system_events_resource_type', 'system_events', ['resource_type'])
    op.create_index('ix_system_events_resource_id', 'system_events', ['resource_id'])
    op.create_index('ix_system_events_user_id', 'system_events', ['user_id'])
    op.create_index('ix_system_events_workspace_id', 'system_events', ['workspace_id'])
    op.create_index('ix_system_events_source_name', 'system_events', ['source_name'])
    op.create_index('ix_system_events_created_at', 'system_events', ['created_at'])
    op.create_index('idx_system_events_workspace_created', 'system_events', ['workspace_id', 'created_at'])
    op.create_index('idx_system_events_user_created', 'system_events', ['user_id', 'created_at'])
    op.create_index('idx_system_events_type_created', 'system_events', ['event_type', 'created_at'])
    op.create_index('idx_system_events_source_created', 'system_events', ['source_name', 'created_at'])


def downgrade() -> None:
    op.drop_index('idx_system_events_source_created', table_name='system_events')
    op.drop_index('idx_system_events_type_created', table_name='system_events')
    op.drop_index('idx_system_events_user_created', table_name='system_events')
    op.drop_index('idx_system_events_workspace_created', table_name='system_events')
    op.drop_index('ix_system_events_created_at', table_name='system_events')
    op.drop_index('ix_system_events_source_name', table_name='system_events')
    op.drop_index('ix_system_events_workspace_id', table_name='system_events')
    op.drop_index('ix_system_events_user_id', table_name='system_events')
    op.drop_index('ix_system_events_resource_id', table_name='system_events')
    op.drop_index('ix_system_events_resource_type', table_name='system_events')
    op.drop_index('ix_system_events_event_type', table_name='system_events')
    op.drop_table('system_events')
