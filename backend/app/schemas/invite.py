from datetime import datetime

from sqlmodel import SQLModel


class InviteCreate(SQLModel):
    email: str
    role: str


class InviteRead(SQLModel):
    id: int
    organization_id: int
    invited_by_user_id: int
    email: str
    role: str
    status: str
    expires_at: datetime
    accepted_at: datetime | None = None
    accepted_by_user_id: int | None = None
    created_at: datetime


class InviteCreateResponse(SQLModel):
    invite: InviteRead
    invite_token: str
    invite_url: str


class InviteAcceptRequest(SQLModel):
    invite_token: str