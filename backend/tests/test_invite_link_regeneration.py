import uuid


def unique_email(prefix: str) -> str:
    return (
        f"{prefix}_{uuid.uuid4().hex[:8]}"
        "@example.com"
    )


def test_org_admin_can_regenerate_invite_link(
    client,
    auth_headers,
):
    email = unique_email(
        "invite_regenerate"
    )

    create_response = client.post(
        "/api/invites",
        headers=auth_headers,
        json={
            "email": email,
            "role": "ANALYST",
        },
    )

    assert create_response.status_code == 200

    original = create_response.json()
    invite_id = original["invite"]["id"]
    original_token = original["invite_token"]

    regenerate_response = client.patch(
        f"/api/invites/{invite_id}/regenerate",
        headers=auth_headers,
    )

    assert regenerate_response.status_code == 200

    regenerated = regenerate_response.json()
    regenerated_token = regenerated["invite_token"]

    assert regenerated_token
    assert regenerated_token != original_token
    assert (
        regenerated["invite"]["id"]
        == invite_id
    )
    assert (
        regenerated["invite"]["status"]
        == "pending"
    )
    assert regenerated["invite_url"].endswith(
        regenerated_token
    )

    old_link_response = client.get(
        "/api/invites/validate",
        params={
            "invite_token":
                original_token,
        },
    )

    assert old_link_response.status_code == 400

    new_link_response = client.get(
        "/api/invites/validate",
        params={
            "invite_token":
                regenerated_token,
        },
    )

    assert new_link_response.status_code == 200
    assert (
        new_link_response.json()["email"]
        == email
    )


def test_regenerate_invite_is_tenant_scoped(
    client,
    auth_headers,
):
    email = unique_email(
        "invite_tenant_scope"
    )

    create_response = client.post(
        "/api/invites",
        headers=auth_headers,
        json={
            "email": email,
            "role": "VIEWER",
        },
    )

    assert create_response.status_code == 200

    invite_id = (
        create_response
        .json()["invite"]["id"]
    )

    missing_response = client.patch(
        f"/api/invites/{invite_id + 999999}/regenerate",
        headers=auth_headers,
    )

    assert missing_response.status_code == 404
