from datetime import date

from app.db.models import Booking, Property


def create_pricing_property(session, organization_id: int) -> Property:
    property_obj = Property(
        organization_id=organization_id,
        name="Pricing History Villa",
        city="Goa",
        property_type="Villa",
        base_price=9000,
        bedrooms=4,
        accommodates=8,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    return property_obj


def test_pricing_preview_does_not_create_history(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_pricing_property(session, organization_id)

    response = client.get(
        f"/api/recommendations/pricing/{property_obj.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    history_response = client.get(
        f"/api/recommendations/pricing/{property_obj.id}/history",
        headers=auth_headers,
    )

    assert history_response.status_code == 200
    assert history_response.json()["total"] == 0


def test_pricing_generate_creates_history(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_pricing_property(session, organization_id)

    booking = Booking(
        organization_id=organization_id,
        property_id=property_obj.id,
        check_in=date(2025, 3, 1),
        check_out=date(2025, 3, 4),
        price=11000,
        booked_on=date(2025, 2, 20),
    )

    session.add(booking)
    session.commit()

    generate_response = client.post(
        f"/api/recommendations/pricing/{property_obj.id}/generate",
        headers=auth_headers,
    )

    assert generate_response.status_code == 200

    generated = generate_response.json()

    assert generated["property_id"] == property_obj.id
    assert generated["recommended_price"] > 0
    assert generated["status"] == "generated"
    assert "pricing_factors" in generated
    assert isinstance(generated["pricing_factors"], list)

    history_response = client.get(
        f"/api/recommendations/pricing/{property_obj.id}/history",
        headers=auth_headers,
    )

    assert history_response.status_code == 200

    data = history_response.json()

    assert data["total"] >= 1
    assert len(data["items"]) >= 1


def test_update_pricing_recommendation_status(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_pricing_property(session, organization_id)

    generate_response = client.post(
        f"/api/recommendations/pricing/{property_obj.id}/generate",
        headers=auth_headers,
    )

    assert generate_response.status_code == 200

    history_id = generate_response.json()["id"]

    update_response = client.patch(
        f"/api/recommendations/pricing/history/{history_id}/status",
        headers=auth_headers,
        json={"status": "accepted"},
    )

    assert update_response.status_code == 200

    data = update_response.json()

    assert data["id"] == history_id
    assert data["status"] == "accepted"


def test_invalid_pricing_history_status_rejected(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_pricing_property(session, organization_id)

    generate_response = client.post(
        f"/api/recommendations/pricing/{property_obj.id}/generate",
        headers=auth_headers,
    )

    assert generate_response.status_code == 200

    history_id = generate_response.json()["id"]

    update_response = client.patch(
        f"/api/recommendations/pricing/history/{history_id}/status",
        headers=auth_headers,
        json={"status": "wrong_status"},
    )

    assert update_response.status_code == 422