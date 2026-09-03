import uuid


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


def create_test_property(client, auth_headers):
    property_name = f"Test Property {uuid.uuid4().hex[:8]}"

    response = client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": property_name,
            "city": "Goa",
            "property_type": "Apartment",
            "base_price": 5000,
            "bedrooms": 2,
            "accommodates": 4,
        },
    )

    assert response.status_code == 200
    return response.json()


def test_meta_endpoint(client):
    response = client.get("/api/meta")

    assert response.status_code == 200

    data = response.json()

    assert data["app_name"] == "Averlen"
    assert data["app_version"]
    assert data["terms_version"]
    assert data["privacy_version"]
    assert data["docs_url"] == "/docs"
    assert data["health_url"] == "/api/health"


def test_workspace_get_and_update(client, auth_headers):
    get_response = client.get(
        "/api/workspace",
        headers=auth_headers,
    )

    assert get_response.status_code == 200

    workspace = get_response.json()
    assert workspace["id"]
    assert workspace["name"]

    new_name = f"Workspace {uuid.uuid4().hex[:8]}"

    update_response = client.patch(
        "/api/workspace",
        headers=auth_headers,
        json={"name": new_name},
    )

    assert update_response.status_code == 200

    updated_workspace = update_response.json()
    assert updated_workspace["name"] == new_name


def test_property_page_and_summary_page(client, auth_headers):
    create_test_property(client, auth_headers)
    create_test_property(client, auth_headers)

    page_response = client.get(
        "/api/properties/page",
        headers=auth_headers,
        params={"limit": 10, "offset": 0},
    )

    assert page_response.status_code == 200

    page_data = page_response.json()

    assert "items" in page_data
    assert "total" in page_data
    assert page_data["limit"] == 10
    assert page_data["offset"] == 0
    assert page_data["total"] >= 2

    summary_response = client.get(
        "/api/properties/summary/page",
        headers=auth_headers,
        params={"limit": 10, "offset": 0},
    )

    assert summary_response.status_code == 200

    summary_data = summary_response.json()

    assert "items" in summary_data
    assert "total" in summary_data
    assert summary_data["limit"] == 10
    assert summary_data["offset"] == 0
    assert summary_data["total"] >= 2


def test_property_analytics_endpoint(client, auth_headers):
    property_obj = create_test_property(client, auth_headers)

    response = client.get(
        f"/api/analytics/properties/{property_obj['id']}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["property"]["id"] == property_obj["id"]
    assert data["property"]["name"] == property_obj["name"]
    assert "metrics" in data
    assert "trends" in data
    assert "pricing_recommendation" in data


def test_dashboard_summary_compare_params(client, auth_headers):
    response = client.get(
        "/api/analytics/dashboard-summary",
        headers=auth_headers,
        params={
            "start_date": "2025-03-01",
            "end_date": "2025-03-31",
            "compare": True,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "total_revenue" in data
    assert "total_revenue_change_pct" in data
    assert "total_bookings" in data
    assert "total_bookings_change_pct" in data
    assert "average_booking_value_change_pct" in data


def test_upload_template_download(client):
    response = client.get("/api/upload/bookings/template")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.text == (
        "property_code,check_in,check_out,price,booked_on\n"
    )


def test_customer_audit_logs_are_not_exposed(client, auth_headers):
    legacy_response = client.get(
        "/api/audit-logs/page",
        headers=auth_headers,
        params={"limit": 10, "offset": 0},
    )

    assert legacy_response.status_code == 404

    internal_response = client.get(
        "/api/internal/audit-logs/page",
        headers=auth_headers,
        params={"limit": 10, "offset": 0},
    )

    assert internal_response.status_code == 403