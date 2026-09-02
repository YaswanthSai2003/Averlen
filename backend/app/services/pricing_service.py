from app.db.models import Booking, Property
from app.schemas.pricing import PricingFactor, PricingRecommendation


def safe_average(bookings: list[Booking], fallback: float) -> float:
    if not bookings:
        return fallback

    return sum(booking.price for booking in bookings) / len(bookings)


def calculate_percent_change(old_value: float, new_value: float) -> float:
    if old_value <= 0:
        return 0.0

    return round(((new_value - old_value) / old_value) * 100, 2)


def classify_data_quality(
    booking_volume: int,
    city_booking_volume: int,
) -> str:
    if booking_volume == 0 and city_booking_volume == 0:
        return "no_data"

    if booking_volume < 3:
        return "limited"

    if booking_volume < 10:
        return "moderate"

    return "strong"


def classify_risk_level(
    confidence_score: float,
    price_change_percent: float,
) -> str:
    absolute_change = abs(price_change_percent)

    if confidence_score < 60 or absolute_change > 15:
        return "high"

    if confidence_score < 75 or absolute_change > 8:
        return "medium"

    return "low"


def build_pricing_factor(
    name: str,
    value: str,
    impact: str,
    explanation: str,
) -> PricingFactor:
    return PricingFactor(
        name=name,
        value=value,
        impact=impact,
        explanation=explanation,
    )


def build_explanation_summary(
    adjustment_type: str,
    current_base_price: float,
    recommended_price: float,
    booking_volume: int,
    property_avg: float,
    city_avg: float,
    demand_score: float,
    data_quality: str,
) -> str:
    if adjustment_type == "increase":
        decision = "Averlen recommends increasing the price"
    elif adjustment_type == "decrease":
        decision = "Averlen recommends decreasing the price"
    else:
        decision = "Averlen recommends keeping the current price"

    return (
        f"{decision} from {round(current_base_price, 2)} to "
        f"{round(recommended_price, 2)}. This recommendation is based on "
        f"{booking_volume} property bookings, a property average booking value "
        f"of {round(property_avg, 2)}, a city average booking value of "
        f"{round(city_avg, 2)}, and a demand score of {round(demand_score, 2)}. "
        f"Data quality for this recommendation is marked as {data_quality}."
    )


def build_pricing_factors(
    current_base_price: float,
    property_avg: float,
    city_avg: float,
    booking_volume: int,
    city_booking_volume: int,
    demand_score: float,
    confidence_score: float,
) -> list[PricingFactor]:
    factors: list[PricingFactor] = []

    if booking_volume == 0:
        volume_impact = "negative"
        volume_explanation = (
            "No booking history exists for this property, so the recommendation "
            "depends more on base price and city-level signals."
        )
    elif booking_volume < 3:
        volume_impact = "neutral"
        volume_explanation = (
            "Booking history is limited, so the recommendation should be treated "
            "carefully."
        )
    else:
        volume_impact = "positive"
        volume_explanation = (
            "The property has enough booking history to support a more confident "
            "recommendation."
        )

    factors.append(
        build_pricing_factor(
            name="Property booking volume",
            value=str(booking_volume),
            impact=volume_impact,
            explanation=volume_explanation,
        )
    )

    property_price_change = calculate_percent_change(
        current_base_price,
        property_avg,
    )

    if property_price_change > 8:
        property_avg_impact = "positive"
        property_avg_explanation = (
            "The property's average booking value is meaningfully above the base "
            "price, which supports a price increase."
        )
    elif property_price_change < -8:
        property_avg_impact = "negative"
        property_avg_explanation = (
            "The property's average booking value is below the base price, which "
            "suggests price pressure."
        )
    else:
        property_avg_impact = "neutral"
        property_avg_explanation = (
            "The property's average booking value is close to the current base "
            "price."
        )

    factors.append(
        build_pricing_factor(
            name="Property average booking value",
            value=str(round(property_avg, 2)),
            impact=property_avg_impact,
            explanation=property_avg_explanation,
        )
    )

    city_price_change = calculate_percent_change(
        current_base_price,
        city_avg,
    )

    if city_price_change > 8:
        city_avg_impact = "positive"
        city_avg_explanation = (
            "City-level booking values are higher than this property's base "
            "price, which supports an increase."
        )
    elif city_price_change < -8:
        city_avg_impact = "negative"
        city_avg_explanation = (
            "City-level booking values are below this property's base price, "
            "which suggests a conservative recommendation."
        )
    else:
        city_avg_impact = "neutral"
        city_avg_explanation = (
            "City-level booking values are close to this property's base price."
        )

    factors.append(
        build_pricing_factor(
            name="City average booking value",
            value=str(round(city_avg, 2)),
            impact=city_avg_impact,
            explanation=city_avg_explanation,
        )
    )

    factors.append(
        build_pricing_factor(
            name="City booking volume",
            value=str(city_booking_volume),
            impact="positive" if city_booking_volume >= 5 else "neutral",
            explanation=(
                "City booking volume is used as a market demand signal. Higher "
                "city volume improves confidence in city-level pricing patterns."
            ),
        )
    )

    factors.append(
        build_pricing_factor(
            name="Demand score",
            value=str(round(demand_score, 2)),
            impact=(
                "positive"
                if demand_score >= 75
                else "negative"
                if demand_score <= 35
                else "neutral"
            ),
            explanation=(
                "Demand score combines property booking volume and city-level "
                "booking value signals."
            ),
        )
    )

    factors.append(
        build_pricing_factor(
            name="Confidence score",
            value=str(round(confidence_score, 2)),
            impact=(
                "positive"
                if confidence_score >= 75
                else "neutral"
                if confidence_score >= 60
                else "negative"
            ),
            explanation=(
                "Confidence increases when the property has more booking history. "
                "Low confidence means the recommendation should be reviewed manually."
            ),
        )
    )

    return factors


