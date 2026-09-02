"""add upload sessions and hardening indexes

Revision ID: c4a8f1d9e7b2
Revises: b9d4c1e62a11
Create Date: 2026-06-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a8f1d9e7b2"
down_revision: Union[str, Sequence[str], None] = "b9d4c1e62a11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "upload_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("original_filename", sa.String(), nullable=False),
        sa.Column("stored_filename", sa.String(), nullable=False),
        sa.Column("stored_path", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_upload_sessions_organization_id",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_upload_sessions_user_id",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_upload_sessions_id",
        "upload_sessions",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_upload_sessions_organization_id",
        "upload_sessions",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_upload_sessions_user_id",
        "upload_sessions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_upload_sessions_status",
        "upload_sessions",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_upload_sessions_expires_at",
        "upload_sessions",
        ["expires_at"],
        unique=False,
    )

    op.create_index(
        "ix_property_org_name",
        "property",
        ["organization_id", "name"],
        unique=False,
    )
    op.create_index(
        "ix_booking_org_property_checkin",
        "booking",
        ["organization_id", "property_id", "check_in"],
        unique=False,
    )
    op.create_index(
        "ix_audit_logs_org_created",
        "audit_logs",
        ["organization_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_refresh_tokens_user_revoked",
        "refresh_tokens",
        ["user_id", "is_revoked"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_refresh_tokens_user_revoked",
        table_name="refresh_tokens",
    )
    op.drop_index(
        "ix_audit_logs_org_created",
        table_name="audit_logs",
    )
    op.drop_index(
        "ix_booking_org_property_checkin",
        table_name="booking",
    )
    op.drop_index(
        "ix_property_org_name",
        table_name="property",
    )

    op.drop_index(
        "ix_upload_sessions_expires_at",
        table_name="upload_sessions",
    )
    op.drop_index(
        "ix_upload_sessions_status",
        table_name="upload_sessions",
    )
    op.drop_index(
        "ix_upload_sessions_user_id",
        table_name="upload_sessions",
    )
    op.drop_index(
        "ix_upload_sessions_organization_id",
        table_name="upload_sessions",
    )
    op.drop_index(
        "ix_upload_sessions_id",
        table_name="upload_sessions",
    )

    op.drop_table("upload_sessions")