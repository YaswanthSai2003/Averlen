"""add platform admin flag

Revision ID: e5a7c9d2f4b6
Revises: d4f6a8b1c2e3
Create Date: 2026-08-24 14:45:00
"""

from alembic import op
import sqlalchemy as sa


revision = "e5a7c9d2f4b6"
down_revision = "d4f6a8b1c2e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_platform_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_index(
        "ix_users_is_platform_admin",
        "users",
        ["is_platform_admin"],
        unique=False,
    )
    op.alter_column(
        "users",
        "is_platform_admin",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_index("ix_users_is_platform_admin", table_name="users")
    op.drop_column("users", "is_platform_admin")
