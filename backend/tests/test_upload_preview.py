from io import BytesIO

from app.core.config import settings


def test_upload_preview(client, auth_headers, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))

    csv_content = (
        "property_id,check_in,check_out,price,booked_on\n"
        "1,2025-03-01,2025-03-05,5000,2025-02-20\n"
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
    assert "property_id" in data["columns"]
    assert len(data["preview_rows"]) == 1


def test_download_sample_booking_csv(client):
    response = client.get("/api/upload/bookings/sample")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "averlen_sample_bookings.csv" in response.headers["content-disposition"]

    content = response.text

    assert "property_id,check_in,check_out,price,booked_on" in content
    assert "2026-01-05" in content
