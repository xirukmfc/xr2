"""Add subscription tables

Revision ID: c3d4e5f6g7h8
Revises: add_pricing_config
Create Date: 2026-01-31 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c3d4e5f6g7h8'
down_revision = 'add_pricing_config'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_subscriptions table
    op.create_table('user_subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plan', sa.String(20), nullable=False, server_default='free'),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('auto_renew', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Create indexes for user_subscriptions
    op.create_index('ix_user_subscriptions_id', 'user_subscriptions', ['id'])
    op.create_index('ix_user_subscriptions_user_id', 'user_subscriptions', ['user_id'])
    op.create_index('ix_user_subscriptions_plan', 'user_subscriptions', ['plan'])
    op.create_index('ix_user_subscriptions_status', 'user_subscriptions', ['status'])

    # Create subscription_transactions table
    op.create_table('subscription_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subscription_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('transaction_type', sa.String(20), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('external_id', sa.String(255), nullable=True),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['user_subscriptions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for subscription_transactions
    op.create_index('ix_subscription_transactions_id', 'subscription_transactions', ['id'])
    op.create_index('ix_subscription_transactions_subscription_id', 'subscription_transactions', ['subscription_id'])
    op.create_index('ix_subscription_transactions_status', 'subscription_transactions', ['status'])
    op.create_index('ix_subscription_transactions_created_at', 'subscription_transactions', ['created_at'])


def downgrade() -> None:
    # Drop indexes for subscription_transactions
    op.drop_index('ix_subscription_transactions_created_at', table_name='subscription_transactions')
    op.drop_index('ix_subscription_transactions_status', table_name='subscription_transactions')
    op.drop_index('ix_subscription_transactions_subscription_id', table_name='subscription_transactions')
    op.drop_index('ix_subscription_transactions_id', table_name='subscription_transactions')

    # Drop subscription_transactions table
    op.drop_table('subscription_transactions')

    # Drop indexes for user_subscriptions
    op.drop_index('ix_user_subscriptions_status', table_name='user_subscriptions')
    op.drop_index('ix_user_subscriptions_plan', table_name='user_subscriptions')
    op.drop_index('ix_user_subscriptions_user_id', table_name='user_subscriptions')
    op.drop_index('ix_user_subscriptions_id', table_name='user_subscriptions')

    # Drop user_subscriptions table
    op.drop_table('user_subscriptions')
