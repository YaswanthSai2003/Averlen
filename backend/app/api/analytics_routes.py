import csv
from io import StringIO

from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.cache import get_cache, set_cache
from app.db.database import get_session
from app.db.models import Booking, Property, User
from app.schemas.analytics import (
    AnalyticsPerformanceResponse,
    AnalyticsTrendResponse,
    CityPerformance,
    CityRevenue,
    DashboardSummary,
    OccupancySummary,
    PerformanceMetric,
    PropertyAnalyticsInfo,
    PropertyAnalyticsResponse,
    PropertyPerformance,
    PropertyRevenue,
    RevenueSummary,
    TopPropertySummary,
    TrendPoint,
)
from app.services.pricing_service import calculate_pricing_recommendation

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
        property_obj.id
        for property_obj in properties
        if property_obj.id is not None
    ]


def get_organization_bookings(
    session: Session,
    organization_id: int,
) -> list[Booking]:
    property_ids = get_organization_property_ids(session, organization_id)

    if not property_ids:
        return []

    return session.exec(
        select(Booking).where(
            Booking.organization_id == organization_id,
            Booking.property_id.in_(property_ids),
        )
    ).all()


def calculate_booked_nights(booking: Booking) -> int:
    return max((booking.check_out - booking.check_in).days, 0)


def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0

    return round(numerator / denominator, 2)


def validate_date_range(
    start_date: date | None,
    end_date: date | None,
) -> None:
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="end_date must be greater than or equal to start_date",
        )


def apply_date_filter(
    bookings: list[Booking],
    start_date: date | None,
    end_date: date | None,
) -> list[Booking]:
    validate_date_range(start_date, end_date)

    return [
        booking
        for booking in bookings
        if (start_date is None or booking.check_in >= start_date)
        and (end_date is None or booking.check_in <= end_date)
    ]


def build_date_cache_suffix(
    start_date: date | None,
    end_date: date | None,
) -> str:
    start_value = start_date.isoformat() if start_date else "all"
    end_value = end_date.isoformat() if end_date else "all"

    return f":start:{start_value}:end:{end_value}"


def get_previous_period_dates(
    start_date: date | None,
    end_date: date | None,
) -> tuple[date | None, date | None]:
    if not start_date or not end_date:
        return None, None

    period_days = (end_date - start_date).days + 1
    previous_end = start_date - timedelta(days=1)
    previous_start = previous_end - timedelta(days=period_days - 1)

    return previous_start, previous_end


def calculate_change_pct(
    current_value: float,
    previous_value: float,
) -> float | None:
    if previous_value == 0:
        if current_value == 0:
            return 0.0

        return None

    return round(((current_value - previous_value) / previous_value) * 100, 2)


def calculate_metrics(bookings: list[Booking]) -> PerformanceMetric:
    total_revenue = sum(booking.price for booking in bookings)
    total_bookings = len(bookings)
    total_booked_nights = sum(
        calculate_booked_nights(booking) for booking in bookings
    )

    return PerformanceMetric(
        total_revenue=round(total_revenue, 2),
        total_bookings=total_bookings,
        total_booked_nights=total_booked_nights,
        adr=safe_divide(total_revenue, total_bookings),
        revenue_per_booked_night=safe_divide(
            total_revenue,
            total_booked_nights,
        ),
        average_length_of_stay=safe_divide(
            total_booked_nights,
            total_bookings,
        ),
    )


def build_trends(bookings: list[Booking]) -> list[TrendPoint]:
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

    return [
        TrendPoint(
            date=trend_date.isoformat(),
            total_revenue=round(data["total_revenue"], 2),
            booking_count=int(data["booking_count"]),
            booked_nights=int(data["booked_nights"]),
        )
        for trend_date, data in sorted(
            trend_map.items(),
            key=lambda item: item[0],
        )
    ]


@router.get("/revenue", response_model=RevenueSummary)
def get_revenue_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    validate_date_range(start_date, end_date)
    date_cache_suffix = build_date_cache_suffix(start_date, end_date)

    cache_key = (
        f"analytics:revenue_summary:org:{current_user.organization_id}"
        f"{date_cache_suffix}"
    )

    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data

    bookings = get_organization_bookings(session, current_user.organization_id)
    bookings = apply_date_filter(bookings, start_date, end_date)

    total_revenue = sum(booking.price for booking in bookings)
    total_bookings = len(bookings)
    average_booking_value = (
        total_revenue / total_bookings if total_bookings else 0.0
    )

    result = RevenueSummary(
        total_revenue=round(total_revenue, 2),
        total_bookings=total_bookings,
        average_booking_value=round(average_booking_value, 2),
    )

    set_cache(cache_key, result.model_dump())
    return result


