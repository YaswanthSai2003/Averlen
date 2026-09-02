import uuid


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


def login_user(client, email: str, password: str) -> dict[str, str]:
    response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def register_with_invite(
    client,
    email: str,
    password: str,
    invite_token: str,
):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Invited User",
            "accepted_terms": True,
            "accepted_privacy_policy": True,
            "invite_token": invite_token,
        },
    )

    assert response.status_code == 201
    return response.json()


def create_invite(
    client,
    auth_headers,
    email: str,
    role: str,
):
    response = client.post(
        "/api/invites",
        headers=auth_headers,
        json={
            "email": email,
            "role": role,
        },
    )

    assert response.status_code == 200
    return response.json()


def test_create_validate_and_accept_invite(client, auth_headers):
    admin_response = client.get(
        "/api/auth/me",
        headers=auth_headers,
    )

    assert admin_response.status_code == 200

    admin_user = admin_response.json()

    invited_email = unique_email("analyst")
    invited_password = "Test@12345"

    invite_response = create_invite(
        client=client,
        auth_headers=auth_headers,
        email=invited_email,
        role="ANALYST",
    )

    invite_token = invite_response["invite_token"]

    validate_response = client.get(
        "/api/invites/validate",
        params={"invite_token": invite_token},
    )

    assert validate_response.status_code == 200

    invite_data = validate_response.json()

    assert invite_data["email"] == invited_email
    assert invite_data["role"] == "ANALYST"
    assert invite_data["status"] == "pending"

    invited_user = register_with_invite(
        client=client,
        email=invited_email,
        password=invited_password,
        invite_token=invite_token,
    )

    assert invited_user["organization_id"] == admin_user["organization_id"]
    assert invited_user["role"] == "ANALYST"

    list_response = client.get(
        "/api/invites",
        headers=auth_headers,
        params={"status_filter": "accepted"},
    )

    assert list_response.status_code == 200

    accepted_invites = list_response.json()

    assert any(invite["email"] == invited_email for invite in accepted_invites)


def test_cancel_invite(client, auth_headers):
    invited_email = unique_email("cancel")

    invite_response = create_invite(
        client=client,
        auth_headers=auth_headers,
        email=invited_email,
        role="VIEWER",
    )

    invite_id = invite_response["invite"]["id"]
    invite_token = invite_response["invite_token"]

    cancel_response = client.patch(
        f"/api/invites/{invite_id}/cancel",
        headers=auth_headers,
    )

    assert cancel_response.status_code == 200

    cancelled_invite = cancel_response.json()

    assert cancelled_invite["status"] == "cancelled"

    validate_response = client.get(
        "/api/invites/validate",
        params={"invite_token": invite_token},
    )

    assert validate_response.status_code == 400


def test_viewer_cannot_create_property(client, auth_headers):
    invited_email = unique_email("viewer")
    invited_password = "Test@12345"

    invite_response = create_invite(
        client=client,
        auth_headers=auth_headers,
        email=invited_email,
        role="VIEWER",
    )

    register_with_invite(
        client=client,
        email=invited_email,
        password=invited_password,
        invite_token=invite_response["invite_token"],
    )

    viewer_headers = login_user(
        client=client,
        email=invited_email,
        password=invited_password,
    )

    list_response = client.get(
        "/api/properties",
        headers=viewer_headers,
    )

    assert list_response.status_code == 200

    create_response = client.post(
        "/api/properties",
        headers=viewer_headers,
        json={
            "name": f"Viewer Property {uuid.uuid4().hex[:8]}",
            "city": "Goa",
            "property_type": "Apartment",
            "base_price": 5000,
            "bedrooms": 2,
            "accommodates": 4,
        },
    )

    assert create_response.status_code == 403


def test_revenue_manager_can_create_property(client, auth_headers):
    invited_email = unique_email("manager")
    invited_password = "Test@12345"

    invite_response = create_invite(
        client=client,
        auth_headers=auth_headers,
        email=invited_email,
        role="REVENUE_MANAGER",
    )

    register_with_invite(
        client=client,
        email=invited_email,
        password=invited_password,
        invite_token=invite_response["invite_token"],
    )

    manager_headers = login_user(
        client=client,
        email=invited_email,
        password=invited_password,
    )

    create_response = client.post(
        "/api/properties",
        headers=manager_headers,
        json={
            "name": f"Manager Property {uuid.uuid4().hex[:8]}",
            "city": "Goa",
            "property_type": "Apartment",
            "base_price": 5000,
            "bedrooms": 2,
            "accommodates": 4,
        },
    )

    assert create_response.status_code == 200

    property_obj = create_response.json()

    assert property_obj["name"].startswith("Manager Property")


def test_invalid_invite_role_rejected(client, auth_headers):
    response = client.post(
        "/api/invites",
        headers=auth_headers,
        json={
            "email": unique_email("invalidrole"),
            "role": "SUPER_ADMIN",
        },
    )

    assert response.status_code == 400