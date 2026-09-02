from datetime import datetime

from pydantic import field_validator
from sqlmodel import SQLModel


class WorkspaceDiscoveryRead(SQLModel):
    existing_workspace: bool
    can_request_access: bool


class AccessRequestCreate(SQLModel):
    email: str
    full_name: str | None = None


class AccessRequestPublicRead(SQLModel):
    id: int
    email: str
    status: str
    created_at: datetime


class AccessRequestAdminRead(SQLModel):
    id: int
    organization_id: int
    email: str
    full_name: str | None = None
    status: str
    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None
    approved_role: str | None = None
    invite_id: int | None = None
    created_at: datetime


class AccessRequestListResponse(SQLModel):
    requests: list[AccessRequestAdminRead]


class AccessRequestApprove(SQLModel):
    role: str

    @field_validator("role")
    @classmethod
    def clean_role(cls, value: str) -> str:
        normalized = value.strip().upper()

        if not normalized:
            raise ValueError("Role cannot be empty")

        return normalized


class AccessRequestApprovalResponse(SQLModel):
    request: AccessRequestAdminRead
    invite_token: str
    invite_url: str
