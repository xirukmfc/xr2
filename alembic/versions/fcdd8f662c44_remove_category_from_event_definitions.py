"""remove_category_from_event_definitions

Revision ID: fcdd8f662c44
Revises: 2f5bab9bf639
Create Date: 2025-11-30 10:27:54.393534

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fcdd8f662c44'
down_revision: Union[str, None] = '2f5bab9bf639'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove category column from event_definitions
    op.drop_column('event_definitions', 'category')


def downgrade() -> None:
    # Add category column back
    op.add_column('event_definitions', sa.Column('category', sa.String(100), nullable=True))
