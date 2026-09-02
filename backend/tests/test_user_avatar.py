from io import BytesIO


PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01"
    b"\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00"
    b"\x90wS\xde"
    b"\x00\x00\x00\x0cIDAT"
    b"\x08\xd7c\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00"
    b"\x18\xdd\x8d\xb0"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_upload_my_avatar(client, auth_headers):
    response = client.post(
        "/api/auth/me/avatar",
        headers=auth_headers,
        files={
            "file": (
                "avatar.png",
                BytesIO(PNG_1X1),
                "image/png",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["avatar_url"] is not None
    assert data["avatar_url"].startswith("/uploads/user_avatars/")
    assert data["avatar_url"].endswith(".png")

    me_response = client.get("/api/auth/me", headers=auth_headers)

    assert me_response.status_code == 200
    assert me_response.json()["avatar_url"] == data["avatar_url"]


def test_reject_invalid_avatar_content(client, auth_headers):
    response = client.post(
        "/api/auth/me/avatar",
        headers=auth_headers,
        files={
            "file": (
                "avatar.png",
                BytesIO(b"not a real image"),
                "image/png",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid profile photo content"


def test_delete_my_avatar(client, auth_headers):
    upload_response = client.post(
        "/api/auth/me/avatar",
        headers=auth_headers,
        files={
            "file": (
                "avatar.png",
                BytesIO(PNG_1X1),
                "image/png",
            )
        },
    )

    assert upload_response.status_code == 200
    assert upload_response.json()["avatar_url"] is not None

    delete_response = client.delete(
        "/api/auth/me/avatar",
        headers=auth_headers,
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["avatar_url"] is None

    me_response = client.get("/api/auth/me", headers=auth_headers)

    assert me_response.status_code == 200
    assert me_response.json()["avatar_url"] is None


def test_workspace_members_include_avatar_url(client, auth_headers):
    upload_response = client.post(
        "/api/auth/me/avatar",
        headers=auth_headers,
        files={
            "file": (
                "avatar.png",
                BytesIO(PNG_1X1),
                "image/png",
            )
        },
    )

    assert upload_response.status_code == 200

    members_response = client.get(
        "/api/workspace/members",
        headers=auth_headers,
    )

    assert members_response.status_code == 200

    members = members_response.json()["members"]
    assert len(members) == 1
    assert members[0]["avatar_url"] == upload_response.json()["avatar_url"]