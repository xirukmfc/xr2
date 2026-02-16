"""Add YooKassa fields to subscription tables

Revision ID: d5e6f7g8h9i0
Revises: c3d4e5f6g7h8
Create Date: 2026-01-31 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd5e6f7g8h9i0'
down_revision = 'c3d4e5f6g7h8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add payment_method_id to user_subscriptions for recurring payments
    op.add_column('user_subscriptions',
        sa.Column('payment_method_id', sa.String(255), nullable=True)
    )

    # Add webhook_id to subscription_transactions for idempotent webhook processing
    op.add_column('subscription_transactions',
        sa.Column('webhook_id', sa.String(255), nullable=True)
    )

    # Create unique index on webhook_id for idempotency checks
    op.create_index(
        'ix_subscription_transactions_webhook_id',
        'subscription_transactions',
        ['webhook_id'],
        unique=True
    )


def downgrade() -> None:
    # Drop webhook_id index and column
    op.drop_index('ix_subscription_transactions_webhook_id', table_name='subscription_transactions')
    op.drop_column('subscription_transactions', 'webhook_id')

    # Drop payment_method_id column
    op.drop_column('user_subscriptions', 'payment_method_id')
