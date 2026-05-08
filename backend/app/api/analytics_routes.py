from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.cache import get_cache, set_cache
from app.db.database import get_session
from app.db.models import Booking, Property, User
from app.schemas.analytics import (AnalyticsPerformanceResponse,
                                   AnalyticsTrendResponse, CityPerformance,
                                   CityRevenue, DashboardSummary,
                                   OccupancySummary, PerformanceMetric,
                                   PropertyPerformance, PropertyRevenue,
                                   RevenueSummary, TrendPoint)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_organization_properties(
    session: Session,
    organization_id: int,
) -> list[Property]:
    return session.exec(
        select(Property).where(Property.organization_id == organization_id)
    ).all()


def get_organization_property_ids(
    session: Session,
    organization_id: int,
) -> list[int]:
    properties = get_organization_properties(session, organization_id)
    return [
        property_obj.id for property_obj in properties if property_obj.id is not None
    ]


def get_organization_bookings(
    session: Session,
    organization_id: int,
) -> list[Booking]:
    property_ids = get_organization_property_ids(session, organization_id)

    if not property_ids:
        return []

    return session.exec(
        select(Booking).where(Booking.property_id.in_(property_ids))
    ).all()


def calculate_booked_nights(booking: Booking) -> int:
    return max((booking.check_out - booking.check_in).days, 0)


def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0

    return round(numerator / denominator, 2)


@router.get("/revenue", response_model=RevenueSummary)
def get_revenue_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    cache_key = f"analytics:revenue_summary:org:{current_user.organization_id}"
    cached_data = get_cache(cache_key)

    if cached_data:
        return cached_data

    bookings = get_organization_bookings(session, current_user.organization_id)

    total_revenue = sum(booking.price for booking in bookings)
    total_bookings = len(bookings)
    average_booking_value = total_revenue / total_bookings if total_bookings else 0.0

    result = RevenueSummary(
        total_revenue=total_revenue,
        total_bookings=total_bookings,
        average_booking_value=average_booking_value,
    )

    set_cache(cache_key, result.model_dump())
    return result


