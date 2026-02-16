"""Add pricing_config table

Revision ID: add_pricing_config
Revises: f38e4163dd33
Create Date: 2026-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_pricing_config'
down_revision = 'ac325e96c088'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('pricing_config',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plan_name', sa.String(50), nullable=False),
        sa.Column('price_usd', sa.Integer(), default=0),
        sa.Column('price_usd_display', sa.String(20), default='$0'),
        sa.Column('price_rub', sa.Integer(), default=0),
        sa.Column('price_rub_display', sa.String(20), default='0₽'),
        sa.Column('billing_period', sa.String(20), default='month'),
        sa.Column('billing_period_en', sa.String(50), default='/month'),
        sa.Column('billing_period_ru', sa.String(50), default='/мес'),
        sa.Column('features_en', sa.Text(), nullable=True),
        sa.Column('features_ru', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_name')
    )

    # Insert default pricing data
    op.execute("""
        INSERT INTO pricing_config (id, plan_name, price_usd, price_usd_display, price_rub, price_rub_display,
                                    billing_period, billing_period_en, billing_period_ru,
                                    features_en, features_ru, is_active, sort_order)
        VALUES
        (gen_random_uuid(), 'free', 0, '$0', 0, '0₽', 'month', '/month', '/мес',
         '["Up to 10 prompts", "100 API calls/month", "Basic analytics", "1 workspace"]',
         '["До 10 промптов", "100 API запросов/мес", "Базовая аналитика", "1 workspace"]',
         true, 0),
        (gen_random_uuid(), 'pro', 1900, '$19', 150000, '1500₽', 'month', '/month', '/мес',
         '["Unlimited prompts", "1,000 API calls/month", "A/B testing & revenue tracking", "Unlimited workspaces", "Team collaboration"]',
         '["Безлимит промптов", "1 000 API запросов/мес", "A/B тесты и выручка", "Безлимит workspaces", "Командная работа"]',
         true, 1),
        (gen_random_uuid(), 'enterprise', 0, 'Custom', 0, 'Индивидуально', 'month', '', '',
         '["SSO & SAML", "Dedicated support", "Custom integrations", "SLA"]',
         '["SSO и SAML", "Выделенная поддержка", "Кастомные интеграции", "SLA"]',
         true, 2)
    """)


def downgrade() -> None:
    op.drop_table('pricing_config')
