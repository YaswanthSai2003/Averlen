"""enforce user role not null

Revision ID: f6c2d8a91b04
Revises: e5a7c9d2f4b6
Create Date: 2026-09-02 11:15:00
"""

from alembic import op
import sqlalchemy as sa


revision = "f6c2d8a91b04"
down_revision = "e5a7c9d2f4b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "UPDATE users SET role = 'ORG_ADMIN' WHERE role IS NULL"
        )
    )
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(),
        nullable=False,
        server_default=None,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(),
        nullable=True,
        server_default=sa.text("'ORG_ADMIN'"),
    )
