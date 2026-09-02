from datetime import datetime

from sqlmodel import SQLModel


class NotificationRead(SQLModel):
    id: int
    organization_id: int
    user_id: int | None = None
    actor_user_id: int | None = None

    type: str
    priority: str

    title: str
    message: str

    entity_type: str | None = None
    entity_id: int | None = None

    is_read: bool
    read_at: datetime | None = None
    created_at: datetime


class NotificationListResponse(SQLModel):
    items: list[NotificationRead]
    total: int
    unread_count: int
    limit: int
    offset: int


class NotificationUnreadCountResponse(SQLModel):
    unread_count: int


class NotificationActionResponse(SQLModel):
    message: str


class NotificationPreferenceRead(SQLModel):
    upload_enabled: bool
    data_quality_enabled: bool
    pricing_enabled: bool
    workspace_enabled: bool
    ai_insight_enabled: bool
    system_enabled: bool

    # Security alerts should always stay enabled.
    security_enabled: bool = True


class NotificationPreferenceUpdate(SQLModel):
    upload_enabled: bool | None = None
    data_quality_enabled: bool | None = None
    pricing_enabled: bool | None = None
    workspace_enabled: bool | None = None
    ai_insight_enabled: bool | None = None
    system_enabled: bool | None = None