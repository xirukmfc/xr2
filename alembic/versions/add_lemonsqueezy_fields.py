"""Add LemonSqueezy fields to subscription tables

Revision ID: ac9c0d43aea1
Revises: merge_all_heads
Create Date: 2026-02-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'ac9c0d43aea1'
down_revision = 'merge_all_heads'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add external_subscription_id to user_subscriptions for LemonSqueezy subscription tracking
    op.add_column('user_subscriptions',
        sa.Column('external_subscription_id', sa.String(255), nullable=True)
    )

    # Create index on external_subscription_id for faster lookups
    op.create_index(
        'ix_user_subscriptions_external_subscription_id',
        'user_subscriptions',
        ['external_subscription_id'],
        unique=False
    )


def downgrade() -> None:
    # Drop external_subscription_id index and column
    op.drop_index('ix_user_subscriptions_external_subscription_id', table_name='user_subscriptions')
    op.drop_column('user_subscriptions', 'external_subscription_id')
