import uuid

from sqlmodel import select

from app.core.config import settings
from app.db.models import AuditLog, RefreshToken, User


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@gmail.com"


def register_and_login(client, prefix: str):
    email = unique_email(prefix)
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": f"{prefix} User",
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

    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200

    organization_id = me_response.json()["organization_id"]

    return headers, organization_id, email, login_response



def _create_active_property(client, auth_headers, prefix: str):
    response = client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": f"{prefix} {uuid.uuid4().hex[:8]}",
            "city": "Bengaluru",
            "property_type": "Apartment",
            "base_price": 5000,
            "bedrooms": 1,
            "accommodates": 2,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()

def test_refresh_token_reuse_revokes_all_user_sessions(client, session):
    _, _, _, login_response = register_and_login(client, "reuse_detection")

    old_refresh_token = login_response.cookies.get(settings.refresh_cookie_name)

    assert old_refresh_token

    first_refresh_response = client.post("/api/auth/refresh")

    assert first_refresh_response.status_code == 200

    new_refresh_token = first_refresh_response.cookies.get(settings.refresh_cookie_name)

    assert new_refresh_token
    assert new_refresh_token != old_refresh_token

    session.expire_all()

    tokens_after_rotation = session.exec(select(RefreshToken)).all()

    assert len(tokens_after_rotation) == 2
    assert any(token.is_revoked for token in tokens_after_rotation)
    assert any(not token.is_revoked for token in tokens_after_rotation)

    # Simulate attacker replaying the old rotated token.
    client.cookies.clear()
    client.cookies.set(settings.refresh_cookie_name, old_refresh_token)

    reuse_response = client.post("/api/auth/refresh")

    assert reuse_response.status_code == 401

    session.expire_all()

    tokens_after_reuse = session.exec(select(RefreshToken)).all()

    assert tokens_after_reuse
    assert all(token.is_revoked for token in tokens_after_reuse)


def test_unauthenticated_user_cannot_access_platform_audit_logs(client):
    response = client.get(
        "/api/internal/audit-logs/page",
    )

    assert response.status_code == 401


def test_org_admin_cannot_access_platform_audit_logs(client, session):
    org_a_headers, org_a_id, _, _ = register_and_login(client, "audit_org_a")
    _, org_b_id, _, _ = register_and_login(client, "audit_org_b")

    session.add_all(
        [
            AuditLog(
                organization_id=org_a_id,
                email="orga@example.com",
                action="ORG_A_ONLY",
                method="GET",
                path="/api/test/org-a",
                status_code=200,
                duration_ms=1.0,
            ),
            AuditLog(
                organization_id=org_b_id,
                email="orgb@example.com",
                action="ORG_B_ONLY",
                method="GET",
                path="/api/test/org-b",
                status_code=200,
                duration_ms=1.0,
            ),
        ]
    )
    session.commit()

    response = client.get(
        "/api/internal/audit-logs/page",
        headers=org_a_headers,
    )

    assert response.status_code == 403


def test_platform_admin_can_see_all_audit_logs(client, session):
    platform_headers, platform_org_id, platform_email, _ = register_and_login(
        client,
        "platform_admin",
    )
    _, org_b_id, _, _ = register_and_login(client, "platform_other_org")

    platform_user = session.exec(
        select(User).where(User.email == platform_email)
    ).first()

    assert platform_user is not None

    platform_user.is_platform_admin = True
    session.add(platform_user)
    session.commit()

    session.add_all(
        [
            AuditLog(
                organization_id=platform_org_id,
                email=platform_email,
                action="PLATFORM_ORG_LOG",
                method="GET",
                path="/api/test/platform",
                status_code=200,
                duration_ms=1.0,
            ),
            AuditLog(
                organization_id=org_b_id,
                email="other@example.com",
                action="OTHER_ORG_LOG",
                method="GET",
                path="/api/test/other",
                status_code=200,
                duration_ms=1.0,
            ),
        ]
    )
    session.commit()

    response = client.get(
        "/api/internal/audit-logs/page",
        headers=platform_headers,
    )

    assert response.status_code == 200

    data = response.json()
    actions = {item["action"] for item in data["items"]}

    assert data["total"] == 2
    assert "PLATFORM_ORG_LOG" in actions
    assert "OTHER_ORG_LOG" in actions


def test_org_b_cannot_process_org_a_upload_id(client):
    org_a_headers, _, _, _ = register_and_login(client, "upload_org_a")
    org_b_headers, _, _, _ = register_and_login(client, "upload_org_b")
    org_a_property = _create_active_property(client, org_a_headers, "Org A Property")

    csv_content = (
        "property_code,check_in,check_out,price,booked_on\n"
        f"{org_a_property['property_code']},2025-03-01,2025-03-05,5000,2025-02-20\n"
    ).encode("utf-8")

    preview_response = client.post(
        "/api/upload/bookings/preview",
        headers=org_a_headers,
        files={
            "file": (
                "bookings.csv",
                csv_content,
                "text/csv",
            )
        },
    )

    assert preview_response.status_code == 200

    upload_id = preview_response.json()["upload_id"]

    process_response = client.post(
        "/api/upload/bookings/process",
        headers=org_b_headers,
        json={
            "upload_id": upload_id,
            "property_id": "property_code",
            "check_in": "check_in",
            "check_out": "check_out",
            "price": "price",
            "booked_on": "booked_on",
        },
    )

    assert process_response.status_code == 404