from datetime import datetime

from sqlmodel import SQLModel


class UserCreate(SQLModel):
    email: str
    password: str
    full_name: str | None = None
    organization_name: str | None = None
    accepted_terms: bool
    accepted_privacy_policy: bool
    invite_token: str | None = None


class UserUpdate(SQLModel):
    full_name: str | None = None


class ChangePasswordRequest(SQLModel):
    current_password: str
    new_password: str


class UserRead(SQLModel):
    id: int
    organization_id: int
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    role: str
    is_active: bool
    is_platform_admin: bool = False
    terms_accepted_at: datetime | None = None
    privacy_accepted_at: datetime | None = None
    terms_version: str | None = None
    privacy_version: str | None = None


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class SessionRead(SQLModel):
    id: int
    user_agent: str | None = None
    ip_address: str | None = None
    is_revoked: bool
    is_current: bool = False
    expires_at: datetime
    created_at: datetime


class SessionListResponse(SQLModel):
    sessions: list[SessionRead]