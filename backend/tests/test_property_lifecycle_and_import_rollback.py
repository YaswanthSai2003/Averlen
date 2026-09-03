from datetime import date

from sqlmodel import select

from app.db.models import Booking, Property


def create_property(client, headers, name: str):
    response = client.post(
        "/api/properties",
        headers=headers,
        json={
            "name": name,
            "city": "Bengaluru",
            "property_type": "Hotel",
            "base_price": 5000,
            "bedrooms": 2,
            "accommodates": 4,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_property_codes_are_workspace_scoped_and_stable(
    client,
    auth_headers,
):
    first = create_property(
        client,
        auth_headers,
        "Lifecycle Hotel One",
    )
    second = create_property(
        client,
        auth_headers,
        "Lifecycle Hotel Two",
    )

    assert first["property_code"] == "P-001"
    assert second["property_code"] == "P-002"

    update_response = client.put(
        f"/api/properties/{first['id']}",
        headers=auth_headers,
        json={"name": "Lifecycle Hotel Renamed"},
    )
    assert update_response.status_code == 200
    assert (
        update_response.json()["property_code"]
        == "P-001"
    )


def test_archive_restore_and_active_property_filtering(
    client,
    auth_headers,
):
    property_data = create_property(
        client,
        auth_headers,
        "Archive Hotel",
    )
    property_id = property_data["id"]

    archive_response = client.patch(
        f"/api/properties/{property_id}/archive",
        headers=auth_headers,
    )
    assert archive_response.status_code == 200
    assert archive_response.json()["is_archived"] is True
    assert archive_response.json()["archived_at"] is not None

    active_response = client.get(
        "/api/properties/summary/page",
        headers=auth_headers,
    )
    assert active_response.status_code == 200
    assert active_response.json()["total"] == 0

    archived_response = client.get(
        "/api/properties/summary/page?archived=true",
        headers=auth_headers,
    )
    assert archived_response.status_code == 200
    assert archived_response.json()["total"] == 1
    assert (
        archived_response.json()["items"][0]["property_code"]
        == "P-001"
    )

    restore_response = client.patch(
        f"/api/properties/{property_id}/restore",
        headers=auth_headers,
    )
    assert restore_response.status_code == 200
    assert restore_response.json()["is_archived"] is False
    assert restore_response.json()["archived_at"] is None


def test_permanent_property_delete_removes_booking_history(
    client,
    session,
    auth_headers,
):
    property_data = create_property(
        client,
        auth_headers,
        "Permanent Delete Hotel",
    )

    booking = Booking(
        organization_id=property_data["organization_id"],
        property_id=property_data["id"],
        check_in=date(2026, 9, 10),
        check_out=date(2026, 9, 12),
        price=10000,
        booked_on=date(2026, 9, 3),
    )
    session.add(booking)
    session.commit()

    response = client.delete(
        f"/api/properties/{property_data['id']}/permanent?confirm=DELETE",
        headers=auth_headers,
    )

    assert response.status_code == 200, response.text
    assert response.json()["deleted_bookings"] == 1
    assert (
        session.get(Property, property_data["id"])
        is None
    )
    assert (
        session.exec(
            select(Booking).where(
                Booking.property_id == property_data["id"]
            )
        ).first()
        is None
    )


def test_import_data_can_be_removed_without_deleting_property(
    client,
    session,
    auth_headers,
):
    property_data = create_property(
        client,
        auth_headers,
        "Rollback Hotel",
    )

    csv_content = (
        "property_code,check_in,check_out,price,booked_on\n"
        f"{property_data['property_code']},2026-09-10,2026-09-12,10000,2026-09-03\n"
    ).encode("utf-8")

    preview_response = client.post(
        "/api/upload/bookings/preview",
        headers=auth_headers,
        files={
            "file": (
                "rollback.csv",
                csv_content,
                "text/csv",
            )
        },
    )
    assert preview_response.status_code == 200, preview_response.text

    process_response = client.post(
        "/api/upload/bookings/process",
        headers=auth_headers,
        json={
            "upload_id": preview_response.json()["upload_id"],
            "property_id": "property_code",
            "check_in": "check_in",
            "check_out": "check_out",
            "price": "price",
            "booked_on": "booked_on",
        },
    )
    assert process_response.status_code == 200, process_response.text
    job_id = process_response.json()["job_id"]

    status_response = client.get(
        f"/api/upload/jobs/{job_id}",
        headers=auth_headers,
    )
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["import_number"] == 1
    assert status_data["linked_booking_count"] == 1
    assert status_data["rollback_available"] is True

    remove_response = client.delete(
        f"/api/upload/jobs/{job_id}/data",
        headers=auth_headers,
    )
    assert remove_response.status_code == 200, remove_response.text
    assert remove_response.json()["deleted_bookings"] == 1

    session.expire_all()
    assert session.get(Property, property_data["id"]) is not None
    assert (
        session.exec(
            select(Booking).where(
                Booking.ingestion_job_id == job_id
            )
        ).first()
        is None
    )

    after_response = client.get(
        f"/api/upload/jobs/{job_id}",
        headers=auth_headers,
    )
    assert after_response.status_code == 200
    assert after_response.json()["data_removed_at"] is not None
    assert after_response.json()["rollback_available"] is False


def test_archived_property_cannot_receive_imports(
    client,
    auth_headers,
):
    property_data = create_property(
        client,
        auth_headers,
        "Archived Import Hotel",
    )

    archive_response = client.patch(
        f"/api/properties/{property_data['id']}/archive",
        headers=auth_headers,
    )
    assert archive_response.status_code == 200

    csv_content = (
        "property_code,check_in,check_out,price,booked_on\n"
        f"{property_data['property_code']},2026-09-10,2026-09-12,10000,2026-09-03\n"
    ).encode("utf-8")

    response = client.post(
        "/api/upload/bookings/preview",
        headers=auth_headers,
        files={
            "file": (
                "archived.csv",
                csv_content,
                "text/csv",
            )
        },
    )

    assert response.status_code == 409
    assert "active property" in response.json()["detail"].lower()
