"""merge_heads

Revision ID: ac325e96c088
Revises: add_funnel_config_001, f191682a1c35
Create Date: 2025-12-01 21:31:31.471330

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac325e96c088'
down_revision: Union[str, None] = ('add_funnel_config_001', 'f191682a1c35')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