@router.get("/revenue/by-city", response_model=list[CityRevenue])
def get_revenue_by_city(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    cache_key = f"analytics:revenue_by_city:org:{current_user.organization_id}"
    cached_data = get_cache(cache_key)

    if cached_data:
        return cached_data

    properties = get_organization_properties(session, current_user.organization_id)
    property_city_map = {
        property_obj.id: property_obj.city for property_obj in properties
    }

    if not property_city_map:
        return []

    bookings = session.exec(
        select(Booking).where(Booking.property_id.in_(property_city_map.keys()))
    ).all()

    city_map = defaultdict(lambda: {"total_revenue": 0.0, "booking_count": 0})

    for booking in bookings:
        city = property_city_map.get(booking.property_id, "Unknown")
        city_map[city]["total_revenue"] += booking.price
        city_map[city]["booking_count"] += 1

    result = [
        CityRevenue(
            city=city,
            total_revenue=data["total_revenue"],
            booking_count=data["booking_count"],
        )
        for city, data in city_map.items()
    ]

    set_cache(cache_key, [item.model_dump() for item in result])
    return result


@router.get("/revenue/by-property", response_model=list[PropertyRevenue])
def get_revenue_by_property(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    cache_key = f"analytics:revenue_by_property:org:{current_user.organization_id}"
    cached_data = get_cache(cache_key)

    if cached_data:
        return cached_data

    bookings = get_organization_bookings(session, current_user.organization_id)

    revenue_map = defaultdict(lambda: {"total_revenue": 0.0, "booking_count": 0})

    for booking in bookings:
        revenue_map[booking.property_id]["total_revenue"] += booking.price
        revenue_map[booking.property_id]["booking_count"] += 1

    result = [
        PropertyRevenue(
            property_id=property_id,
            total_revenue=data["total_revenue"],
            booking_count=data["booking_count"],
        )
        for property_id, data in revenue_map.items()
    ]

    set_cache(cache_key, [item.model_dump() for item in result])
    return result


@router.get("/occupancy", response_model=OccupancySummary)
def get_occupancy_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    bookings = get_organization_bookings(session, current_user.organization_id)

    total_booked_nights = sum(calculate_booked_nights(booking) for booking in bookings)
    total_bookings = len(bookings)

    return OccupancySummary(
        total_booked_nights=total_booked_nights,
        total_bookings=total_bookings,
        average_length_of_stay=(
            total_booked_nights / total_bookings if total_bookings else 0.0
        ),
    )


@router.get("/dashboard-summary", response_model=DashboardSummary)
def get_dashboard_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    properties = get_organization_properties(session, current_user.organization_id)
    property_map = {property_obj.id: property_obj for property_obj in properties}

    if not property_map:
        return DashboardSummary(
            total_revenue=0.0,
            total_bookings=0,
            average_booking_value=0.0,
            total_booked_nights=0,
            average_length_of_stay=0.0,
            top_city_by_revenue="N/A",
            top_property_by_revenue=None,
        )

    bookings = session.exec(
        select(Booking).where(Booking.property_id.in_(property_map.keys()))
    ).all()

    city_revenue = defaultdict(float)
    property_revenue = defaultdict(float)

    total_revenue = 0.0
    total_booked_nights = 0

    for booking in bookings:
        total_revenue += booking.price
        total_booked_nights += calculate_booked_nights(booking)

        property_obj = property_map.get(booking.property_id)
        city = property_obj.city if property_obj else "Unknown"

        city_revenue[city] += booking.price
        property_revenue[booking.property_id] += booking.price

    total_bookings = len(bookings)

    top_city = (
        max(city_revenue.items(), key=lambda item: item[1])[0]
        if city_revenue
        else "N/A"
    )

    top_property = (
        max(property_revenue.items(), key=lambda item: item[1])[0]
        if property_revenue
        else None
    )

    return DashboardSummary(
        total_revenue=total_revenue,
        total_bookings=total_bookings,
        average_booking_value=total_revenue / total_bookings if total_bookings else 0.0,
        total_booked_nights=total_booked_nights,
        average_length_of_stay=(
            total_booked_nights / total_bookings if total_bookings else 0.0
        ),
        top_city_by_revenue=top_city,
        top_property_by_revenue=top_property,
    )


@router.get("/performance", response_model=AnalyticsPerformanceResponse)
def get_performance_analytics(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    properties = get_organization_properties(session, current_user.organization_id)
    property_map = {property_obj.id: property_obj for property_obj in properties}

    if not property_map:
        return AnalyticsPerformanceResponse(
            overall=PerformanceMetric(
                total_revenue=0.0,
                total_bookings=0,
                total_booked_nights=0,
                adr=0.0,
                revenue_per_booked_night=0.0,
                average_length_of_stay=0.0,
            ),
            city_performance=[],
            property_performance=[],
        )

    bookings = session.exec(
        select(Booking).where(Booking.property_id.in_(property_map.keys()))
    ).all()

    total_revenue = sum(booking.price for booking in bookings)
    total_bookings = len(bookings)
    total_booked_nights = sum(calculate_booked_nights(booking) for booking in bookings)

    overall = PerformanceMetric(
        total_revenue=round(total_revenue, 2),
        total_bookings=total_bookings,
        total_booked_nights=total_booked_nights,
        adr=safe_divide(total_revenue, total_bookings),
        revenue_per_booked_night=safe_divide(total_revenue, total_booked_nights),
        average_length_of_stay=safe_divide(total_booked_nights, total_bookings),
    )

    city_map = defaultdict(
        lambda: {
            "total_revenue": 0.0,
            "total_bookings": 0,
            "total_booked_nights": 0,
        }
    )

    property_perf_map = defaultdict(
        lambda: {
            "total_revenue": 0.0,
            "total_bookings": 0,
            "total_booked_nights": 0,
        }
    )

    for booking in bookings:
        property_obj = property_map.get(booking.property_id)
        booked_nights = calculate_booked_nights(booking)

        if not property_obj:
            continue

        city_map[property_obj.city]["total_revenue"] += booking.price
        city_map[property_obj.city]["total_bookings"] += 1
        city_map[property_obj.city]["total_booked_nights"] += booked_nights

        property_perf_map[booking.property_id]["total_revenue"] += booking.price
        property_perf_map[booking.property_id]["total_bookings"] += 1
        property_perf_map[booking.property_id]["total_booked_nights"] += booked_nights

    city_performance = [
        CityPerformance(
            city=city,
            total_revenue=round(data["total_revenue"], 2),
            total_bookings=data["total_bookings"],
            total_booked_nights=data["total_booked_nights"],
            adr=safe_divide(data["total_revenue"], data["total_bookings"]),
            revenue_per_booked_night=safe_divide(
                data["total_revenue"],
                data["total_booked_nights"],
            ),
        )
        for city, data in sorted(
            city_map.items(),
            key=lambda item: item[1]["total_revenue"],
            reverse=True,
        )
    ]

    property_performance = [
        PropertyPerformance(
            property_id=property_id,
            property_name=property_map[property_id].name,
            city=property_map[property_id].city,
            total_revenue=round(data["total_revenue"], 2),
            total_bookings=data["total_bookings"],
            total_booked_nights=data["total_booked_nights"],
            adr=safe_divide(data["total_revenue"], data["total_bookings"]),
            revenue_per_booked_night=safe_divide(
                data["total_revenue"],
                data["total_booked_nights"],
            ),
        )
        for property_id, data in sorted(
            property_perf_map.items(),
            key=lambda item: item[1]["total_revenue"],
            reverse=True,
        )
        if property_id in property_map
    ]

    return AnalyticsPerformanceResponse(
        overall=overall,
        city_performance=city_performance,
        property_performance=property_performance,
    )


@router.get("/trends", response_model=AnalyticsTrendResponse)
def get_analytics_trends(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    bookings = get_organization_bookings(session, current_user.organization_id)

    trend_map: dict[date, dict[str, float | int]] = defaultdict(
        lambda: {
            "total_revenue": 0.0,
            "booking_count": 0,
            "booked_nights": 0,
        }
    )

    for booking in bookings:
        trend_date = booking.check_in
        trend_map[trend_date]["total_revenue"] += booking.price
        trend_map[trend_date]["booking_count"] += 1
        trend_map[trend_date]["booked_nights"] += calculate_booked_nights(booking)

    trends = [
        TrendPoint(
            date=trend_date.isoformat(),
            total_revenue=round(data["total_revenue"], 2),
            booking_count=int(data["booking_count"]),
            booked_nights=int(data["booked_nights"]),
        )
        for trend_date, data in sorted(trend_map.items(), key=lambda item: item[0])
    ]

    return AnalyticsTrendResponse(trends=trends)
