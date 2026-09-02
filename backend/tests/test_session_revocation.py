import uuid

import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

from app.db.models import RefreshToken
from app.services.session_service import (
    get_refresh_session_from_token,
    hash_refresh_token,
)


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


def register_user(client, email: str, password: str) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Session Revocation User",
            "accepted_terms": True,
            "accepted_privacy_policy": True,
        },
    )

    assert response.status_code == 201


def login_user(client, email: str, password: str):
    response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    refresh_cookie = response.cookies.get(
        "averlen_refresh_token"
    )
    assert refresh_cookie

    return response.json()["access_token"], refresh_cookie


def get_session_for_cookie(
    session: Session,
    refresh_cookie: str,
) -> RefreshToken:
    refresh_session = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash
            == hash_refresh_token(refresh_cookie)
        )
    ).first()

    assert refresh_session is not None
    assert refresh_session.id is not None

    return refresh_session


def test_revoked_session_access_token_is_rejected_immediately(
    client,
    session: Session,
):
    email = unique_email("session_revoke")
    password = "Test@12345"

    register_user(client, email, password)

    first_access_token, first_refresh_cookie = login_user(
        client,
        email,
        password,
    )
    first_session = get_session_for_cookie(
        session,
        first_refresh_cookie,
    )

    second_access_token, _ = login_user(
        client,
        email,
        password,
    )

    revoke_response = client.delete(
        f"/api/auth/sessions/{first_session.id}",
        headers={
            "Authorization":
                f"Bearer {second_access_token}",
        },
    )

    assert revoke_response.status_code == 200

    revoked_device_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization":
                f"Bearer {first_access_token}",
        },
    )

    assert revoked_device_response.status_code == 401
    assert (
        revoked_device_response.json()["detail"]
        == "Session expired or revoked"
    )

    active_device_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization":
                f"Bearer {second_access_token}",
        },
    )

    assert active_device_response.status_code == 200


def test_manual_revocation_is_not_treated_as_refresh_token_reuse(
    client,
    session: Session,
):
    email = unique_email("manual_revoke")
    password = "Test@12345"

    register_user(client, email, password)

    _, first_refresh_cookie = login_user(
        client,
        email,
        password,
    )
    first_session = get_session_for_cookie(
        session,
        first_refresh_cookie,
    )

    second_access_token, second_refresh_cookie = login_user(
        client,
        email,
        password,
    )
    second_session = get_session_for_cookie(
        session,
        second_refresh_cookie,
    )

    revoke_response = client.delete(
        f"/api/auth/sessions/{first_session.id}",
        headers={
            "Authorization":
                f"Bearer {second_access_token}",
        },
    )

    assert revoke_response.status_code == 200

    with pytest.raises(HTTPException) as exc_info:
        get_refresh_session_from_token(
            session,
            first_refresh_cookie,
            detect_reuse=True,
        )

    assert exc_info.value.status_code == 401
    assert (
        exc_info.value.detail
        == "Refresh token expired or revoked"
    )

    session.refresh(second_session)

    assert second_session.is_revoked is False

    active_device_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization":
                f"Bearer {second_access_token}",
        },
    )

    assert active_device_response.status_code == 200
