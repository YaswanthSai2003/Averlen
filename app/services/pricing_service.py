from app.db.models import Booking, Property
from app.schemas.pricing import PricingRecommendation


def calculate_pricing_recommendation(
    property_obj: Property,
    property_bookings: list[Booking],
    city_bookings: list[Booking],
) -> PricingRecommendation:
    current_base_price = property_obj.base_price

    property_avg = (
        sum(b.price for b in property_bookings) / len(property_bookings)
        if property_bookings
        else current_base_price
    )

    city_avg = (
        sum(b.price for b in city_bookings) / len(city_bookings)
        if city_bookings
        else current_base_price
    )

    booking_volume = len(property_bookings)
    demand_score = min(
        100.0, (booking_volume * 20) + ((city_avg / current_base_price) * 30)
    )

    recommended_price = current_base_price
    adjustment_type = "keep"
    reason = "Current price is aligned with booking and city-level demand."

    if demand_score >= 75 and property_avg > current_base_price:
        recommended_price = round(current_base_price * 1.12, 2)
        adjustment_type = "increase"
        reason = "High demand score and strong booking values support a price increase."
    elif demand_score <= 35:
        recommended_price = round(current_base_price * 0.9, 2)
        adjustment_type = "decrease"
        reason = "Lower demand score suggests reducing price to improve bookings."
    elif city_avg > current_base_price * 1.08:
        recommended_price = round(current_base_price * 1.06, 2)
        adjustment_type = "increase"
        reason = "City-level booking values support a moderate price increase."

    confidence_score = min(95.0, 50.0 + (booking_volume * 10))

    return PricingRecommendation(
        property_id=property_obj.id,
        current_base_price=current_base_price,
        recommended_price=recommended_price,
        demand_score=round(demand_score, 2),
        confidence_score=round(confidence_score, 2),
        adjustment_type=adjustment_type,
        reason=reason,
    )
