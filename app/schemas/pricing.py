from sqlmodel import SQLModel


class PricingRecommendation(SQLModel):
    property_id: int
    current_base_price: float
    recommended_price: float
    demand_score: float
    confidence_score: float
    adjustment_type: str
    reason: str
