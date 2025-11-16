"""fix_all_prompt_foreign_keys_cascade_deletion

Revision ID: 4f5124c4824c
Revises: 3bbd5ecfd718
Create Date: 2025-11-16 10:42:33.198914

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f5124c4824c'
down_revision: Union[str, None] = '3bbd5ecfd718'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix prompt_stats foreign keys
    op.drop_constraint('prompt_stats_prompt_id_fkey', 'prompt_stats', type_='foreignkey')
    op.drop_constraint('prompt_stats_prompt_version_id_fkey', 'prompt_stats', type_='foreignkey')
    op.create_foreign_key('prompt_stats_prompt_id_fkey', 'prompt_stats', 'prompts', ['prompt_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('prompt_stats_prompt_version_id_fkey', 'prompt_stats', 'prompt_versions', ['prompt_version_id'], ['id'], ondelete='SET NULL')

    # Fix prompt_events foreign keys
    op.drop_constraint('prompt_events_prompt_id_fkey', 'prompt_events', type_='foreignkey')
    op.drop_constraint('prompt_events_prompt_version_id_fkey', 'prompt_events', type_='foreignkey')
    op.create_foreign_key('prompt_events_prompt_id_fkey', 'prompt_events', 'prompts', ['prompt_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('prompt_events_prompt_version_id_fkey', 'prompt_events', 'prompt_versions', ['prompt_version_id'], ['id'], ondelete='SET NULL')

    # Fix prompt_metrics_hourly foreign keys
    op.drop_constraint('prompt_metrics_hourly_prompt_id_fkey', 'prompt_metrics_hourly', type_='foreignkey')
    op.drop_constraint('prompt_metrics_hourly_prompt_version_id_fkey', 'prompt_metrics_hourly', type_='foreignkey')
    op.create_foreign_key('prompt_metrics_hourly_prompt_id_fkey', 'prompt_metrics_hourly', 'prompts', ['prompt_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('prompt_metrics_hourly_prompt_version_id_fkey', 'prompt_metrics_hourly', 'prompt_versions', ['prompt_version_id'], ['id'], ondelete='SET NULL')

    # Fix conversion_funnels foreign key
    op.drop_constraint('conversion_funnels_source_prompt_id_fkey', 'conversion_funnels', type_='foreignkey')
    op.create_foreign_key('conversion_funnels_source_prompt_id_fkey', 'conversion_funnels', 'prompts', ['source_prompt_id'], ['id'], ondelete='SET NULL')

    # Fix ab_tests foreign keys
    op.drop_constraint('ab_tests_prompt_id_fkey', 'ab_tests', type_='foreignkey')
    op.drop_constraint('ab_tests_version_a_id_fkey', 'ab_tests', type_='foreignkey')
    op.drop_constraint('ab_tests_version_b_id_fkey', 'ab_tests', type_='foreignkey')
    op.create_foreign_key('ab_tests_prompt_id_fkey', 'ab_tests', 'prompts', ['prompt_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('ab_tests_version_a_id_fkey', 'ab_tests', 'prompt_versions', ['version_a_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('ab_tests_version_b_id_fkey', 'ab_tests', 'prompt_versions', ['version_b_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Revert ab_tests
    op.drop_constraint('ab_tests_prompt_id_fkey', 'ab_tests', type_='foreignkey')
    op.drop_constraint('ab_tests_version_a_id_fkey', 'ab_tests', type_='foreignkey')
    op.drop_constraint('ab_tests_version_b_id_fkey', 'ab_tests', type_='foreignkey')
    op.create_foreign_key('ab_tests_prompt_id_fkey', 'ab_tests', 'prompts', ['prompt_id'], ['id'])
    op.create_foreign_key('ab_tests_version_a_id_fkey', 'ab_tests', 'prompt_versions', ['version_a_id'], ['id'])
    op.create_foreign_key('ab_tests_version_b_id_fkey', 'ab_tests', 'prompt_versions', ['version_b_id'], ['id'])

    # Revert conversion_funnels
    op.drop_constraint('conversion_funnels_source_prompt_id_fkey', 'conversion_funnels', type_='foreignkey')
    op.create_foreign_key('conversion_funnels_source_prompt_id_fkey', 'conversion_funnels', 'prompts', ['source_prompt_id'], ['id'])

    # Revert prompt_metrics_hourly
    op.drop_constraint('prompt_metrics_hourly_prompt_id_fkey', 'prompt_metrics_hourly', type_='foreignkey')
    op.drop_constraint('prompt_metrics_hourly_prompt_version_id_fkey', 'prompt_metrics_hourly', type_='foreignkey')
    op.create_foreign_key('prompt_metrics_hourly_prompt_id_fkey', 'prompt_metrics_hourly', 'prompts', ['prompt_id'], ['id'])
    op.create_foreign_key('prompt_metrics_hourly_prompt_version_id_fkey', 'prompt_metrics_hourly', 'prompt_versions', ['prompt_version_id'], ['id'])

    # Revert prompt_events
    op.drop_constraint('prompt_events_prompt_id_fkey', 'prompt_events', type_='foreignkey')
    op.drop_constraint('prompt_events_prompt_version_id_fkey', 'prompt_events', type_='foreignkey')
    op.create_foreign_key('prompt_events_prompt_id_fkey', 'prompt_events', 'prompts', ['prompt_id'], ['id'])
    op.create_foreign_key('prompt_events_prompt_version_id_fkey', 'prompt_events', 'prompt_versions', ['prompt_version_id'], ['id'])

    # Revert prompt_stats
    op.drop_constraint('prompt_stats_prompt_id_fkey', 'prompt_stats', type_='foreignkey')
    op.drop_constraint('prompt_stats_prompt_version_id_fkey', 'prompt_stats', type_='foreignkey')
    op.create_foreign_key('prompt_stats_prompt_id_fkey', 'prompt_stats', 'prompts', ['prompt_id'], ['id'])
    op.create_foreign_key('prompt_stats_prompt_version_id_fkey', 'prompt_stats', 'prompt_versions', ['prompt_version_id'], ['id'])
