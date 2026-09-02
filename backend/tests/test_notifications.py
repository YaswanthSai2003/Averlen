from uuid import uuid4

from app.db.models import Notification
from app.services.notification_service import (
    NOTIFICATION_TYPE_UPLOAD,
    PRIORITY_SUCCESS,
    create_notification,
)


def get_current_user(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    return response.json()


def clear_existing_notifications(client, auth_headers):
    response = client.get("/api/notifications", headers=auth_headers)
    assert response.status_code == 200

    for item in response.json()["items"]:
        delete_response = client.delete(
            f"/api/notifications/{item['id']}",
            headers=auth_headers,
        )
        assert delete_response.status_code == 200


def test_list_notifications_empty(client, auth_headers):
    clear_existing_notifications(client, auth_headers)

    response = client.get("/api/notifications", headers=auth_headers)

    assert response.status_code == 200

    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["unread_count"] == 0
    assert data["limit"] == 20
    assert data["offset"] == 0


def test_list_notifications_returns_workspace_notification(
    client,
    auth_headers,
    session,
):
    clear_existing_notifications(client, auth_headers)
    current_user = get_current_user(client, auth_headers)

    create_notification(
        session=session,
        organization_id=current_user["organization_id"],
        user_id=None,
        actor_user_id=current_user["id"],
        type=NOTIFICATION_TYPE_UPLOAD,
        priority=PRIORITY_SUCCESS,
        title="Upload completed",
        message="bookings.csv processed successfully.",
        entity_type="upload_job",
        entity_id=1,
    )

    response = client.get("/api/notifications", headers=auth_headers)

    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 1
    assert data["unread_count"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Upload completed"
    assert data["items"][0]["message"] == "bookings.csv processed successfully."
    assert data["items"][0]["type"] == NOTIFICATION_TYPE_UPLOAD
    assert data["items"][0]["priority"] == PRIORITY_SUCCESS
    assert data["items"][0]["entity_type"] == "upload_job"
    assert data["items"][0]["entity_id"] == 1
    assert data["items"][0]["is_read"] is False


def test_mark_notification_read(client, auth_headers, session):
    clear_existing_notifications(client, auth_headers)
    current_user = get_current_user(client, auth_headers)

    notification = create_notification(
        session=session,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
        actor_user_id=current_user["id"],
        type=NOTIFICATION_TYPE_UPLOAD,
        priority=PRIORITY_SUCCESS,
        title="Upload completed",
        message="bookings.csv processed successfully.",
    )

    response = client.patch(
        f"/api/notifications/{notification.id}/read",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()
    assert data["is_read"] is True
    assert data["read_at"] is not None

    count_response = client.get(
        "/api/notifications/unread-count",
        headers=auth_headers,
    )

    assert count_response.status_code == 200
    assert count_response.json()["unread_count"] == 0


def test_mark_all_notifications_read(client, auth_headers, session):
    clear_existing_notifications(client, auth_headers)
    current_user = get_current_user(client, auth_headers)

    for index in range(3):
        create_notification(
            session=session,
            organization_id=current_user["organization_id"],
            user_id=current_user["id"],
            actor_user_id=current_user["id"],
            type=NOTIFICATION_TYPE_UPLOAD,
            priority=PRIORITY_SUCCESS,
            title=f"Upload completed {index}",
            message="bookings.csv processed successfully.",
        )

    response = client.patch(
        "/api/notifications/read-all",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == "All notifications marked as read"

    count_response = client.get(
        "/api/notifications/unread-count",
        headers=auth_headers,
    )

    assert count_response.status_code == 200
    assert count_response.json()["unread_count"] == 0

    list_response = client.get("/api/notifications", headers=auth_headers)

    assert list_response.status_code == 200
    assert list_response.json()["total"] == 3
    assert all(item["is_read"] is True for item in list_response.json()["items"])


def test_delete_notification(client, auth_headers, session):
    clear_existing_notifications(client, auth_headers)
    current_user = get_current_user(client, auth_headers)

    notification = create_notification(
        session=session,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
        actor_user_id=current_user["id"],
        type=NOTIFICATION_TYPE_UPLOAD,
        priority=PRIORITY_SUCCESS,
        title="Upload completed",
        message="bookings.csv processed successfully.",
    )

    response = client.delete(
        f"/api/notifications/{notification.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Notification deleted"

    db_notification = session.get(Notification, notification.id)
    assert db_notification is None


def test_password_change_creates_notification(client, auth_headers):
    clear_existing_notifications(client, auth_headers)
    current_user = get_current_user(client, auth_headers)

    response = client.patch(
        "/api/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "Test@12345",
            "new_password": "NewTest@12345",
        },
    )

    assert response.status_code == 200

    # Password changes intentionally revoke every existing session, including
    # the token used above. Sign in again before reading the new notification.
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": current_user["email"],
            "password": "NewTest@12345",
        },
    )

    assert login_response.status_code == 200

    new_access_token = login_response.json()["access_token"]
    new_auth_headers = {"Authorization": f"Bearer {new_access_token}"}

    notifications_response = client.get(
        "/api/notifications",
        headers=new_auth_headers,
    )

    assert notifications_response.status_code == 200

    titles = [
        item["title"]
        for item in notifications_response.json()["items"]
    ]

    assert "Password changed" in titles

def test_login_creates_notification(client):
    email = f"notification-login-{uuid4().hex}@example.com"
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Notification Login User",
            "accepted_terms": True,
            "accepted_privacy_policy": True,
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    notifications_response = client.get(
        "/api/notifications",
        headers=headers,
    )

    assert notifications_response.status_code == 200

    titles = [
        item["title"]
        for item in notifications_response.json()["items"]
    ]

    assert "New login detected" in titles


def test_notification_preferences_default(client, auth_headers):
    response = client.get("/api/notifications/preferences", headers=auth_headers)

    assert response.status_code == 200

    data = response.json()
    assert data["upload_enabled"] is True
    assert data["data_quality_enabled"] is True
    assert data["pricing_enabled"] is True
    assert data["workspace_enabled"] is True
    assert data["ai_insight_enabled"] is True
    assert data["system_enabled"] is True
    assert data["security_enabled"] is True


def test_update_notification_preferences(client, auth_headers):
    response = client.patch(
        "/api/notifications/preferences",
        headers=auth_headers,
        json={
            "upload_enabled": False,
            "pricing_enabled": False,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["upload_enabled"] is False
    assert data["pricing_enabled"] is False
    assert data["data_quality_enabled"] is True
    assert data["security_enabled"] is True


def test_disabled_user_notification_preference_blocks_user_notification(
    client,
    auth_headers,
    session,
):
    clear_existing_notifications(client, auth_headers)
    current_user = get_current_user(client, auth_headers)

    response = client.patch(
        "/api/notifications/preferences",
        headers=auth_headers,
        json={
            "upload_enabled": False,
        },
    )

    assert response.status_code == 200

    notification = create_notification(
        session=session,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
        actor_user_id=current_user["id"],
        type=NOTIFICATION_TYPE_UPLOAD,
        priority=PRIORITY_SUCCESS,
        title="Upload completed",
        message="bookings.csv processed successfully.",
    )

    assert notification is None

    list_response = client.get("/api/notifications", headers=auth_headers)

    assert list_response.status_code == 200
    assert list_response.json()["items"] == []