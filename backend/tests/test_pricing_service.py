from datetime import date

from app.db.models import Booking, Property
from app.services.pricing_service import calculate_pricing_recommendation


def test_pricing_recommendation_returns_valid_result():
    property_obj = Property(
        id=1,
        organization_id=1,
        name="Sea View Apartment",
        city="Goa",
        property_type="Apartment",
        base_price=5000,
        bedrooms=2,
        accommodates=4,
    )

    bookings = [
        Booking(
            property_id=1,
            check_in=date(2025, 3, 1),
            check_out=date(2025, 3, 3),
            price=7000,
            booked_on=date(2025, 2, 20),
        )
    ]

    result = calculate_pricing_recommendation(property_obj, bookings, bookings)

    assert result.property_id == 1
    assert result.recommended_price > 0
    assert result.confidence_score >= 0
    assert result.demand_score >= 0


def test_pricing_endpoint(client, session, auth_headers):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = Property(
        organization_id=organization_id,
        name="Beach Villa",
        city="Goa",
        property_type="Villa",
        base_price=9000,
        bedrooms=4,
        accommodates=8,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    booking = Booking(
        property_id=property_obj.id,
        check_in=date(2025, 3, 1),
        check_out=date(2025, 3, 4),
        price=11000,
        booked_on=date(2025, 2, 20),
    )

    session.add(booking)
    session.commit()

    response = client.get(
        f"/api/recommendations/pricing/{property_obj.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()
    assert data["property_id"] == property_obj.id
    assert data["recommended_price"] > 0
    assert "reason" in data
