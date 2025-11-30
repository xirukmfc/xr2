"""add funnel_config_id to ab_tests

Revision ID: add_funnel_config_001
Revises: 
Create Date: 2024-11-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_funnel_config_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add funnel_config_id column to ab_tests table
    op.add_column('ab_tests', sa.Column('funnel_config_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_ab_tests_funnel_config',
        'ab_tests',
        'custom_funnel_configurations',
        ['funnel_config_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_ab_tests_funnel_config', 'ab_tests', type_='foreignkey')
    op.drop_column('ab_tests', 'funnel_config_id')

