from datetime import datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import SQLModel


class PropertyCreate(SQLModel):
    name: str
    city: str
    property_type: str
    base_price: float
    bedrooms: int
    accommodates: int

    @field_validator("name", "city", "property_type")
    @classmethod
    def non_empty_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty")

        return value

    @field_validator("base_price")
    @classmethod
    def positive_base_price(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("base_price must be greater than 0")

        return value

    @field_validator("bedrooms")
    @classmethod
    def valid_bedrooms(cls, value: int) -> int:
        if value < 0 or value > 20:
            raise ValueError("bedrooms must be between 0 and 20")

        return value

    @field_validator("accommodates")
    @classmethod
    def valid_accommodates(cls, value: int) -> int:
        if value <= 0 or value > 100:
            raise ValueError("accommodates must be between 1 and 100")

        return value


class PropertyRead(SQLModel):
    id: int
    organization_id: int
    property_code: str
    name: str
    city: str
    property_type: str
    base_price: float
    bedrooms: int
    accommodates: int
    photo_url: Optional[str] = None
    is_archived: bool = False
    archived_at: Optional[datetime] = None


class PropertyUpdate(SQLModel):
    name: Optional[str] = None
    city: Optional[str] = None
    property_type: Optional[str] = None
    base_price: Optional[float] = None
    bedrooms: Optional[int] = None
    accommodates: Optional[int] = None

    @field_validator("name", "city", "property_type")
    @classmethod
    def optional_non_empty_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty")

        return value

    @field_validator("base_price")
    @classmethod
    def optional_positive_base_price(cls, value: Optional[float]) -> Optional[float]:
        if value is not None and value <= 0:
            raise ValueError("base_price must be greater than 0")

        return value

    @field_validator("bedrooms")
    @classmethod
    def optional_valid_bedrooms(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and (value < 0 or value > 20):
            raise ValueError("bedrooms must be between 0 and 20")

        return value

    @field_validator("accommodates")
    @classmethod
    def optional_valid_accommodates(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and (value <= 0 or value > 100):
            raise ValueError("accommodates must be between 1 and 100")

        return value


class PropertySummary(SQLModel):
    property_id: int
    property_code: str
    name: str
    city: str
    property_type: str
    base_price: float
    bedrooms: int
    accommodates: int
    photo_url: Optional[str] = None
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    total_revenue: float
    total_bookings: int
    total_booked_nights: int
    adr: float
    revenue_per_booked_night: float
    average_length_of_stay: float


class PropertyListResponse(SQLModel):
    items: list[PropertyRead]
    total: int
    limit: int
    offset: int


class PropertySummaryListResponse(SQLModel):
    items: list[PropertySummary]
    total: int
    limit: int
    offset: int