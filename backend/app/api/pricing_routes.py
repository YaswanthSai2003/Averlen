from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.db.database import get_session
from app.db.models import Booking, Property, User
from app.schemas.pricing import PricingRecommendation
from app.services.pricing_service import calculate_pricing_recommendation

router = APIRouter(prefix="/recommendations", tags=["Pricing"])


@router.get("/pricing/{property_id}", response_model=PricingRecommendation)
def get_pricing_recommendation(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    properties = session.exec(
        select(Property).where(Property.organization_id == current_user.organization_id)
    ).all()

    property_ids = [
        property_item.id for property_item in properties if property_item.id is not None
    ]

    bookings = (
        session.exec(select(Booking).where(Booking.property_id.in_(property_ids))).all()
        if property_ids
        else []
    )

    property_bookings = [
        booking for booking in bookings if booking.property_id == property_id
    ]

    property_city_map = {
        property_item.id: property_item.city for property_item in properties
    }

    city_bookings = [
        booking
        for booking in bookings
        if property_city_map.get(booking.property_id) == property_obj.city
    ]

    return calculate_pricing_recommendation(
        property_obj=property_obj,
        property_bookings=property_bookings,
        city_bookings=city_bookings,
    )
