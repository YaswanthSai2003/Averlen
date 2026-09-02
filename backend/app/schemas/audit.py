from datetime import datetime

from sqlmodel import SQLModel


class AuditLogRead(SQLModel):
    id: int
    user_id: int | None = None
    organization_id: int | None = None
    email: str | None = None
    action: str
    method: str
    path: str
    status_code: int
    duration_ms: float
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime


class AuditLogPageResponse(SQLModel):
    items: list[AuditLogRead]
    total: int
    limit: int
    offset: int