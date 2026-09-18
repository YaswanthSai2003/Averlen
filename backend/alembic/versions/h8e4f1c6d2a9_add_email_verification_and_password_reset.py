"""add email verification and password reset

Revision ID: h8e4f1c6d2a9
Revises: g7d3e9b02c15
Create Date: 2026-09-18
"""

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = "h8e4f1c6d2a9"
down_revision = "g7d3e9b02c15"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "email_verified_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "email_verification_token_hash",
                sqlmodel.sql.sqltypes.AutoString(),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "email_verification_expires_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "password_reset_token_hash",
                sqlmodel.sql.sqltypes.AutoString(),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "password_reset_expires_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )

    # Existing accounts were already usable before this migration, so preserve
    # that access by treating them as verified. New registrations remain null
    # until the verification flow succeeds.
    op.execute(
        sa.text(
            "UPDATE users SET email_verified_at = CURRENT_TIMESTAMP "
            "WHERE email_verified_at IS NULL"
        )
    )

    with op.batch_alter_table("users") as batch_op:
        batch_op.create_index(
            "ix_users_email_verification_token_hash",
            ["email_verification_token_hash"],
            unique=True,
        )
        batch_op.create_index(
            "ix_users_password_reset_token_hash",
            ["password_reset_token_hash"],
            unique=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_password_reset_token_hash")
        batch_op.drop_index("ix_users_email_verification_token_hash")
        batch_op.drop_column("password_reset_expires_at")
        batch_op.drop_column("password_reset_token_hash")
        batch_op.drop_column("email_verification_expires_at")
        batch_op.drop_column("email_verification_token_hash")
        batch_op.drop_column("email_verified_at")
