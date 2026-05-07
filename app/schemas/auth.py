from sqlmodel import SQLModel


class UserCreate(SQLModel):
    email: str
    password: str
    full_name: str | None = None


class UserRead(SQLModel):
    id: int
    organization_id: int
    email: str
    full_name: str | None = None
    is_active: bool


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
