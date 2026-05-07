def test_create_property(client, auth_headers):
    response = client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": "Sea View Apartment",
            "city": "Goa",
            "property_type": "Apartment",
            "base_price": 5000,
            "bedrooms": 2,
            "accommodates": 4,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "Sea View Apartment"
    assert data["city"] == "Goa"
    assert data["base_price"] == 5000


def test_list_properties(client, auth_headers):
    client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": "Beach Villa",
            "city": "Goa",
            "property_type": "Villa",
            "base_price": 9000,
            "bedrooms": 4,
            "accommodates": 8,
        },
    )

    response = client.get("/api/properties", headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
