from datetime import date

from app.db.models import Booking, Property


def test_revenue_summary(client, session, auth_headers):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = Property(
        organization_id=organization_id,
        name="Sea View Apartment",
        city="Goa",
        property_type="Apartment",
        base_price=5000,
        bedrooms=2,
        accommodates=4,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    bookings = [
        Booking(
            organization_id=organization_id,
            property_id=property_obj.id,
            check_in=date(2025, 3, 1),
            check_out=date(2025, 3, 5),
            price=5000,
            booked_on=date(2025, 2, 20),
        ),
        Booking(
            organization_id=organization_id,
            property_id=property_obj.id,
            check_in=date(2025, 3, 10),
            check_out=date(2025, 3, 12),
            price=4500,
            booked_on=date(2025, 2, 25),
        ),
    ]

    session.add_all(bookings)
    session.commit()

    response = client.get("/api/analytics/revenue", headers=auth_headers)

    assert response.status_code == 200

    data = response.json()
    assert data["total_revenue"] == 9500
    assert data["total_bookings"] == 2
    assert data["average_booking_value"] == 4750