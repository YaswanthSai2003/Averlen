from datetime import timedelta

from sqlmodel import select

from app.core.config import settings
from app.db.models import User
from app.services.account_token_service import (
    issue_email_verification_token,
    issue_password_reset_token,
    utc_now,
)


REGISTER_PAYLOAD = {
    "email": "verify@example.com",
    "password": "Test@12345",
    "full_name": "Verify User",
    "accepted_terms": True,
    "accepted_privacy_policy": True,
}


def register_unverified_user(client, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)

    response = client.post(
        "/api/auth/register",
        json=REGISTER_PAYLOAD,
    )

    assert response.status_code == 201
    assert response.json()["email_verified_at"] is None

    return response


def test_unverified_user_cannot_login(client, monkeypatch):
    register_unverified_user(client, monkeypatch)

    response = client.post(
        "/api/auth/login",
        data={
            "username": REGISTER_PAYLOAD["email"],
            "password": REGISTER_PAYLOAD["password"],
        },
    )

    assert response.status_code == 403
    assert "not verified" in response.json()["detail"].lower()


def test_verify_email_allows_login(client, session, monkeypatch):
    register_unverified_user(client, monkeypatch)

    user = session.exec(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    ).one()

    raw_token = issue_email_verification_token(session, user)

    verify_response = client.post(
        "/api/auth/verify-email",
        json={"token": raw_token},
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["email"] == REGISTER_PAYLOAD["email"]

    session.refresh(user)
    assert user.email_verified_at is not None
    assert user.email_verification_token_hash is None
    assert user.email_verification_expires_at is None

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": REGISTER_PAYLOAD["email"],
            "password": REGISTER_PAYLOAD["password"],
        },
    )

    assert login_response.status_code == 200


def test_verification_token_is_single_use(client, session, monkeypatch):
    register_unverified_user(client, monkeypatch)

    user = session.exec(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    ).one()

    raw_token = issue_email_verification_token(session, user)

    assert client.post(
        "/api/auth/verify-email",
        json={"token": raw_token},
    ).status_code == 200

    reused_response = client.post(
        "/api/auth/verify-email",
        json={"token": raw_token},
    )

    assert reused_response.status_code == 400


def test_expired_verification_token_is_rejected(client, session, monkeypatch):
    register_unverified_user(client, monkeypatch)

    user = session.exec(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    ).one()

    raw_token = issue_email_verification_token(session, user)
    user.email_verification_expires_at = utc_now() - timedelta(minutes=1)
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/verify-email",
        json={"token": raw_token},
    )

    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


def test_forgot_password_does_not_reveal_account_existence(client):
    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "missing@example.com"},
    )

    assert response.status_code == 200
    assert "if an averlen account exists" in response.json()["message"].lower()


def test_password_reset_changes_password_and_consumes_token(
    client,
    session,
):
    register_response = client.post(
        "/api/auth/register",
        json=REGISTER_PAYLOAD,
    )
    assert register_response.status_code == 201

    user = session.exec(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    ).one()

    raw_token = issue_password_reset_token(session, user)

    reset_response = client.post(
        "/api/auth/reset-password",
        json={
            "token": raw_token,
            "new_password": "NewPassword@123",
        },
    )

    assert reset_response.status_code == 200

    reused_response = client.post(
        "/api/auth/reset-password",
        json={
            "token": raw_token,
            "new_password": "AnotherPassword@123",
        },
    )
    assert reused_response.status_code == 400

    old_login = client.post(
        "/api/auth/login",
        data={
            "username": REGISTER_PAYLOAD["email"],
            "password": REGISTER_PAYLOAD["password"],
        },
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/auth/login",
        data={
            "username": REGISTER_PAYLOAD["email"],
            "password": "NewPassword@123",
        },
    )
    assert new_login.status_code == 200


def test_expired_password_reset_token_is_rejected(client, session):
    register_response = client.post(
        "/api/auth/register",
        json=REGISTER_PAYLOAD,
    )
    assert register_response.status_code == 201

    user = session.exec(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    ).one()

    raw_token = issue_password_reset_token(session, user)
    user.password_reset_expires_at = utc_now() - timedelta(minutes=1)
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/reset-password",
        json={
            "token": raw_token,
            "new_password": "NewPassword@123",
        },
    )

    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()

def test_password_reset_verifies_unverified_email(
    client,
    session,
    monkeypatch,
):
    register_unverified_user(client, monkeypatch)

    user = session.exec(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    ).one()

    raw_token = issue_password_reset_token(session, user)

    response = client.post(
        "/api/auth/reset-password",
        json={
            "token": raw_token,
            "new_password": "NewPassword@123",
        },
    )

    assert response.status_code == 200

    session.refresh(user)
    assert user.email_verified_at is not None
    assert user.email_verification_token_hash is None
    assert user.email_verification_expires_at is None

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": REGISTER_PAYLOAD["email"],
            "password": "NewPassword@123",
        },
    )

    assert login_response.status_code == 200

