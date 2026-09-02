"""add tenant hardening and invites

Revision ID: a8c3f2b71d90
Revises: edd5a375adfa
Create Date: 2026-05-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "a8c3f2b71d90"
down_revision: Union[str, Sequence[str], None] = "edd5a375adfa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "role",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=True,
            server_default="ORG_ADMIN",
        ),
    )

    op.create_index(
        "ix_users_role",
        "users",
        ["role"],
        unique=False,
    )

    op.add_column(
        "booking",
        sa.Column(
            "organization_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_booking_organization_id_organizations",
        "booking",
        "organizations",
        ["organization_id"],
        ["id"],
    )

    op.create_index(
        "ix_booking_organization_id",
        "booking",
        ["organization_id"],
        unique=False,
    )

    op.execute(
        """
        UPDATE booking
        SET organization_id = property.organization_id
        FROM property
        WHERE booking.property_id = property.id
        AND booking.organization_id IS NULL
        """
    )

    op.add_column(
        "ingestionjob",
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_ingestionjob_user_id_users",
        "ingestionjob",
        "users",
        ["user_id"],
        ["id"],
    )

    op.create_index(
        "ix_ingestionjob_user_id",
        "ingestionjob",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "organization_invites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), nullable=False),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("role", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("token_hash", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.Column("accepted_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.ForeignKeyConstraint(
            ["invited_by_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["accepted_by_user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_organization_invites_organization_id",
        "organization_invites",
        ["organization_id"],
        unique=False,
    )

    op.create_index(
        "ix_organization_invites_invited_by_user_id",
        "organization_invites",
        ["invited_by_user_id"],
        unique=False,
    )

    op.create_index(
        "ix_organization_invites_email",
        "organization_invites",
        ["email"],
        unique=False,
    )

    op.create_index(
        "ix_organization_invites_role",
        "organization_invites",
        ["role"],
        unique=False,
    )

    op.create_index(
        "ix_organization_invites_token_hash",
        "organization_invites",
        ["token_hash"],
        unique=True,
    )

    op.create_index(
        "ix_organization_invites_status",
        "organization_invites",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_organization_invites_status",
        table_name="organization_invites",
    )

    op.drop_index(
        "ix_organization_invites_token_hash",
        table_name="organization_invites",
    )

    op.drop_index(
        "ix_organization_invites_role",
        table_name="organization_invites",
    )

    op.drop_index(
        "ix_organization_invites_email",
        table_name="organization_invites",
    )

    op.drop_index(
        "ix_organization_invites_invited_by_user_id",
        table_name="organization_invites",
    )

    op.drop_index(
        "ix_organization_invites_organization_id",
        table_name="organization_invites",
    )

    op.drop_table("organization_invites")

    op.drop_index(
        "ix_ingestionjob_user_id",
        table_name="ingestionjob",
    )

    op.drop_constraint(
        "fk_ingestionjob_user_id_users",
        "ingestionjob",
        type_="foreignkey",
    )

    op.drop_column("ingestionjob", "user_id")

    op.drop_index(
        "ix_booking_organization_id",
        table_name="booking",
    )

    op.drop_constraint(
        "fk_booking_organization_id_organizations",
        "booking",
        type_="foreignkey",
    )

    op.drop_column("booking", "organization_id")

    op.drop_index(
        "ix_users_role",
        table_name="users",
    )

    op.drop_column("users", "role")