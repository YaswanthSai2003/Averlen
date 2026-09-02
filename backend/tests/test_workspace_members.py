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


def create_invite(client, auth_headers, email: str, role: str):
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
            "full_name": "Team Member",
            "accepted_terms": True,
            "accepted_privacy_policy": True,
            "invite_token": invite_token,
        },
    )

    assert response.status_code == 201

    return response.json()


def create_workspace_member(
    client,
    auth_headers,
    prefix: str,
    role: str,
):
    email = unique_email(prefix)
    password = "Test@12345"

    invite_response = create_invite(
        client=client,
        auth_headers=auth_headers,
        email=email,
        role=role,
    )

    user = register_with_invite(
        client=client,
        email=email,
        password=password,
        invite_token=invite_response["invite_token"],
    )

    return user, email, password


def test_org_admin_can_list_workspace_members(client, auth_headers):
    invited_user, _, _ = create_workspace_member(
        client=client,
        auth_headers=auth_headers,
        prefix="team_list",
        role="ANALYST",
    )

    response = client.get(
        "/api/workspace/members",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()
    members = data["members"]

    assert len(members) >= 2
    assert any(member["id"] == invited_user["id"] for member in members)
    assert any(member["role"] == "ORG_ADMIN" for member in members)


def test_org_admin_can_change_member_role(client, auth_headers):
    invited_user, invited_email, invited_password = create_workspace_member(
        client=client,
        auth_headers=auth_headers,
        prefix="team_role",
        role="VIEWER",
    )

    response = client.patch(
        f"/api/workspace/members/{invited_user['id']}/role",
        headers=auth_headers,
        json={"role": "REVENUE_MANAGER"},
    )

    assert response.status_code == 200

    updated_member = response.json()

    assert updated_member["id"] == invited_user["id"]
    assert updated_member["role"] == "REVENUE_MANAGER"

    manager_headers = login_user(
        client=client,
        email=invited_email,
        password=invited_password,
    )

    create_property_response = client.post(
        "/api/properties",
        headers=manager_headers,
        json={
            "name": f"Managed Property {uuid.uuid4().hex[:8]}",
            "city": "Goa",
            "property_type": "Hotel",
            "base_price": 5000,
            "bedrooms": 2,
            "accommodates": 4,
        },
    )

    assert create_property_response.status_code == 200


def test_invalid_member_role_is_rejected(client, auth_headers):
    invited_user, _, _ = create_workspace_member(
        client=client,
        auth_headers=auth_headers,
        prefix="team_invalid_role",
        role="VIEWER",
    )

    response = client.patch(
        f"/api/workspace/members/{invited_user['id']}/role",
        headers=auth_headers,
        json={"role": "SUPER_ADMIN"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid role"


def test_last_org_admin_cannot_be_downgraded(client, auth_headers):
    me_response = client.get(
        "/api/auth/me",
        headers=auth_headers,
    )

    assert me_response.status_code == 200

    current_admin = me_response.json()

    response = client.patch(
        f"/api/workspace/members/{current_admin['id']}/role",
        headers=auth_headers,
        json={"role": "VIEWER"},
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Cannot remove or downgrade the last active organization admin"
    )


def test_last_org_admin_cannot_be_deactivated(client, auth_headers):
    me_response = client.get(
        "/api/auth/me",
        headers=auth_headers,
    )

    assert me_response.status_code == 200

    current_admin = me_response.json()

    response = client.patch(
        f"/api/workspace/members/{current_admin['id']}/deactivate",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Cannot remove or downgrade the last active organization admin"
    )


def test_org_admin_can_deactivate_member_and_login_is_blocked(client, auth_headers):
    invited_user, invited_email, invited_password = create_workspace_member(
        client=client,
        auth_headers=auth_headers,
        prefix="team_deactivate",
        role="VIEWER",
    )

    response = client.patch(
        f"/api/workspace/members/{invited_user['id']}/deactivate",
        headers=auth_headers,
    )

    assert response.status_code == 200

    deactivated_member = response.json()

    assert deactivated_member["id"] == invited_user["id"]
    assert deactivated_member["is_active"] is False

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": invited_email,
            "password": invited_password,
        },
    )

    assert login_response.status_code == 401