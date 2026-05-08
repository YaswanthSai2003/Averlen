def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "Test@12345",
            "full_name": "Test User",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["is_active"] is True
    assert "id" in data


def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "Test@12345",
            "full_name": "Login User",
        },
    )

    response = client.post(
        "/api/auth/login",
        data={
            "username": "login@example.com",
            "password": "Test@12345",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_current_user(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["email"]
