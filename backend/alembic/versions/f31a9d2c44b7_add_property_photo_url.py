"""add property photo url

Revision ID: f31a9d2c44b7
Revises: 1729ebe03d03
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "f31a9d2c44b7"
down_revision: Union[str, Sequence[str], None] = "1729ebe03d03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "property",
        sa.Column(
            "photo_url",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("property", "photo_url")