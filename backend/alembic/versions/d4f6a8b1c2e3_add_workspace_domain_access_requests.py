"""add workspace email domain and access requests

Revision ID: d4f6a8b1c2e3
Revises: c8d91e7a42ab
Create Date: 2026-08-23 00:30:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "d4f6a8b1c2e3"
down_revision: str | None = "c8d91e7a42ab"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


PUBLIC_OR_RESERVED_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com",
    "aol.com",
    "rediffmail.com",
    "example.com",
    "example.org",
    "example.net",
    "test.com",
}


def backfill_unique_workspace_domains() -> None:
    bind = op.get_bind()

    organization_ids = [
        row[0]
        for row in bind.execute(
            sa.text("SELECT id FROM organizations")
        ).fetchall()
    ]

    candidates: dict[int, str] = {}

    for organization_id in organization_ids:
        emails = [
            row[0]
            for row in bind.execute(
                sa.text(
                    "SELECT email FROM users WHERE organization_id = :organization_id"
                ),
                {"organization_id": organization_id},
            ).fetchall()
        ]

        domains = set()

        for email in emails:
            if not email or "@" not in email:
                continue

            domain = email.rsplit("@", 1)[1].strip().lower()

            if domain and domain not in PUBLIC_OR_RESERVED_DOMAINS:
                domains.add(domain)

        if len(domains) == 1:
            candidates[organization_id] = next(iter(domains))

    domain_counts: dict[str, int] = {}

    for domain in candidates.values():
        domain_counts[domain] = domain_counts.get(domain, 0) + 1

    for organization_id, domain in candidates.items():
        if domain_counts[domain] != 1:
            continue

        bind.execute(
            sa.text(
                "UPDATE organizations SET email_domain = :domain WHERE id = :organization_id"
            ),
            {
                "domain": domain,
                "organization_id": organization_id,
            },
        )


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("email_domain", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_organizations_email_domain",
        "organizations",
        ["email_domain"],
        unique=True,
    )

    backfill_unique_workspace_domains()

    op.create_table(
        "organization_access_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_role", sa.String(), nullable=True),
        sa.Column("invite_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["invite_id"],
            ["organization_invites.id"],
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_organization_access_requests_organization_id",
        "organization_access_requests",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_organization_access_requests_email",
        "organization_access_requests",
        ["email"],
        unique=False,
    )
    op.create_index(
        "ix_organization_access_requests_status",
        "organization_access_requests",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_organization_access_requests_reviewed_by_user_id",
        "organization_access_requests",
        ["reviewed_by_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_organization_access_requests_approved_role",
        "organization_access_requests",
        ["approved_role"],
        unique=False,
    )
    op.create_index(
        "ix_organization_access_requests_invite_id",
        "organization_access_requests",
        ["invite_id"],
        unique=False,
    )
    op.create_index(
        "ix_organization_access_requests_created_at",
        "organization_access_requests",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_organization_access_requests_created_at",
        table_name="organization_access_requests",
    )
    op.drop_index(
        "ix_organization_access_requests_invite_id",
        table_name="organization_access_requests",
    )
    op.drop_index(
        "ix_organization_access_requests_approved_role",
        table_name="organization_access_requests",
    )
    op.drop_index(
        "ix_organization_access_requests_reviewed_by_user_id",
        table_name="organization_access_requests",
    )
    op.drop_index(
        "ix_organization_access_requests_status",
        table_name="organization_access_requests",
    )
    op.drop_index(
        "ix_organization_access_requests_email",
        table_name="organization_access_requests",
    )
    op.drop_index(
        "ix_organization_access_requests_organization_id",
        table_name="organization_access_requests",
    )
    op.drop_table("organization_access_requests")

    op.drop_index(
        "ix_organizations_email_domain",
        table_name="organizations",
    )
    op.drop_column("organizations", "email_domain")
