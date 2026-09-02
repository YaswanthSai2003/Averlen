import uuid
from datetime import date

from app.db.models import Booking, Property
from app.services.insights_service import build_insight_context


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@gmail.com"


def register_and_login(client, prefix: str):
    email = unique_email(prefix)
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": f"{prefix} User",
            "accepted_terms": True,
            "accepted_privacy_policy": True,
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200

    organization_id = me_response.json()["organization_id"]

    return headers, organization_id


def test_analytics_excludes_booking_with_wrong_organization_id(
    client,
    session,
):
    org_a_headers, org_a_id = register_and_login(client, "tenant_a")
    _, org_b_id = register_and_login(client, "tenant_b")

    property_a = Property(
        organization_id=org_a_id,
        name="Org A Property",
        city="Goa",
        property_type="Hotel",
        base_price=5000,
        bedrooms=2,
        accommodates=4,
    )

    session.add(property_a)
    session.commit()
    session.refresh(property_a)

    valid_booking = Booking(
        organization_id=org_a_id,
        property_id=property_a.id,
        check_in=date(2025, 3, 1),
        check_out=date(2025, 3, 3),
        price=1000,
        booked_on=date(2025, 2, 20),
    )

    # This is intentionally corrupted/malicious data:
    # property_id belongs to Org A, but organization_id belongs to Org B.
    # Production queries must not count this for Org A.
    wrong_org_booking = Booking(
        organization_id=org_b_id,
        property_id=property_a.id,
        check_in=date(2025, 3, 4),
        check_out=date(2025, 3, 6),
        price=999999,
        booked_on=date(2025, 2, 21),
    )

    session.add_all([valid_booking, wrong_org_booking])
    session.commit()

    response = client.get(
        "/api/analytics/revenue",
        headers=org_a_headers,
    )

    assert response.status_code == 200

    data = response.json()
    assert data["total_revenue"] == 1000
    assert data["total_bookings"] == 1


def test_property_analytics_excludes_booking_with_wrong_organization_id(
    client,
    session,
):
    org_a_headers, org_a_id = register_and_login(client, "tenant_a_prop")
    _, org_b_id = register_and_login(client, "tenant_b_prop")

    property_a = Property(
        organization_id=org_a_id,
        name="Org A Analytics Property",
        city="Bangalore",
        property_type="Hotel",
        base_price=6000,
        bedrooms=3,
        accommodates=5,
    )

    session.add(property_a)
    session.commit()
    session.refresh(property_a)

    session.add_all(
        [
            Booking(
                organization_id=org_a_id,
                property_id=property_a.id,
                check_in=date(2025, 4, 1),
                check_out=date(2025, 4, 3),
                price=2000,
                booked_on=date(2025, 3, 20),
            ),
            Booking(
                organization_id=org_b_id,
                property_id=property_a.id,
                check_in=date(2025, 4, 4),
                check_out=date(2025, 4, 6),
                price=888888,
                booked_on=date(2025, 3, 21),
            ),
        ]
    )
    session.commit()

    response = client.get(
        f"/api/analytics/properties/{property_a.id}",
        headers=org_a_headers,
    )

    assert response.status_code == 200

    data = response.json()
    assert data["metrics"]["total_revenue"] == 2000
    assert data["metrics"]["total_bookings"] == 1


def test_insight_context_excludes_booking_with_wrong_organization_id(
    client,
    session,
):
    _, org_a_id = register_and_login(client, "tenant_a_insight")
    _, org_b_id = register_and_login(client, "tenant_b_insight")

    property_a = Property(
        organization_id=org_a_id,
        name="Org A Insight Property",
        city="Hyderabad",
        property_type="Resort",
        base_price=7000,
        bedrooms=4,
        accommodates=8,
    )

    session.add(property_a)
    session.commit()
    session.refresh(property_a)

    session.add_all(
        [
            Booking(
                organization_id=org_a_id,
                property_id=property_a.id,
                check_in=date(2025, 5, 1),
                check_out=date(2025, 5, 3),
                price=3000,
                booked_on=date(2025, 4, 20),
            ),
            Booking(
                organization_id=org_b_id,
                property_id=property_a.id,
                check_in=date(2025, 5, 4),
                check_out=date(2025, 5, 6),
                price=777777,
                booked_on=date(2025, 4, 21),
            ),
        ]
    )
    session.commit()

    context = build_insight_context(session=session, organization_id=org_a_id)

    assert "Total bookings: 1" in context
    assert "777777" not in context