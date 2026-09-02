from sqlmodel import SQLModel

from app.schemas.pricing import PricingRecommendation


class RevenueSummary(SQLModel):
    total_revenue: float
    total_bookings: int
    average_booking_value: float


class CityRevenue(SQLModel):
    city: str
    total_revenue: float
    booking_count: int


class PropertyRevenue(SQLModel):
    property_id: int
    total_revenue: float
    booking_count: int


class OccupancySummary(SQLModel):
    total_booked_nights: int
    total_bookings: int
    average_length_of_stay: float


class TopPropertySummary(SQLModel):
    id: int
    name: str
    city: str
    total_revenue: float


class DashboardSummary(SQLModel):
    total_revenue: float
    total_revenue_change_pct: float | None = None

    total_bookings: int
    total_bookings_change_pct: float | None = None

    average_booking_value: float
    average_booking_value_change_pct: float | None = None

    total_booked_nights: int

    average_length_of_stay: float
    average_length_of_stay_change_pct: float | None = None

    top_city_by_revenue: str
    top_property_by_revenue: TopPropertySummary | None = None


class PerformanceMetric(SQLModel):
    total_revenue: float
    total_bookings: int
    total_booked_nights: int
    adr: float
    revenue_per_booked_night: float
    average_length_of_stay: float


class CityPerformance(SQLModel):
    city: str
    total_revenue: float
    total_bookings: int
    total_booked_nights: int
    adr: float
    revenue_per_booked_night: float


class PropertyPerformance(SQLModel):
    property_id: int
    property_name: str
    city: str
    total_revenue: float
    total_bookings: int
    total_booked_nights: int
    adr: float
    revenue_per_booked_night: float


class AnalyticsPerformanceResponse(SQLModel):
    overall: PerformanceMetric
    city_performance: list[CityPerformance]
    property_performance: list[PropertyPerformance]


class TrendPoint(SQLModel):
    date: str
    total_revenue: float
    booking_count: int
    booked_nights: int


class AnalyticsTrendResponse(SQLModel):
    trends: list[TrendPoint]


class PropertyAnalyticsInfo(SQLModel):
    id: int
    name: str
    city: str
    property_type: str
    base_price: float
    bedrooms: int
    accommodates: int
    photo_url: str | None = None


class PropertyAnalyticsResponse(SQLModel):
    property: PropertyAnalyticsInfo
    metrics: PerformanceMetric
    trends: list[TrendPoint]
    pricing_recommendation: PricingRecommendation | None = None