from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=utc_now)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)
    email: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class Property(SQLModel, table=True):
    __tablename__ = "property"

    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)

    name: str
    city: str = Field(index=True)
    property_type: str
    base_price: float
    bedrooms: int
    accommodates: int

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Booking(SQLModel, table=True):
    __tablename__ = "booking"

    id: Optional[int] = Field(default=None, primary_key=True)
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

    filename: str
    status: str = Field(default="pending", index=True)
    total_rows: int = 0
    processed_rows: int = 0
    failed_rows: int = 0
    error_message: Optional[str] = None
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


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

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