def calculate_pricing_recommendation(
    property_obj: Property,
    property_bookings: list[Booking],
    city_bookings: list[Booking],
) -> PricingRecommendation:
    current_base_price = float(property_obj.base_price)

    property_avg = safe_average(
        bookings=property_bookings,
        fallback=current_base_price,
    )

    city_avg = safe_average(
        bookings=city_bookings,
        fallback=current_base_price,
    )

    booking_volume = len(property_bookings)
    city_booking_volume = len(city_bookings)

    demand_score = min(
        100.0,
        (booking_volume * 20) + ((city_avg / current_base_price) * 30),
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

    confidence_score = min(
        95.0,
        50.0 + (booking_volume * 10),
    )

    price_change_percent = calculate_percent_change(
        old_value=current_base_price,
        new_value=recommended_price,
    )

    data_quality = classify_data_quality(
        booking_volume=booking_volume,
        city_booking_volume=city_booking_volume,
    )

    risk_level = classify_risk_level(
        confidence_score=confidence_score,
        price_change_percent=price_change_percent,
    )

    pricing_factors = build_pricing_factors(
        current_base_price=current_base_price,
        property_avg=property_avg,
        city_avg=city_avg,
        booking_volume=booking_volume,
        city_booking_volume=city_booking_volume,
        demand_score=demand_score,
        confidence_score=confidence_score,
    )

    explanation_summary = build_explanation_summary(
        adjustment_type=adjustment_type,
        current_base_price=current_base_price,
        recommended_price=recommended_price,
        booking_volume=booking_volume,
        property_avg=property_avg,
        city_avg=city_avg,
        demand_score=demand_score,
        data_quality=data_quality,
    )

    return PricingRecommendation(
        property_id=property_obj.id or 0,
        current_base_price=round(current_base_price, 2),
        recommended_price=round(recommended_price, 2),
        demand_score=round(demand_score, 2),
        confidence_score=round(confidence_score, 2),
        adjustment_type=adjustment_type,
        reason=reason,
        property_average_price=round(property_avg, 2),
        city_average_price=round(city_avg, 2),
        booking_volume=booking_volume,
        city_booking_volume=city_booking_volume,
        price_change_percent=price_change_percent,
        risk_level=risk_level,
        data_quality=data_quality,
        explanation_summary=explanation_summary,
        pricing_factors=pricing_factors,
    )