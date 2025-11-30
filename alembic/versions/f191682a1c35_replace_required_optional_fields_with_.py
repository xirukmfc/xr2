"""replace_required_optional_fields_with_metadata_schema

Revision ID: f191682a1c35
Revises: fcdd8f662c44
Create Date: 2025-11-30 11:02:13.303269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f191682a1c35'
down_revision: Union[str, None] = 'fcdd8f662c44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new metadata_schema column
    op.add_column('event_definitions', sa.Column('metadata_schema', sa.dialects.postgresql.JSONB(), nullable=True))

    # Migrate data from required_fields and optional_fields to metadata_schema
    # This combines both required and optional fields into a single schema array
    op.execute("""
        UPDATE event_definitions
        SET metadata_schema = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'name', field->>'name',
                    'type', field->>'type',
                    'required', (field->>'required')::boolean,
                    'description', field->>'description'
                )
            )
            FROM (
                SELECT jsonb_array_elements(COALESCE(required_fields, '[]'::jsonb)) as field
                UNION ALL
                SELECT jsonb_array_elements(COALESCE(optional_fields, '[]'::jsonb)) as field
            ) combined
        )
        WHERE required_fields IS NOT NULL OR optional_fields IS NOT NULL
    """)

    # Set default empty array for rows with no fields
    op.execute("""
        UPDATE event_definitions
        SET metadata_schema = '[]'::jsonb
        WHERE metadata_schema IS NULL
    """)

    # Drop old columns
    op.drop_column('event_definitions', 'required_fields')
    op.drop_column('event_definitions', 'optional_fields')


def downgrade() -> None:
    # Add back old columns
    op.add_column('event_definitions', sa.Column('required_fields', sa.dialects.postgresql.JSONB(), nullable=True))
    op.add_column('event_definitions', sa.Column('optional_fields', sa.dialects.postgresql.JSONB(), nullable=True))

    # Migrate data back from metadata_schema
    op.execute("""
        UPDATE event_definitions
        SET
            required_fields = (
                SELECT jsonb_agg(field)
                FROM jsonb_array_elements(COALESCE(metadata_schema, '[]'::jsonb)) field
                WHERE (field->>'required')::boolean = true
            ),
            optional_fields = (
                SELECT jsonb_agg(field)
                FROM jsonb_array_elements(COALESCE(metadata_schema, '[]'::jsonb)) field
                WHERE (field->>'required')::boolean = false
            )
        WHERE metadata_schema IS NOT NULL
    """)

    # Drop new column
    op.drop_column('event_definitions', 'metadata_schema')
