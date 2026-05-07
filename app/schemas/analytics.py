from sqlmodel import SQLModel


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


class DashboardSummary(SQLModel):
    total_revenue: float
    total_bookings: int
    average_booking_value: float
    total_booked_nights: int
    average_length_of_stay: float
    top_city_by_revenue: str
    top_property_by_revenue: int | None


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
