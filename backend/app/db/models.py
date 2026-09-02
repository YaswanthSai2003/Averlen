from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Index
from sqlmodel import Field, SQLModel

from app.core.roles import ORG_ADMIN


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email_domain: Optional[str] = Field(default=None, index=True, unique=True)
    created_at: datetime = Field(default_factory=utc_now)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)
    email: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    hashed_password: str
    role: str = Field(default=ORG_ADMIN, index=True)
    is_active: bool = True
    is_platform_admin: bool = Field(default=False, index=True)

    terms_accepted_at: Optional[datetime] = None
    privacy_accepted_at: Optional[datetime] = None
    terms_version: Optional[str] = None
    privacy_version: Optional[str] = None

    created_at: datetime = Field(default_factory=utc_now)

class Property(SQLModel, table=True):
    __tablename__ = "property"
    __table_args__ = (
        Index("ix_property_org_name", "organization_id", "name"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)

    name: str
    city: str = Field(index=True)
    property_type: str
    base_price: float
    bedrooms: int
    accommodates: int
    photo_url: Optional[str] = None

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Booking(SQLModel, table=True):
    __tablename__ = "booking"
    __table_args__ = (
        Index(
            "ix_booking_org_property_checkin",
            "organization_id",
            "property_id",
            "check_in",
        ),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    # Nullable for legacy rows; new bookings always set organization_id.
    organization_id: Optional[int] = Field(
        default=None,
        foreign_key="organizations.id",
        index=True,
    )

    property_id: int = Field(foreign_key="property.id", index=True)
    check_in: date = Field(index=True)
    check_out: date
    price: float
    booked_on: date

    created_at: datetime = Field(default_factory=utc_now)


class IngestionJob(SQLModel, table=True):
    __tablename__ = "ingestionjob"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)

    filename: str
    status: str = Field(default="pending", index=True)
    total_rows: int = 0
    processed_rows: int = 0
    failed_rows: int = 0
    skipped_rows: int = 0
    duplicate_rows: int = 0
    error_message: Optional[str] = None
    error_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    completed_at: Optional[datetime] = None


class IngestionError(SQLModel, table=True):
    __tablename__ = "ingestion_errors"

    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="ingestionjob.id", index=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)

    row_number: int
    error_message: str
    raw_data: str
    created_at: datetime = Field(default_factory=utc_now)


class UploadSession(SQLModel, table=True):
    __tablename__ = "upload_sessions"

    id: str = Field(primary_key=True, index=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)

    original_filename: str
    stored_filename: str
    stored_path: str
    status: str = Field(default="uploaded", index=True)

    expires_at: datetime = Field(
        index=True,
        sa_type=DateTime(timezone=True),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    processed_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
    )


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_org_created", "organization_id", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: Optional[int] = Field(default=None, index=True)
    organization_id: Optional[int] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None, index=True)

    action: str = Field(index=True)
    method: str
    path: str
    status_code: int
    duration_ms: float

    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    created_at: datetime = Field(default_factory=utc_now)


class OrganizationInvite(SQLModel, table=True):
    __tablename__ = "organization_invites"

    id: Optional[int] = Field(default=None, primary_key=True)

    organization_id: int = Field(foreign_key="organizations.id", index=True)
    invited_by_user_id: int = Field(foreign_key="users.id", index=True)

    email: str = Field(index=True)
    role: str = Field(default="VIEWER", index=True)

    token_hash: str = Field(index=True, unique=True)
    status: str = Field(default="pending", index=True)

    expires_at: datetime
    accepted_at: Optional[datetime] = None
    accepted_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")

    created_at: datetime = Field(default_factory=utc_now)


class OrganizationAccessRequest(SQLModel, table=True):
    __tablename__ = "organization_access_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)

    email: str = Field(index=True)
    full_name: Optional[str] = None
    status: str = Field(default="pending", index=True)

    reviewed_by_user_id: Optional[int] = Field(
        default=None,
        foreign_key="users.id",
        index=True,
    )
    reviewed_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
    )
    approved_role: Optional[str] = Field(default=None, index=True)
    invite_id: Optional[int] = Field(
        default=None,
        foreign_key="organization_invites.id",
        index=True,
    )

    created_at: datetime = Field(
        default_factory=utc_now,
        index=True,
        sa_type=DateTime(timezone=True),
    )


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_refresh_tokens_user_revoked", "user_id", "is_revoked"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="users.id", index=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)

    token_hash: str = Field(index=True, unique=True)
    jti: str = Field(index=True, unique=True)

    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

    is_revoked: bool = Field(default=False, index=True)
    expires_at: datetime = Field(index=True)
    revoked_at: Optional[datetime] = None

    rotated_from_token_id: Optional[int] = Field(
        default=None,
        foreign_key="refresh_tokens.id",
    )

    created_at: datetime = Field(default_factory=utc_now)


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)

    organization_id: int = Field(foreign_key="organizations.id", index=True)

    # Null user_id means workspace-wide; otherwise notification is user-specific.
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)

    actor_user_id: Optional[int] = Field(
        default=None,
        foreign_key="users.id",
        index=True,
    )

    type: str = Field(index=True)
    priority: str = Field(index=True)

    title: str
    message: str

    entity_type: Optional[str] = Field(default=None, index=True)
    entity_id: Optional[int] = Field(default=None, index=True)

    dedupe_key: Optional[str] = Field(default=None, index=True)

    is_read: bool = Field(default=False, index=True)
    read_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
    )

    created_at: datetime = Field(
        default_factory=utc_now,
        index=True,
        sa_type=DateTime(timezone=True),
    )


class NotificationPreference(SQLModel, table=True):
    __tablename__ = "notification_preferences"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, unique=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)

    upload_enabled: bool = True
    data_quality_enabled: bool = True
    pricing_enabled: bool = True
    workspace_enabled: bool = True
    ai_insight_enabled: bool = True
    system_enabled: bool = True

    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )


class PricingRecommendationHistory(SQLModel, table=True):
    __tablename__ = "pricing_recommendation_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)
    property_id: int = Field(foreign_key="property.id", index=True)
    created_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")

    current_base_price: float
    recommended_price: float
    demand_score: float
    confidence_score: float
    adjustment_type: str = Field(index=True)
    reason: str
    property_average_price: float
    city_average_price: float
    booking_volume: int
    city_booking_volume: int
    price_change_percent: float
    risk_level: str
    data_quality: str
    explanation_summary: str
    pricing_factors_json: str = "[]"
    status: str = Field(default="generated", index=True)

    created_at: datetime = Field(
        default_factory=utc_now,
        index=True,
        sa_type=DateTime(timezone=True),
    )


class AIInsightHistory(SQLModel, table=True):
    __tablename__ = "ai_insight_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)

    question: str
    answer: str
    source: str = Field(index=True)
    confidence: str = Field(index=True)
    supporting_facts_json: str = "[]"
    context_summary: str
    is_pinned: bool = Field(default=False, index=True)

    created_at: datetime = Field(
        default_factory=utc_now,
        index=True,
        sa_type=DateTime(timezone=True),
    )
