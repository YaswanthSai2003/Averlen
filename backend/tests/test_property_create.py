from uuid import uuid4


def test_create_property_success(client, auth_headers):
    property_name = f"Test Property {uuid4().hex[:8]}"

    response = client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": property_name,
            "city": "Bengaluru",
            "property_type": "Hotel",
            "base_price": 6200,
            "bedrooms": 2,
            "accommodates": 4,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == property_name
    assert data["city"] == "Bengaluru"
    assert data["property_type"] == "Hotel"
    assert data["base_price"] == 6200
    assert data["bedrooms"] == 2
    assert data["accommodates"] == 4
    assert data["organization_id"] is not None


def test_create_property_duplicate_name_rejected(client, auth_headers):
    property_name = f"Duplicate Property {uuid4().hex[:8]}"

    payload = {
        "name": property_name,
        "city": "Goa",
        "property_type": "Villa",
        "base_price": 9000,
        "bedrooms": 4,
        "accommodates": 8,
    }

    first_response = client.post(
        "/api/properties",
        headers=auth_headers,
        json=payload,
    )

    assert first_response.status_code == 200

    second_response = client.post(
        "/api/properties",
        headers=auth_headers,
        json=payload,
    )

    assert second_response.status_code == 400
    assert (
        second_response.json()["detail"]
        == "Property with this name already exists in your organization"
    )


def test_create_property_validation_rejects_invalid_values(client, auth_headers):
    response = client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": "",
            "city": "Goa",
            "property_type": "Villa",
            "base_price": -1,
            "bedrooms": 50,
            "accommodates": 0,
        },
    )

    assert response.status_code == 422