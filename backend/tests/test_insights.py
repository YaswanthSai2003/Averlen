from datetime import date

from app.db.models import Booking, Property


def test_insights_query_with_fallback(client, session, auth_headers):
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

    response = client.post(
        "/api/insights/query",
        headers=auth_headers,
        json={"question": "Which city has highest bookings?"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["question"] == "Which city has highest bookings?"
    assert data["source"] in ["fallback", "llm"]
    assert data["confidence"] in ["low", "medium", "high"]
    assert "answer" in data
    assert "supporting_facts" in data
    assert isinstance(data["supporting_facts"], list)
    assert "context_summary" in data