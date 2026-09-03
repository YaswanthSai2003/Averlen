"""add property lifecycle and import rollback

Revision ID: g7d3e9b02c15
Revises: f6c2d8a91b04
Create Date: 2026-09-03
"""

from collections import defaultdict

from alembic import op
import sqlalchemy as sa


revision = "g7d3e9b02c15"
down_revision = "f6c2d8a91b04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("organizations") as batch_op:
        batch_op.add_column(
            sa.Column(
                "next_property_number",
                sa.Integer(),
                nullable=False,
                server_default="1",
            )
        )
        batch_op.add_column(
            sa.Column(
                "next_import_number",
                sa.Integer(),
                nullable=False,
                server_default="1",
            )
        )

    with op.batch_alter_table("property") as batch_op:
        batch_op.add_column(sa.Column("property_code", sa.String(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "is_archived",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )
        batch_op.add_column(sa.Column("archived_at", sa.DateTime(), nullable=True))

    with op.batch_alter_table("ingestionjob") as batch_op:
        batch_op.add_column(sa.Column("import_number", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("data_removed_at", sa.DateTime(), nullable=True))

    connection = op.get_bind()

    property_rows = connection.execute(
        sa.text(
            "SELECT id, organization_id FROM property "
            "ORDER BY organization_id, id"
        )
    ).mappings().all()
    property_counters: dict[int, int] = defaultdict(int)
    for row in property_rows:
        organization_id = int(row["organization_id"])
        property_counters[organization_id] += 1
        connection.execute(
            sa.text(
                "UPDATE property SET property_code = :property_code "
                "WHERE id = :property_id"
            ),
            {
                "property_code": f"P-{property_counters[organization_id]:03d}",
                "property_id": int(row["id"]),
            },
        )

    job_rows = connection.execute(
        sa.text(
            "SELECT id, organization_id FROM ingestionjob "
            "ORDER BY organization_id, created_at, id"
        )
    ).mappings().all()
    job_counters: dict[int, int] = defaultdict(int)
    for row in job_rows:
        organization_id = int(row["organization_id"])
        job_counters[organization_id] += 1
        connection.execute(
            sa.text(
                "UPDATE ingestionjob SET import_number = :import_number "
                "WHERE id = :job_id"
            ),
            {
                "import_number": job_counters[organization_id],
                "job_id": int(row["id"]),
            },
        )

    organization_rows = connection.execute(
        sa.text("SELECT id FROM organizations ORDER BY id")
    ).mappings().all()
    for row in organization_rows:
        organization_id = int(row["id"])
        connection.execute(
            sa.text(
                "UPDATE organizations SET "
                "next_property_number = :next_property, "
                "next_import_number = :next_import "
                "WHERE id = :organization_id"
            ),
            {
                "next_property": property_counters[organization_id] + 1,
                "next_import": job_counters[organization_id] + 1,
                "organization_id": organization_id,
            },
        )

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.alter_column(
            "next_property_number",
            existing_type=sa.Integer(),
            nullable=False,
            server_default=None,
        )
        batch_op.alter_column(
            "next_import_number",
            existing_type=sa.Integer(),
            nullable=False,
            server_default=None,
        )

    with op.batch_alter_table("property") as batch_op:
        batch_op.alter_column(
            "property_code",
            existing_type=sa.String(),
            nullable=False,
        )
        batch_op.alter_column(
            "is_archived",
            existing_type=sa.Boolean(),
            nullable=False,
            server_default=None,
        )
        batch_op.create_index(
            "ix_property_property_code",
            ["property_code"],
            unique=False,
        )
        batch_op.create_index(
            "ix_property_is_archived",
            ["is_archived"],
            unique=False,
        )
        batch_op.create_index(
            "ux_property_org_code",
            ["organization_id", "property_code"],
            unique=True,
        )

    with op.batch_alter_table("ingestionjob") as batch_op:
        batch_op.alter_column(
            "import_number",
            existing_type=sa.Integer(),
            nullable=False,
        )
        batch_op.create_index(
            "ix_ingestionjob_import_number",
            ["import_number"],
            unique=False,
        )
        batch_op.create_index(
            "ux_ingestionjob_org_number",
            ["organization_id", "import_number"],
            unique=True,
        )

    with op.batch_alter_table("booking") as batch_op:
        batch_op.add_column(sa.Column("ingestion_job_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_booking_ingestion_job_id",
            "ingestionjob",
            ["ingestion_job_id"],
            ["id"],
        )
        batch_op.create_index(
            "ix_booking_ingestion_job_id",
            ["ingestion_job_id"],
            unique=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("booking") as batch_op:
        batch_op.drop_index("ix_booking_ingestion_job_id")
        batch_op.drop_constraint("fk_booking_ingestion_job_id", type_="foreignkey")
        batch_op.drop_column("ingestion_job_id")

    with op.batch_alter_table("ingestionjob") as batch_op:
        batch_op.drop_index("ux_ingestionjob_org_number")
        batch_op.drop_index("ix_ingestionjob_import_number")
        batch_op.drop_column("data_removed_at")
        batch_op.drop_column("import_number")

    with op.batch_alter_table("property") as batch_op:
        batch_op.drop_index("ux_property_org_code")
        batch_op.drop_index("ix_property_is_archived")
        batch_op.drop_index("ix_property_property_code")
        batch_op.drop_column("archived_at")
        batch_op.drop_column("is_archived")
        batch_op.drop_column("property_code")

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.drop_column("next_import_number")
        batch_op.drop_column("next_property_number")
