"""Add payment_provider field to user_subscriptions

Revision ID: add_payment_provider
Revises: ac9c0d43aea1
Create Date: 2026-02-01 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_payment_provider'
down_revision = 'ac9c0d43aea1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add payment_provider column to user_subscriptions
    op.add_column('user_subscriptions',
        sa.Column('payment_provider', sa.String(20), nullable=True)
    )

    # Populate payment_provider for existing subscriptions based on existing data
    # If external_subscription_id exists -> lemonsqueezy
    # If payment_method_id exists -> yookassa
    # Otherwise -> null (free plan, hasn't paid yet)
    op.execute("""
        UPDATE user_subscriptions
        SET payment_provider = CASE
            WHEN external_subscription_id IS NOT NULL THEN 'lemonsqueezy'
            WHEN payment_method_id IS NOT NULL THEN 'yookassa'
            ELSE NULL
        END
    """)


def downgrade() -> None:
    op.drop_column('user_subscriptions', 'payment_provider')
