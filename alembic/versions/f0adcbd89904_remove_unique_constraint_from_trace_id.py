"""remove_unique_constraint_from_trace_id

Revision ID: f0adcbd89904
Revises: ee91042ef174
Create Date: 2025-09-21 20:05:14.629737

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0adcbd89904'
down_revision: Union[str, None] = 'ee91042ef174'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the unique index on trace_id
    op.drop_index('ix_prompt_events_trace_id', table_name='prompt_events')

    # Recreate as non-unique index
    op.create_index('ix_prompt_events_trace_id', 'prompt_events', ['trace_id'], unique=False)


def downgrade() -> None:
    # Drop the non-unique index
    op.drop_index('ix_prompt_events_trace_id', table_name='prompt_events')

    # Recreate as unique index (restore previous state)
    op.create_index('ix_prompt_events_trace_id', 'prompt_events', ['trace_id'], unique=True)
