from datetime import date

from app.db.models import Booking, Property


def create_insight_data(session, organization_id: int) -> None:
    property_obj = Property(
        organization_id=organization_id,
        name="Insight History Hotel",
        city="Goa",
        property_type="Hotel",
        base_price=5000,
        bedrooms=2,
        accommodates=4,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    booking = Booking(
        organization_id=organization_id,
        property_id=property_obj.id,
        check_in=date(2025, 3, 1),
        check_out=date(2025, 3, 5),
        price=5000,
        booked_on=date(2025, 2, 20),
    )

    session.add(booking)
    session.commit()


def test_insight_query_creates_history(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    create_insight_data(session, organization_id)

    query_response = client.post(
        "/api/insights/query",
        headers=auth_headers,
        json={"question": "Which city has highest bookings?"},
    )

    assert query_response.status_code == 200

    history_response = client.get(
        "/api/insights/history",
        headers=auth_headers,
    )

    assert history_response.status_code == 200

    data = history_response.json()

    assert data["total"] >= 1
    assert len(data["items"]) >= 1

    item = data["items"][0]

    assert item["question"] == "Which city has highest bookings?"
    assert "answer" in item
    assert isinstance(item["supporting_facts"], list)
    assert item["is_pinned"] is False


def test_toggle_insight_pin_and_pinned_filter(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    create_insight_data(session, organization_id)

    query_response = client.post(
        "/api/insights/query",
        headers=auth_headers,
        json={"question": "Show revenue insight for Goa"},
    )

    assert query_response.status_code == 200

    history_response = client.get(
        "/api/insights/history",
        headers=auth_headers,
    )

    assert history_response.status_code == 200

    insight_id = history_response.json()["items"][0]["id"]

    pin_response = client.patch(
        f"/api/insights/history/{insight_id}/pin",
        headers=auth_headers,
    )

    assert pin_response.status_code == 200
    assert pin_response.json()["is_pinned"] is True

    pinned_response = client.get(
        "/api/insights/history?pinned_only=true",
        headers=auth_headers,
    )

    assert pinned_response.status_code == 200

    pinned_items = pinned_response.json()["items"]

    assert any(item["id"] == insight_id for item in pinned_items)


def test_delete_insight_history(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    create_insight_data(session, organization_id)

    query_response = client.post(
        "/api/insights/query",
        headers=auth_headers,
        json={"question": "What should I check in analytics?"},
    )

    assert query_response.status_code == 200

    history_response = client.get(
        "/api/insights/history",
        headers=auth_headers,
    )

    assert history_response.status_code == 200

    insight_id = history_response.json()["items"][0]["id"]

    delete_response = client.delete(
        f"/api/insights/history/{insight_id}",
        headers=auth_headers,
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Insight deleted"