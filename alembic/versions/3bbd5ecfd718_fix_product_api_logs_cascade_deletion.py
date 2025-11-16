"""fix_product_api_logs_cascade_deletion

Revision ID: 3bbd5ecfd718
Revises: 138e74552494
Create Date: 2025-11-16 10:34:04.553512

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3bbd5ecfd718'
down_revision: Union[str, None] = '138e74552494'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraints
    op.drop_constraint('product_api_logs_prompt_id_fkey', 'product_api_logs', type_='foreignkey')
    op.drop_constraint('product_api_logs_prompt_version_id_fkey', 'product_api_logs', type_='foreignkey')

    # Recreate foreign key constraints with ON DELETE SET NULL
    op.create_foreign_key(
        'product_api_logs_prompt_id_fkey',
        'product_api_logs', 'prompts',
        ['prompt_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'product_api_logs_prompt_version_id_fkey',
        'product_api_logs', 'prompt_versions',
        ['prompt_version_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Drop new constraints
    op.drop_constraint('product_api_logs_prompt_id_fkey', 'product_api_logs', type_='foreignkey')
    op.drop_constraint('product_api_logs_prompt_version_id_fkey', 'product_api_logs', type_='foreignkey')

    # Recreate original constraints without ON DELETE SET NULL
    op.create_foreign_key(
        'product_api_logs_prompt_id_fkey',
        'product_api_logs', 'prompts',
        ['prompt_id'], ['id']
    )
    op.create_foreign_key(
        'product_api_logs_prompt_version_id_fkey',
        'product_api_logs', 'prompt_versions',
        ['prompt_version_id'], ['id']
    )
