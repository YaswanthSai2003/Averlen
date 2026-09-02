from datetime import date

from app.db.models import Booking, Property


def create_export_property(session, organization_id: int) -> Property:
    property_obj = Property(
        organization_id=organization_id,
        name="Export Analytics Hotel",
        city="Goa",
        property_type="Hotel",
        base_price=6500,
        bedrooms=2,
        accommodates=4,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    return property_obj


def test_analytics_csv_export(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_export_property(session, organization_id)

    booking = Booking(
        organization_id=organization_id,
        property_id=property_obj.id,
        check_in=date(2026, 2, 1),
        check_out=date(2026, 2, 4),
        price=7200,
        booked_on=date(2026, 1, 15),
    )

    session.add(booking)
    session.commit()

    response = client.get(
        "/api/analytics/export/csv",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "averlen_analytics_export" in response.headers["content-disposition"]

    content = response.text

    assert "property_id,property_name,city,property_type,check_in,check_out" in content
    assert "Export Analytics Hotel" in content
    assert "Goa" in content
    assert "7200" in content


def test_analytics_csv_export_respects_date_filter(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_export_property(session, organization_id)

    included_booking = Booking(
        organization_id=organization_id,
        property_id=property_obj.id,
        check_in=date(2026, 3, 5),
        check_out=date(2026, 3, 7),
        price=8000,
        booked_on=date(2026, 2, 20),
    )

    excluded_booking = Booking(
        organization_id=organization_id,
        property_id=property_obj.id,
        check_in=date(2026, 4, 5),
        check_out=date(2026, 4, 7),
        price=12000,
        booked_on=date(2026, 3, 20),
    )

    session.add(included_booking)
    session.add(excluded_booking)
    session.commit()

    response = client.get(
        "/api/analytics/export/csv?start_date=2026-03-01&end_date=2026-03-31",
        headers=auth_headers,
    )

    assert response.status_code == 200

    content = response.text

    assert "8000" in content
    assert "12000" not in content
    assert "2026-03-01" in response.headers["content-disposition"]
    assert "2026-03-31" in response.headers["content-disposition"]