@router.get("/revenue/by-city", response_model=list[CityRevenue])
def get_revenue_by_city(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    validate_date_range(start_date, end_date)
    date_cache_suffix = build_date_cache_suffix(start_date, end_date)

    cache_key = (
        f"analytics:revenue_by_city:org:{current_user.organization_id}"
        f"{date_cache_suffix}"
    )

    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data

    properties = get_organization_properties(
        session,
        current_user.organization_id,
    )

    property_city_map = {
        property_obj.id: property_obj.city
        for property_obj in properties
        if property_obj.id is not None
    }

    if not property_city_map:
        return []

    bookings = session.exec(
        select(Booking).where(
            Booking.organization_id == current_user.organization_id,
            Booking.property_id.in_(property_city_map.keys()),
        )
    ).all()

    bookings = apply_date_filter(bookings, start_date, end_date)

    city_map = defaultdict(lambda: {"total_revenue": 0.0, "booking_count": 0})

    for booking in bookings:
        city = property_city_map.get(booking.property_id, "Unknown")
        city_map[city]["total_revenue"] += booking.price
        city_map[city]["booking_count"] += 1

    result = [
        CityRevenue(
            city=city,
            total_revenue=round(data["total_revenue"], 2),
            booking_count=data["booking_count"],
        )
        for city, data in sorted(
            city_map.items(),
            key=lambda item: item[1]["total_revenue"],
            reverse=True,
        )
    ]

    set_cache(cache_key, [item.model_dump() for item in result])
    return result


@router.get("/revenue/by-property", response_model=list[PropertyRevenue])
def get_revenue_by_property(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    validate_date_range(start_date, end_date)
    date_cache_suffix = build_date_cache_suffix(start_date, end_date)

    cache_key = (
        f"analytics:revenue_by_property:org:{current_user.organization_id}"
        f"{date_cache_suffix}"
    )

    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data

    bookings = get_organization_bookings(session, current_user.organization_id)
    bookings = apply_date_filter(bookings, start_date, end_date)

    revenue_map = defaultdict(lambda: {"total_revenue": 0.0, "booking_count": 0})

    for booking in bookings:
        revenue_map[booking.property_id]["total_revenue"] += booking.price
        revenue_map[booking.property_id]["booking_count"] += 1

    result = [
        PropertyRevenue(
            property_id=property_id,
            total_revenue=round(data["total_revenue"], 2),
            booking_count=data["booking_count"],
        )
        for property_id, data in sorted(
            revenue_map.items(),
            key=lambda item: item[1]["total_revenue"],
            reverse=True,
        )
    ]

    set_cache(cache_key, [item.model_dump() for item in result])
    return result


@router.get("/occupancy", response_model=OccupancySummary)
def get_occupancy_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    bookings = get_organization_bookings(session, current_user.organization_id)
    bookings = apply_date_filter(bookings, start_date, end_date)

    total_booked_nights = sum(
        calculate_booked_nights(booking) for booking in bookings
    )

    total_bookings = len(bookings)

    return OccupancySummary(
        total_booked_nights=total_booked_nights,
        total_bookings=total_bookings,
        average_length_of_stay=safe_divide(
            total_booked_nights,
            total_bookings,
        ),
    )


@router.get("/dashboard-summary", response_model=DashboardSummary)
def get_dashboard_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    compare: bool = Query(default=False),
):
    validate_date_range(start_date, end_date)

    properties = get_organization_properties(
        session,
        current_user.organization_id,
    )

    property_map = {
        property_obj.id: property_obj
        for property_obj in properties
        if property_obj.id is not None
    }

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

    all_bookings = session.exec(
        select(Booking).where(
            Booking.organization_id == current_user.organization_id,
            Booking.property_id.in_(property_map.keys()),
        )
    ).all()

    bookings = apply_date_filter(all_bookings, start_date, end_date)
    current_metrics = calculate_metrics(bookings)

    previous_metrics = None

    if compare:
        previous_start_date, previous_end_date = get_previous_period_dates(
            start_date,
            end_date,
        )

        if previous_start_date and previous_end_date:
            previous_bookings = apply_date_filter(
                all_bookings,
                previous_start_date,
                previous_end_date,
            )
            previous_metrics = calculate_metrics(previous_bookings)

    city_revenue = defaultdict(float)
    property_revenue = defaultdict(float)

    for booking in bookings:
        property_obj = property_map.get(booking.property_id)
        city = property_obj.city if property_obj else "Unknown"

        city_revenue[city] += booking.price
        property_revenue[booking.property_id] += booking.price

    top_city = (
        max(city_revenue.items(), key=lambda item: item[1])[0]
        if city_revenue
        else "N/A"
    )

    top_property_id = (
        max(property_revenue.items(), key=lambda item: item[1])[0]
        if property_revenue
        else None
    )

    top_property_summary = None

    if top_property_id is not None:
        top_property_obj = property_map.get(top_property_id)

        if top_property_obj and top_property_obj.id is not None:
            top_property_summary = TopPropertySummary(
                id=top_property_obj.id,
                name=top_property_obj.name,
                city=top_property_obj.city,
                total_revenue=round(property_revenue[top_property_id], 2),
            )

    return DashboardSummary(
        total_revenue=current_metrics.total_revenue,
        total_revenue_change_pct=(
            calculate_change_pct(
                current_metrics.total_revenue,
                previous_metrics.total_revenue,
            )
            if previous_metrics
            else None
        ),
        total_bookings=current_metrics.total_bookings,
        total_bookings_change_pct=(
            calculate_change_pct(
                current_metrics.total_bookings,
                previous_metrics.total_bookings,
            )
            if previous_metrics
            else None
        ),
        average_booking_value=current_metrics.adr,
        average_booking_value_change_pct=(
            calculate_change_pct(
                current_metrics.adr,
                previous_metrics.adr,
            )
            if previous_metrics
            else None
        ),
        total_booked_nights=current_metrics.total_booked_nights,
        average_length_of_stay=current_metrics.average_length_of_stay,
        average_length_of_stay_change_pct=(
            calculate_change_pct(
                current_metrics.average_length_of_stay,
                previous_metrics.average_length_of_stay,
            )
            if previous_metrics
            else None
        ),
        top_city_by_revenue=top_city,
        top_property_by_revenue=top_property_summary,
    )


@router.get("/performance", response_model=AnalyticsPerformanceResponse)
def get_performance_analytics(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    validate_date_range(start_date, end_date)

    properties = get_organization_properties(
        session,
        current_user.organization_id,
    )

    property_map = {
        property_obj.id: property_obj
        for property_obj in properties
        if property_obj.id is not None
    }

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
        select(Booking).where(
            Booking.organization_id == current_user.organization_id,
            Booking.property_id.in_(property_map.keys()),
        )
    ).all()

    bookings = apply_date_filter(bookings, start_date, end_date)

    overall = calculate_metrics(bookings)

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

        if not property_obj:
            continue

        booked_nights = calculate_booked_nights(booking)

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
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    bookings = get_organization_bookings(session, current_user.organization_id)
    bookings = apply_date_filter(bookings, start_date, end_date)

    return AnalyticsTrendResponse(trends=build_trends(bookings))


@router.get("/properties/{property_id}", response_model=PropertyAnalyticsResponse)
def get_property_analytics(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    validate_date_range(start_date, end_date)

    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    property_bookings = session.exec(
        select(Booking).where(
            Booking.organization_id == current_user.organization_id,
            Booking.property_id == property_id,
        )
    ).all()

    property_bookings = apply_date_filter(
        property_bookings,
        start_date,
        end_date,
    )

    all_properties = get_organization_properties(
        session=session,
        organization_id=current_user.organization_id,
    )

    city_property_ids = [
        item.id
        for item in all_properties
        if item.id is not None and item.city == property_obj.city
    ]

    city_bookings = (
        session.exec(
            select(Booking).where(
                Booking.organization_id == current_user.organization_id,
                Booking.property_id.in_(city_property_ids),
            )
        ).all()
        if city_property_ids
        else []
    )

    city_bookings = apply_date_filter(
        city_bookings,
        start_date,
        end_date,
    )

    pricing_recommendation = calculate_pricing_recommendation(
        property_obj=property_obj,
        property_bookings=property_bookings,
        city_bookings=city_bookings,
    )

    return PropertyAnalyticsResponse(
        property=PropertyAnalyticsInfo(
            id=property_obj.id,
            name=property_obj.name,
            city=property_obj.city,
            property_type=property_obj.property_type,
            base_price=property_obj.base_price,
            bedrooms=property_obj.bedrooms,
            accommodates=property_obj.accommodates,
            photo_url=property_obj.photo_url,
        ),
        metrics=calculate_metrics(property_bookings),
        trends=build_trends(property_bookings),
        pricing_recommendation=pricing_recommendation,
    )


@router.get("/export/csv")
def export_analytics_csv(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    validate_date_range(start_date, end_date)

    properties = get_organization_properties(
        session=session,
        organization_id=current_user.organization_id,
    )

    property_map = {
        property_obj.id: property_obj
        for property_obj in properties
        if property_obj.id is not None
    }

    bookings = get_organization_bookings(
        session=session,
        organization_id=current_user.organization_id,
    )
    bookings = apply_date_filter(bookings, start_date, end_date)

    csv_buffer = StringIO()

    fieldnames = [
        "property_id",
        "property_name",
        "city",
        "property_type",
        "check_in",
        "check_out",
        "booked_on",
        "booked_nights",
        "price",
    ]

    writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
    writer.writeheader()

    for booking in bookings:
        property_obj = property_map.get(booking.property_id)

        writer.writerow(
            {
                "property_id": booking.property_id,
                "property_name": property_obj.name if property_obj else "",
                "city": property_obj.city if property_obj else "",
                "property_type": property_obj.property_type if property_obj else "",
                "check_in": booking.check_in.isoformat(),
                "check_out": booking.check_out.isoformat(),
                "booked_on": booking.booked_on.isoformat(),
                "booked_nights": calculate_booked_nights(booking),
                "price": round(booking.price, 2),
            }
        )

    filename_parts = ["averlen_analytics_export"]

    if start_date:
        filename_parts.append(start_date.isoformat())

    if end_date:
        filename_parts.append(end_date.isoformat())

    filename = "_".join(filename_parts) + ".csv"

    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )