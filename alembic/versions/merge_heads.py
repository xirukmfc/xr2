"""Merge migration heads

Revision ID: merge_all_heads
Revises: b2c3d4e5f6g7, d5e6f7g8h9i0
Create Date: 2026-01-31 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_all_heads'
down_revision = ('b2c3d4e5f6g7', 'd5e6f7g8h9i0')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This is a merge migration, no changes needed
    pass


def downgrade() -> None:
    # This is a merge migration, no changes needed
    pass
