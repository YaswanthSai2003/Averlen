from sqlmodel import select

from app.db.models import Booking, Property


def create_property_for_upload(session, organization_id: int) -> Property:
    property_obj = Property(
        organization_id=organization_id,
        name="Upload Idempotency Hotel",
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


def upload_preview(client, headers, property_id: int):
    csv_content = (
        "property_id,check_in,check_out,price,booked_on\n"
        f"{property_id},2025-03-01,2025-03-05,5000,2025-02-20\n"
    ).encode("utf-8")

    response = client.post(
        "/api/upload/bookings/preview",
        headers=headers,
        files={
            "file": (
                "bookings.csv",
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


def test_same_upload_id_cannot_be_processed_twice(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_property_for_upload(session, organization_id)

    upload_id = upload_preview(client, auth_headers, property_obj.id)

    first_process_response = process_upload(client, auth_headers, upload_id)

    assert first_process_response.status_code == 200

    second_process_response = process_upload(client, auth_headers, upload_id)

    assert second_process_response.status_code == 400
    assert (
        second_process_response.json()["detail"]
        == "Upload has already been queued or processed"
    )

    session.expire_all()

    bookings = session.exec(
        select(Booking).where(
            Booking.organization_id == organization_id,
            Booking.property_id == property_obj.id,
        )
    ).all()

    assert len(bookings) == 1


def test_reuploading_same_csv_does_not_duplicate_bookings(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_property_for_upload(session, organization_id)

    first_upload_id = upload_preview(client, auth_headers, property_obj.id)
    first_process_response = process_upload(client, auth_headers, first_upload_id)

    assert first_process_response.status_code == 200

    second_upload_id = upload_preview(client, auth_headers, property_obj.id)
    second_process_response = process_upload(client, auth_headers, second_upload_id)

    assert second_process_response.status_code == 200

    session.expire_all()

    bookings = session.exec(
        select(Booking).where(
            Booking.organization_id == organization_id,
            Booking.property_id == property_obj.id,
        )
    ).all()

    assert len(bookings) == 1