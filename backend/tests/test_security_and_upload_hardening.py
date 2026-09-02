from io import BytesIO


def test_healthz_and_readyz(client):
    health_response = client.get("/healthz")
    assert health_response.status_code == 200
    assert health_response.json()["status"] == "ok"

    ready_response = client.get("/readyz")
    assert ready_response.status_code in {200, 503}


def test_security_headers_present(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_reject_non_csv_upload(client, auth_headers):
    response = client.post(
        "/api/upload/bookings/preview",
        headers=auth_headers,
        files={
            "file": (
                "bad.txt",
                BytesIO(b"hello"),
                "text/plain",
            )
        },
    )

    assert response.status_code == 400


def test_reject_csv_formula_injection(client, auth_headers):
    content = b"property_id,check_in,check_out,price,booked_on\n=cmd,2025-03-01,2025-03-05,5000,2025-02-20\n"

    response = client.post(
        "/api/upload/bookings/preview",
        headers=auth_headers,
        files={
            "file": (
                "bad.csv",
                BytesIO(content),
                "text/csv",
            )
        },
    )

    assert response.status_code == 400
    assert "unsafe formula" in response.json()["detail"].lower()
