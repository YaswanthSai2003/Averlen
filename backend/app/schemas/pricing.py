from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class PricingFactor(SQLModel):
    name: str
    value: str
    impact: str
    explanation: str


class PricingRecommendation(SQLModel):
    property_id: int
    current_base_price: float
    recommended_price: float
    demand_score: float
    confidence_score: float
    adjustment_type: str
    reason: str

    property_average_price: float
    city_average_price: float
    booking_volume: int
    city_booking_volume: int
    price_change_percent: float
    risk_level: str
    data_quality: str
    explanation_summary: str
    pricing_factors: list[PricingFactor] = Field(default_factory=list)


class PricingRecommendationHistoryRead(PricingRecommendation):
    id: int
    organization_id: int
    created_by_user_id: int | None = None
    status: str
    created_at: datetime


class PricingRecommendationHistoryListResponse(SQLModel):
    items: list[PricingRecommendationHistoryRead]
    total: int
    limit: int
    offset: int


class PricingRecommendationStatusUpdate(SQLModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        value = value.strip().lower()

        allowed_statuses = {
            "generated",
            "accepted",
            "rejected",
            "applied",
        }

        if value not in allowed_statuses:
            raise ValueError(
                "status must be one of: generated, accepted, rejected, applied"
            )

        return value