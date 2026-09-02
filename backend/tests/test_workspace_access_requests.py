import uuid


def company_domain(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}.com"


def register_direct(
    client,
    *,
    email: str,
    organization_name: str,
    full_name: str = "Workspace Owner",
    password: str = "Test@12345",
):
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
            "organization_name": organization_name,
            "accepted_terms": True,
            "accepted_privacy_policy": True,
        },
    )


def login_user(client, email: str, password: str = "Test@12345") -> dict[str, str]:
    response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return {
        "Authorization": f"Bearer {response.json()['access_token']}"
    }


def test_direct_signup_claims_company_domain_and_blocks_duplicate_workspace(client):
    domain = company_domain("domain-claim")
    owner_email = f"owner@{domain}"
    second_email = f"manager@{domain}"

    first_response = register_direct(
        client,
        email=owner_email,
        organization_name="Domain Claim Hotels",
    )

    assert first_response.status_code == 201
    first_user = first_response.json()
    assert first_user["role"] == "ORG_ADMIN"

    discovery_response = client.get(
        "/api/access-requests/discover",
        params={"email": second_email},
    )

    assert discovery_response.status_code == 200
    assert discovery_response.json() == {
        "existing_workspace": True,
        "can_request_access": True,
    }

    second_response = register_direct(
        client,
        email=second_email,
        organization_name="A Different Typed Name",
    )

    assert second_response.status_code == 409
    assert "Request access" in second_response.json()["detail"]


def test_public_email_domain_does_not_auto_match_workspaces(client):
    first_email = f"public-one-{uuid.uuid4().hex[:8]}@example.com"
    second_email = f"public-two-{uuid.uuid4().hex[:8]}@example.com"

    first_response = register_direct(
        client,
        email=first_email,
        organization_name="Public Mail Workspace One",
    )
    second_response = register_direct(
        client,
        email=second_email,
        organization_name="Public Mail Workspace Two",
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert (
        first_response.json()["organization_id"]
        != second_response.json()["organization_id"]
    )

    discovery_response = client.get(
        "/api/access-requests/discover",
        params={"email": second_email},
    )

    assert discovery_response.status_code == 200
    assert discovery_response.json() == {
        "existing_workspace": False,
        "can_request_access": False,
    }


def test_access_request_approval_creates_invite_and_maps_user_to_same_org(client):
    domain = company_domain("join-request")
    owner_email = f"owner@{domain}"
    requester_email = f"analyst@{domain}"

    owner_response = register_direct(
        client,
        email=owner_email,
        organization_name="Join Request Hotels",
    )

    assert owner_response.status_code == 201
    owner = owner_response.json()
    owner_headers = login_user(client, owner_email)

    request_response = client.post(
        "/api/access-requests",
        json={
            "email": requester_email,
            "full_name": "Requested Analyst",
        },
    )

    assert request_response.status_code == 201
    request_data = request_response.json()
    assert request_data["email"] == requester_email
    assert request_data["status"] == "pending"

    list_response = client.get(
        "/api/access-requests",
        headers=owner_headers,
    )

    assert list_response.status_code == 200
    matching = [
        item
        for item in list_response.json()["requests"]
        if item["email"] == requester_email
    ]
    assert len(matching) == 1

    approve_response = client.patch(
        f"/api/access-requests/{request_data['id']}/approve",
        headers=owner_headers,
        json={"role": "ANALYST"},
    )

    assert approve_response.status_code == 200
    approval = approve_response.json()
    assert approval["request"]["status"] == "approved"
    assert approval["request"]["approved_role"] == "ANALYST"
    assert approval["invite_token"]
    assert approval["invite_url"].startswith("/register?invite_token=")

    invited_registration = client.post(
        "/api/auth/register",
        json={
            "email": requester_email,
            "password": "Test@12345",
            "full_name": "Requested Analyst",
            "accepted_terms": True,
            "accepted_privacy_policy": True,
            "invite_token": approval["invite_token"],
        },
    )

    assert invited_registration.status_code == 201
    invited_user = invited_registration.json()
    assert invited_user["organization_id"] == owner["organization_id"]
    assert invited_user["role"] == "ANALYST"


def test_access_request_is_tenant_scoped(client):
    first_domain = company_domain("tenant-one")
    second_domain = company_domain("tenant-two")

    first_owner_email = f"owner@{first_domain}"
    second_owner_email = f"owner@{second_domain}"
    requester_email = f"requester@{first_domain}"

    first_owner = register_direct(
        client,
        email=first_owner_email,
        organization_name="Tenant One",
    )
    second_owner = register_direct(
        client,
        email=second_owner_email,
        organization_name="Tenant Two",
    )

    assert first_owner.status_code == 201
    assert second_owner.status_code == 201

    request_response = client.post(
        "/api/access-requests",
        json={"email": requester_email},
    )
    assert request_response.status_code == 201

    second_headers = login_user(client, second_owner_email)

    list_response = client.get(
        "/api/access-requests",
        headers=second_headers,
    )
    assert list_response.status_code == 200
    assert all(
        item["email"] != requester_email
        for item in list_response.json()["requests"]
    )

    approve_response = client.patch(
        f"/api/access-requests/{request_response.json()['id']}/approve",
        headers=second_headers,
        json={"role": "VIEWER"},
    )
    assert approve_response.status_code == 404
