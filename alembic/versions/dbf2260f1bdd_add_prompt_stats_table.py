"""add_prompt_stats_table

Revision ID: dbf2260f1bdd
Revises: 96a28d322088
Create Date: 2025-09-10 18:02:13.036598

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'dbf2260f1bdd'
down_revision: Union[str, None] = '96a28d322088'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create prompt_stats table
    op.create_table(
        'prompt_stats',
        sa.Column('id', sa.UUID(), nullable=False, default=sa.text('gen_random_uuid()')),
        sa.Column('prompt_id', sa.UUID(), nullable=False),
        sa.Column('prompt_version_id', sa.UUID(), nullable=True),
        sa.Column('source_name', sa.String(100), nullable=False),
        sa.Column('period_type', sa.String(20), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_requests', sa.Integer(), default=0),
        sa.Column('successful_requests', sa.Integer(), default=0),
        sa.Column('failed_requests', sa.Integer(), default=0),
        sa.Column('status_200_count', sa.Integer(), default=0),
        sa.Column('status_400_count', sa.Integer(), default=0),
        sa.Column('status_401_count', sa.Integer(), default=0),
        sa.Column('status_403_count', sa.Integer(), default=0),
        sa.Column('status_404_count', sa.Integer(), default=0),
        sa.Column('status_422_count', sa.Integer(), default=0),
        sa.Column('status_500_count', sa.Integer(), default=0),
        sa.Column('status_other_count', sa.Integer(), default=0),
        sa.Column('total_latency_ms', sa.Integer(), default=0),
        sa.Column('avg_latency_ms', sa.Integer(), default=0),
        sa.Column('min_latency_ms', sa.Integer(), nullable=True),
        sa.Column('max_latency_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        # Foreign keys disabled - prompts table may not exist yet
        # sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id']),
        # sa.ForeignKeyConstraint(['prompt_version_id'], ['prompt_versions.id']),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_prompt_stats_id', 'prompt_stats', ['id'])
    op.create_index('ix_prompt_stats_prompt_id', 'prompt_stats', ['prompt_id'])
    op.create_index('ix_prompt_stats_prompt_version_id', 'prompt_stats', ['prompt_version_id'])
    op.create_index('ix_prompt_stats_source_name', 'prompt_stats', ['source_name'])
    op.create_index('ix_prompt_stats_period_start', 'prompt_stats', ['period_start'])
    op.create_index('ix_prompt_stats_lookup', 'prompt_stats', ['prompt_id', 'prompt_version_id', 'period_type', 'period_start'])
    
    # Create unique constraint to prevent duplicate stats
    op.create_unique_constraint(
        '_prompt_stats_unique', 
        'prompt_stats',
        ['prompt_id', 'prompt_version_id', 'source_name', 'period_type', 'period_start']
    )
    
    # Add prompt tracking columns to existing product_api_logs table if they don't exist
    # Disabled - table may not exist yet
    # try:
    #     op.add_column('product_api_logs', sa.Column('prompt_id', sa.UUID(), nullable=True))
    #     op.add_column('product_api_logs', sa.Column('prompt_version_id', sa.UUID(), nullable=True))

    #     # Add foreign key constraints - disabled for now
    #     # op.create_foreign_key('fk_product_api_logs_prompt_id', 'product_api_logs', 'prompts', ['prompt_id'], ['id'])
    #     # op.create_foreign_key('fk_product_api_logs_prompt_version_id', 'product_api_logs', 'prompt_versions', ['prompt_version_id'], ['id'])

    #     # Add indexes
    #     op.create_index('ix_product_api_logs_prompt_id', 'product_api_logs', ['prompt_id'])
    #     op.create_index('ix_product_api_logs_prompt_version_id', 'product_api_logs', ['prompt_version_id'])

    # except Exception:
    #     # Columns might already exist - ignore the error
    #     pass
    pass


def downgrade() -> None:
    # Drop indexes and constraints first
    op.drop_constraint('_prompt_stats_unique', 'prompt_stats', type_='unique')
    op.drop_index('ix_prompt_stats_lookup', 'prompt_stats')
    op.drop_index('ix_prompt_stats_period_start', 'prompt_stats')
    op.drop_index('ix_prompt_stats_source_name', 'prompt_stats')
    op.drop_index('ix_prompt_stats_prompt_version_id', 'prompt_stats')
    op.drop_index('ix_prompt_stats_prompt_id', 'prompt_stats')
    op.drop_index('ix_prompt_stats_id', 'prompt_stats')
    
    # Drop the table
    op.drop_table('prompt_stats')
    
    # Remove columns from product_api_logs if they were added
    try:
        op.drop_constraint('fk_product_api_logs_prompt_version_id', 'product_api_logs', type_='foreignkey')
        op.drop_constraint('fk_product_api_logs_prompt_id', 'product_api_logs', type_='foreignkey')
        op.drop_index('ix_product_api_logs_prompt_version_id', 'product_api_logs')
        op.drop_index('ix_product_api_logs_prompt_id', 'product_api_logs')
        op.drop_column('product_api_logs', 'prompt_version_id')
        op.drop_column('product_api_logs', 'prompt_id')
    except Exception:
        # Columns might not exist - ignore the error
        pass
