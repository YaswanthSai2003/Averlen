from uuid import uuid4

from app.core.security import hash_password
from app.db.models import Property, User


def create_role_user(
    session,
    organization_id: int,
    role: str,
) -> tuple[str, str]:
    email = f"{role.lower()}-{uuid4().hex}@example.com"
    password = "Test@12345"

    user = User(
        organization_id=organization_id,
        email=email,
        full_name=f"{role} User",
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return email, password


def login_headers(client, email: str, password: str):
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


def create_rbac_property(session, organization_id: int) -> Property:
    property_obj = Property(
        organization_id=organization_id,
        name=f"RBAC Property {uuid4().hex[:8]}",
        city="Goa",
        property_type="Villa",
        base_price=9000,
        bedrooms=4,
        accommodates=8,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    return property_obj


def test_viewer_cannot_generate_pricing_recommendation(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_rbac_property(session, organization_id)

    email, password = create_role_user(
        session=session,
        organization_id=organization_id,
        role="VIEWER",
    )

    viewer_headers = login_headers(client, email, password)

    response = client.post(
        f"/api/recommendations/pricing/{property_obj.id}/generate",
        headers=viewer_headers,
    )

    assert response.status_code == 403


def test_viewer_can_preview_pricing_recommendation(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    property_obj = create_rbac_property(session, organization_id)

    email, password = create_role_user(
        session=session,
        organization_id=organization_id,
        role="VIEWER",
    )

    viewer_headers = login_headers(client, email, password)

    response = client.get(
        f"/api/recommendations/pricing/{property_obj.id}",
        headers=viewer_headers,
    )

    assert response.status_code == 200


def test_viewer_cannot_query_ai_insights(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    email, password = create_role_user(
        session=session,
        organization_id=organization_id,
        role="VIEWER",
    )

    viewer_headers = login_headers(client, email, password)

    response = client.post(
        "/api/insights/query",
        headers=viewer_headers,
        json={"question": "Which city has the best revenue?"},
    )

    assert response.status_code == 403


def test_analyst_can_query_ai_insights(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]

    email, password = create_role_user(
        session=session,
        organization_id=organization_id,
        role="ANALYST",
    )

    analyst_headers = login_headers(client, email, password)

    response = client.post(
        "/api/insights/query",
        headers=analyst_headers,
        json={"question": "Which city has the best revenue?"},
    )

    assert response.status_code == 200