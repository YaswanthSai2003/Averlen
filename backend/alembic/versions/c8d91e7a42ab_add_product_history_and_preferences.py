"""add product history and notification preferences

Revision ID: c8d91e7a42ab
Revises: b7f2d9e4a631
Create Date: 2026-06-18
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "c8d91e7a42ab"
down_revision: Union[str, Sequence[str], None] = "b7f2d9e4a631"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ingestionjob",
        sa.Column("skipped_rows", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "ingestionjob",
        sa.Column("duplicate_rows", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "ingestionjob",
        sa.Column("error_summary", sa.String(), nullable=True),
    )

    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("upload_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("data_quality_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("pricing_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("workspace_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("ai_insight_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("system_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notification_preferences_user_id",
        "notification_preferences",
        ["user_id"],
        unique=True,
    )
    op.create_index(
        "ix_notification_preferences_organization_id",
        "notification_preferences",
        ["organization_id"],
    )

    op.create_table(
        "pricing_recommendation_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("current_base_price", sa.Float(), nullable=False),
        sa.Column("recommended_price", sa.Float(), nullable=False),
        sa.Column("demand_score", sa.Float(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("adjustment_type", sa.String(), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("property_average_price", sa.Float(), nullable=False),
        sa.Column("city_average_price", sa.Float(), nullable=False),
        sa.Column("booking_volume", sa.Integer(), nullable=False),
        sa.Column("city_booking_volume", sa.Integer(), nullable=False),
        sa.Column("price_change_percent", sa.Float(), nullable=False),
        sa.Column("risk_level", sa.String(), nullable=False),
        sa.Column("data_quality", sa.String(), nullable=False),
        sa.Column("explanation_summary", sa.String(), nullable=False),
        sa.Column("pricing_factors_json", sa.String(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(), nullable=False, server_default="generated"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["property.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_pricing_recommendation_history_organization_id",
        "pricing_recommendation_history",
        ["organization_id"],
    )
    op.create_index(
        "ix_pricing_recommendation_history_property_id",
        "pricing_recommendation_history",
        ["property_id"],
    )
    op.create_index(
        "ix_pricing_recommendation_history_adjustment_type",
        "pricing_recommendation_history",
        ["adjustment_type"],
    )
    op.create_index(
        "ix_pricing_recommendation_history_status",
        "pricing_recommendation_history",
        ["status"],
    )
    op.create_index(
        "ix_pricing_recommendation_history_created_at",
        "pricing_recommendation_history",
        ["created_at"],
    )

    op.create_table(
        "ai_insight_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("question", sa.String(), nullable=False),
        sa.Column("answer", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("confidence", sa.String(), nullable=False),
        sa.Column("supporting_facts_json", sa.String(), nullable=False, server_default="[]"),
        sa.Column("context_summary", sa.String(), nullable=False),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_insight_history_organization_id",
        "ai_insight_history",
        ["organization_id"],
    )
    op.create_index(
        "ix_ai_insight_history_user_id",
        "ai_insight_history",
        ["user_id"],
    )
    op.create_index(
        "ix_ai_insight_history_source",
        "ai_insight_history",
        ["source"],
    )
    op.create_index(
        "ix_ai_insight_history_confidence",
        "ai_insight_history",
        ["confidence"],
    )
    op.create_index(
        "ix_ai_insight_history_is_pinned",
        "ai_insight_history",
        ["is_pinned"],
    )
    op.create_index(
        "ix_ai_insight_history_created_at",
        "ai_insight_history",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_ai_insight_history_created_at", table_name="ai_insight_history")
    op.drop_index("ix_ai_insight_history_is_pinned", table_name="ai_insight_history")
    op.drop_index("ix_ai_insight_history_confidence", table_name="ai_insight_history")
    op.drop_index("ix_ai_insight_history_source", table_name="ai_insight_history")
    op.drop_index("ix_ai_insight_history_user_id", table_name="ai_insight_history")
    op.drop_index("ix_ai_insight_history_organization_id", table_name="ai_insight_history")
    op.drop_table("ai_insight_history")

    op.drop_index(
        "ix_pricing_recommendation_history_created_at",
        table_name="pricing_recommendation_history",
    )
    op.drop_index(
        "ix_pricing_recommendation_history_status",
        table_name="pricing_recommendation_history",
    )
    op.drop_index(
        "ix_pricing_recommendation_history_adjustment_type",
        table_name="pricing_recommendation_history",
    )
    op.drop_index(
        "ix_pricing_recommendation_history_property_id",
        table_name="pricing_recommendation_history",
    )
    op.drop_index(
        "ix_pricing_recommendation_history_organization_id",
        table_name="pricing_recommendation_history",
    )
    op.drop_table("pricing_recommendation_history")

    op.drop_index(
        "ix_notification_preferences_organization_id",
        table_name="notification_preferences",
    )
    op.drop_index(
        "ix_notification_preferences_user_id",
        table_name="notification_preferences",
    )
    op.drop_table("notification_preferences")

    op.drop_column("ingestionjob", "error_summary")
    op.drop_column("ingestionjob", "duplicate_rows")
    op.drop_column("ingestionjob", "skipped_rows")