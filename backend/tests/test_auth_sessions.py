import uuid


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


def register_user(client, email: str, password: str):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Session User",
            "accepted_terms": True,
            "accepted_privacy_policy": True,
        },
    )

    assert response.status_code == 201
    return response.json()


def login_user(client, email: str, password: str):
    response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200
    return response


def test_login_sets_refresh_cookie_and_returns_short_lived_access_token(client):
    email = unique_email("session")
    password = "Test@12345"

    register_user(client, email, password)

    response = login_user(client, email, password)
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 900
    assert "averlen_refresh_token" in response.cookies


def test_refresh_rotates_refresh_token(client):
    email = unique_email("refresh")
    password = "Test@12345"

    register_user(client, email, password)
    login_response = login_user(client, email, password)

    old_cookie = login_response.cookies.get("averlen_refresh_token")
    assert old_cookie

    refresh_response = client.post("/api/auth/refresh")

    assert refresh_response.status_code == 200

    data = refresh_response.json()

    assert "access_token" in data
    assert data["expires_in"] == 900

    new_cookie = refresh_response.cookies.get("averlen_refresh_token")
    assert new_cookie
    assert new_cookie != old_cookie


def test_logout_revokes_refresh_cookie(client):
    email = unique_email("logout")
    password = "Test@12345"

    register_user(client, email, password)
    login_user(client, email, password)

    logout_response = client.post("/api/auth/logout")

    assert logout_response.status_code == 200

    refresh_response = client.post("/api/auth/refresh")

    assert refresh_response.status_code == 401


def test_sessions_list_and_revoke(client):
    email = unique_email("sessions")
    password = "Test@12345"

    register_user(client, email, password)
    login_response = login_user(client, email, password)

    access_token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}

    sessions_response = client.get(
        "/api/auth/sessions",
        headers=headers,
    )

    assert sessions_response.status_code == 200

    sessions = sessions_response.json()["sessions"]
    assert len(sessions) >= 1

    session_id = sessions[0]["id"]

    revoke_response = client.delete(
        f"/api/auth/sessions/{session_id}",
        headers=headers,
    )

    assert revoke_response.status_code == 200
