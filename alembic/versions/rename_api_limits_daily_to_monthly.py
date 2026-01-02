"""rename_api_limits_daily_to_monthly

Revision ID: a1b2c3d4e5f6
Revises: f38e4163dd33
Create Date: 2026-01-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f38e4163dd33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename columns from per_day to per_month
    op.alter_column('user_limits', 'max_api_requests_per_day',
                    new_column_name='max_api_requests_per_month')
    op.alter_column('global_limits', 'default_max_api_requests_per_day',
                    new_column_name='default_max_api_requests_per_month')


def downgrade() -> None:
    # Rename columns back from per_month to per_day
    op.alter_column('user_limits', 'max_api_requests_per_month',
                    new_column_name='max_api_requests_per_day')
    op.alter_column('global_limits', 'default_max_api_requests_per_month',
                    new_column_name='default_max_api_requests_per_day')
