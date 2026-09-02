from datetime import datetime

from sqlmodel import SQLModel


class InternalOverviewRead(SQLModel):
    organizations: int
    users: int
    active_users: int
    properties: int
    bookings: int
    import_jobs: int
    audit_events: int
    error_events: int


class InternalOrganizationRead(SQLModel):
    id: int
    name: str
    email_domain: str | None = None
    user_count: int
    active_user_count: int
    property_count: int
    booking_count: int
    created_at: datetime


class InternalOrganizationPageResponse(SQLModel):
    items: list[InternalOrganizationRead]
    total: int
    limit: int
    offset: int


class InternalUserRead(SQLModel):
    id: int
    organization_id: int
    organization_name: str
    email: str
    full_name: str | None = None
    role: str
    is_active: bool
    is_platform_admin: bool
    created_at: datetime


class InternalUserPageResponse(SQLModel):
    items: list[InternalUserRead]
    total: int
    limit: int
    offset: int


class InternalUsageRead(SQLModel):
    organizations: int
    users: int
    active_users: int
    properties: int
    bookings: int
    import_jobs: int
    completed_import_jobs: int
    failed_import_jobs: int
    pricing_recommendations: int
    ai_insights: int
    notifications: int
