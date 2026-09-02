from datetime import datetime

from pydantic import field_validator
from sqlmodel import SQLModel


class WorkspaceRead(SQLModel):
    id: int
    name: str
    email_domain: str | None = None
    created_at: datetime


class WorkspaceUpdate(SQLModel):
    name: str

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Workspace name must be at least 2 characters long")

        return value


class WorkspaceMemberRead(SQLModel):
    id: int
    organization_id: int
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    role: str
    is_active: bool
    created_at: datetime


class WorkspaceMemberListResponse(SQLModel):
    members: list[WorkspaceMemberRead]


class WorkspaceMemberRoleUpdate(SQLModel):
    role: str

    @field_validator("role")
    @classmethod
    def clean_role(cls, value: str) -> str:
        value = value.strip().upper()

        if not value:
            raise ValueError("Role cannot be empty")

        return value
