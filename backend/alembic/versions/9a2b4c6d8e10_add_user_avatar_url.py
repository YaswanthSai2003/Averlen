"""add user avatar url

Revision ID: 9a2b4c6d8e10
Revises: c4a8f1d9e7b2
Create Date: 2026-06-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "9a2b4c6d8e10"
down_revision: Union[str, Sequence[str], None] = "c4a8f1d9e7b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_url")