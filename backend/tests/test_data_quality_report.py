from sqlmodel import select

from app.db.models import Booking, Property


def create_property(session, organization_id: int) -> Property:
    property_obj = Property(
        organization_id=organization_id,
        name="Data Quality Hotel",
        city="Goa",
        property_type="Hotel",
        base_price=5000,
        bedrooms=2,
        accommodates=4,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    return property_obj


def upload_preview_with_mixed_quality_rows(client, headers, property_id: int):
    csv_content = (
        "property_id,check_in,check_out,price,booked_on\n"
        f"{property_id},2025-03-01,2025-03-05,5000,2025-02-20\n"
        "999999,2025-03-06,2025-03-08,4500,2025-02-21\n"
        f"{property_id},2025-03-10,2025-03-09,4500,2025-02-22\n"
        f"{property_id},2025-03-01,2025-03-05,5000,2025-02-20\n"
        f"{property_id},2025-03-12,2025-03-15,0,2025-02-23\n"
    ).encode("utf-8")

    response = client.post(
        "/api/upload/bookings/preview",
        headers=headers,
        files={
            "file": (
                "mixed_quality_bookings.csv",
                csv_content,
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    return response.json()["upload_id"]


def process_upload(client, headers, upload_id: str):
    return client.post(
        "/api/upload/bookings/process",
        headers=headers,
        json={
            "upload_id": upload_id,
            "property_id": "property_id",
            "check_in": "check_in",
            "check_out": "check_out",
            "price": "price",
            "booked_on": "booked_on",
        },
    )


def test_upload_data_quality_report(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_property(session, organization_id)

    upload_id = upload_preview_with_mixed_quality_rows(
        client=client,
        headers=auth_headers,
        property_id=property_obj.id,
    )

    process_response = process_upload(
        client=client,
        headers=auth_headers,
        upload_id=upload_id,
    )

    assert process_response.status_code == 200

    job_id = process_response.json()["job_id"]

    quality_response = client.get(
        f"/api/upload/jobs/{job_id}/quality",
        headers=auth_headers,
    )

    assert quality_response.status_code == 200

    data = quality_response.json()

    assert data["job_id"] == job_id
    assert data["total_rows"] == 5
    assert data["valid_rows"] == 1
    assert data["failed_rows"] == 3
    assert data["duplicate_rows"] == 1
    assert data["invalid_property_rows"] == 1
    assert data["invalid_date_rows"] == 1
    assert data["invalid_price_rows"] == 1
    assert data["other_error_rows"] == 0
    assert data["data_quality_score"] == 20.0
    assert data["data_quality_level"] == "poor"
    assert isinstance(data["warnings"], list)
    assert len(data["warnings"]) > 0

    session.expire_all()

    bookings = session.exec(
        select(Booking).where(
            Booking.organization_id == organization_id,
            Booking.property_id == property_obj.id,
        )
    ).all()

    assert len(bookings) == 1