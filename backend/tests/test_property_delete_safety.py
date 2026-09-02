from datetime import date
from uuid import uuid4

from app.db.models import Booking, Property


def test_delete_property_with_bookings_is_blocked(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = Property(
        organization_id=organization_id,
        name=f"Delete Safety Property {uuid4().hex[:8]}",
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
        organization_id=organization_id,
        property_id=property_obj.id,
        check_in=date(2026, 4, 1),
        check_out=date(2026, 4, 3),
        price=10000,
        booked_on=date(2026, 3, 20),
    )

    session.add(booking)
    session.commit()

    response = client.delete(
        f"/api/properties/{property_obj.id}",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        "booking history"
        in response.json()["detail"]
    )


def test_delete_property_without_bookings_succeeds(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = Property(
        organization_id=organization_id,
        name=f"Delete Allowed Property {uuid4().hex[:8]}",
        city="Goa",
        property_type="Villa",
        base_price=9000,
        bedrooms=4,
        accommodates=8,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    response = client.delete(
        f"/api/properties/{property_obj.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Property deleted"