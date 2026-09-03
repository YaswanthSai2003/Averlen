import uuid
import csv
from io import BytesIO, StringIO

from app.core.config import settings
from app.db.models import Organization, Property



def _create_active_property(client, auth_headers, prefix: str):
    response = client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": f"{prefix} {uuid.uuid4().hex[:8]}",
            "city": "Bengaluru",
            "property_type": "Apartment",
            "base_price": 5000,
            "bedrooms": 1,
            "accommodates": 2,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()

def test_upload_preview(client, auth_headers, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    property_obj = _create_active_property(client, auth_headers, "Preview Property")

    csv_content = (
        "property_code,check_in,check_out,price,booked_on\n"
        f"{property_obj['property_code']},2025-03-01,2025-03-05,5000,2025-02-20\n"
    )

    response = client.post(
        "/api/upload/bookings/preview",
        headers=auth_headers,
        files={
            "file": (
                "sample_bookings.csv",
                BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200, response.text

    data = response.json()
    assert "upload_id" in data
    assert data["filename"] == "sample_bookings.csv"
    assert "property_code" in data["columns"]
    assert len(data["preview_rows"]) == 1


def test_download_sample_booking_csv(
    client,
    session,
    auth_headers,
):
    me_response = client.get(
        "/api/auth/me",
        headers=auth_headers,
    )
    assert me_response.status_code == 200

    organization_id = me_response.json()[
        "organization_id"
    ]

    property_obj = Property(
        organization_id=organization_id,
        name="Sample Download Hotel",
        city="Bengaluru",
        property_type="Hotel",
        base_price=5000,
        bedrooms=2,
        accommodates=4,
    )

    other_org = Organization(
        name="Other Sample Organization",
    )

    session.add_all(
        [
            property_obj,
            other_org,
        ]
    )
    session.commit()
    session.refresh(property_obj)
    session.refresh(other_org)

    other_property = Property(
        organization_id=other_org.id,
        name="Other Tenant Hotel",
        city="Goa",
        property_type="Hotel",
        base_price=9000,
        bedrooms=3,
        accommodates=6,
    )

    session.add(other_property)
    session.commit()
    session.refresh(other_property)

    response = client.get(
        "/api/upload/bookings/sample",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.headers[
        "content-type"
    ].startswith("text/csv")
    assert (
        "averlen_sample_bookings.csv"
        in response.headers[
            "content-disposition"
        ]
    )

    rows = list(
        csv.DictReader(
            StringIO(response.text)
        )
    )

    assert len(rows) == 2
    property_codes = {
        row["property_code"]
        for row in rows
    }
    assert property_codes == {
        property_obj.property_code
    }
    assert (
        other_property.property_code
        not in property_codes
    )


def test_download_sample_requires_property(
    client,
    auth_headers,
):
    response = client.get(
        "/api/upload/bookings/sample",
        headers=auth_headers,
    )

    assert response.status_code == 409
    assert (
        "create at least one property"
        in response.json()[
            "detail"
        ].lower()
    )
