import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.deps import (
    get_current_user,
    require_writable_revenue_manager_or_admin,
)
from app.db.database import get_session
from app.db.models import Booking, PricingRecommendationHistory, Property, User
from app.schemas.pricing import (
    PricingFactor,
    PricingRecommendation,
    PricingRecommendationHistoryListResponse,
    PricingRecommendationHistoryRead,
    PricingRecommendationStatusUpdate,
)
from app.services.notification_service import notify_pricing_opportunity
from app.services.pricing_service import calculate_pricing_recommendation

router = APIRouter(prefix="/recommendations", tags=["Pricing"])


def calculate_property_recommendation(
    session: Session,
    *,
    current_user: User,
    property_id: int,
) -> tuple[Property, PricingRecommendation]:
    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    properties = session.exec(
        select(Property).where(
            Property.organization_id == current_user.organization_id
        )
    ).all()

    property_ids = [
        property_item.id
        for property_item in properties
        if property_item.id is not None
    ]

    bookings = (
        session.exec(
            select(Booking).where(
                Booking.organization_id == current_user.organization_id,
                Booking.property_id.in_(property_ids),
            )
        ).all()
        if property_ids
        else []
    )

    property_bookings = [
        booking
        for booking in bookings
        if booking.property_id == property_id
    ]

    property_city_map = {
        property_item.id: property_item.city
        for property_item in properties
        if property_item.id is not None
    }

    city_bookings = [
        booking
        for booking in bookings
        if property_city_map.get(booking.property_id) == property_obj.city
    ]

    recommendation = calculate_pricing_recommendation(
        property_obj=property_obj,
        property_bookings=property_bookings,
        city_bookings=city_bookings,
    )

    return property_obj, recommendation


def store_pricing_history(
    session: Session,
    *,
    current_user: User,
    recommendation: PricingRecommendation,
) -> PricingRecommendationHistory:
    record = PricingRecommendationHistory(
        organization_id=current_user.organization_id,
        property_id=recommendation.property_id,
        created_by_user_id=current_user.id,
        current_base_price=recommendation.current_base_price,
        recommended_price=recommendation.recommended_price,
        demand_score=recommendation.demand_score,
        confidence_score=recommendation.confidence_score,
        adjustment_type=recommendation.adjustment_type,
        reason=recommendation.reason,
        property_average_price=recommendation.property_average_price,
        city_average_price=recommendation.city_average_price,
        booking_volume=recommendation.booking_volume,
        city_booking_volume=recommendation.city_booking_volume,
        price_change_percent=recommendation.price_change_percent,
        risk_level=recommendation.risk_level,
        data_quality=recommendation.data_quality,
        explanation_summary=recommendation.explanation_summary,
        pricing_factors_json=json.dumps(
            [factor.model_dump() for factor in recommendation.pricing_factors]
        ),
    )

    session.add(record)
    session.commit()
    session.refresh(record)

    return record


def build_history_read(
    record: PricingRecommendationHistory,
) -> PricingRecommendationHistoryRead:
    try:
        factors = [
            PricingFactor(**item)
            for item in json.loads(record.pricing_factors_json or "[]")
        ]
    except Exception:
        factors = []

    return PricingRecommendationHistoryRead(
        id=record.id,
        organization_id=record.organization_id,
        created_by_user_id=record.created_by_user_id,
        property_id=record.property_id,
        current_base_price=record.current_base_price,
        recommended_price=record.recommended_price,
        demand_score=record.demand_score,
        confidence_score=record.confidence_score,
        adjustment_type=record.adjustment_type,
        reason=record.reason,
        property_average_price=record.property_average_price,
        city_average_price=record.city_average_price,
        booking_volume=record.booking_volume,
        city_booking_volume=record.city_booking_volume,
        price_change_percent=record.price_change_percent,
        risk_level=record.risk_level,
        data_quality=record.data_quality,
        explanation_summary=record.explanation_summary,
        pricing_factors=factors,
        status=record.status,
        created_at=record.created_at,
    )


def get_pricing_history_or_404(
    session: Session,
    *,
    history_id: int,
    current_user: User,
) -> PricingRecommendationHistory:
    record = session.get(PricingRecommendationHistory, history_id)

    if not record or record.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Pricing history not found")

    return record


@router.get("/pricing/{property_id}", response_model=PricingRecommendation)
def preview_pricing_recommendation(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _, recommendation = calculate_property_recommendation(
        session=session,
        current_user=current_user,
        property_id=property_id,
    )

    return recommendation


@router.get("/pricing/{property_id}/preview", response_model=PricingRecommendation)
def preview_pricing_recommendation_alias(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _, recommendation = calculate_property_recommendation(
        session=session,
        current_user=current_user,
        property_id=property_id,
    )

    return recommendation


@router.post(
    "/pricing/{property_id}/generate",
    response_model=PricingRecommendationHistoryRead,
)
def generate_pricing_recommendation(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_revenue_manager_or_admin),
):
    property_obj, recommendation = calculate_property_recommendation(
        session=session,
        current_user=current_user,
        property_id=property_id,
    )

    record = store_pricing_history(
        session=session,
        current_user=current_user,
        recommendation=recommendation,
    )

    notify_pricing_opportunity(
        session=session,
        current_user=current_user,
        property_obj=property_obj,
        recommendation=recommendation,
    )

    return build_history_read(record)


@router.get(
    "/pricing/{property_id}/history",
    response_model=PricingRecommendationHistoryListResponse,
)
def list_pricing_recommendation_history(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    total = session.exec(
        select(func.count(PricingRecommendationHistory.id)).where(
            PricingRecommendationHistory.organization_id == current_user.organization_id,
            PricingRecommendationHistory.property_id == property_id,
        )
    ).one()

    records = session.exec(
        select(PricingRecommendationHistory)
        .where(
            PricingRecommendationHistory.organization_id
            == current_user.organization_id,
            PricingRecommendationHistory.property_id == property_id,
        )
        .order_by(PricingRecommendationHistory.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return PricingRecommendationHistoryListResponse(
        items=[
            build_history_read(record)
            for record in records
            if record.id is not None
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.patch(
    "/pricing/history/{history_id}/status",
    response_model=PricingRecommendationHistoryRead,
)
def update_pricing_recommendation_status(
    history_id: int,
    payload: PricingRecommendationStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_revenue_manager_or_admin),
):
    record = get_pricing_history_or_404(
        session=session,
        history_id=history_id,
        current_user=current_user,
    )

    record.status = payload.status

    session.add(record)
    session.commit()
    session.refresh(record)

    return build_history_read(record)