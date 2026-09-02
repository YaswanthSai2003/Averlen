from datetime import timedelta

from sqlmodel import select

from app.db.models import (
    AIInsightHistory,
    Notification,
    Organization,
    OrganizationInvite,
    PricingRecommendationHistory,
    Property,
    User,
)
from app.core.roles import ORG_ADMIN
from app.core.security import hash_password
from app.services.demo_service import DEMO_PROPERTIES, utc_now


def get_demo_headers(client):
    response = client.post("/api/auth/demo-login")

    assert response.status_code == 200

    access_token = response.json()["access_token"]

    return {"Authorization": f"Bearer {access_token}"}


def test_demo_login_seeds_workspace_data(client):
    headers = get_demo_headers(client)

    me_response = client.get("/api/auth/me", headers=headers)

    assert me_response.status_code == 200

    me = me_response.json()

    assert me["email"] == "demo@averlen.app"
    assert me["role"] == "ORG_ADMIN"

    properties_response = client.get("/api/properties", headers=headers)

    assert properties_response.status_code == 200

    properties = properties_response.json()

    assert len(properties) >= 5

    property_names = {property_item["name"] for property_item in properties}

    assert "Sea View Apartment" in property_names
    assert "Beach Villa" in property_names
    assert "Business Bay Suites" in property_names

    upload_jobs_response = client.get("/api/upload/jobs", headers=headers)

    assert upload_jobs_response.status_code == 200

    jobs = upload_jobs_response.json()["jobs"]

    assert any(job["filename"] == "averlen_demo_bookings.csv" for job in jobs)

    insights_response = client.get("/api/insights/history", headers=headers)

    assert insights_response.status_code == 200
    assert insights_response.json()["total"] >= 2

    notifications_response = client.get("/api/notifications", headers=headers)

    assert notifications_response.status_code == 200

    notification_titles = {
        item["title"]
        for item in notifications_response.json()["items"]
    }

    assert "Welcome to the Averlen demo" in notification_titles
    assert "Demo bookings loaded" in notification_titles




def test_demo_workspace_search_returns_seeded_data(client):
    headers = get_demo_headers(client)

    response = client.get(
        "/api/search?q=Goa&limit=20",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["query"] == "Goa"
    assert len(data["results"]) > 0

    result_types = {item["type"] for item in data["results"]}

    assert "property" in result_types

def assert_demo_read_only(response):
    assert response.status_code == 403
    assert response.json() == {"detail": "Demo workspace is read-only"}


def test_demo_workspace_blocks_business_mutations(client):
    headers = get_demo_headers(client)

    properties = client.get("/api/properties", headers=headers).json()
    property_id = properties[0]["id"]

    assert_demo_read_only(
        client.post(
            "/api/properties",
            headers=headers,
            json={
                "name": "Should Not Be Created",
                "city": "Goa",
                "property_type": "Apartment",
                "base_price": 5000,
                "bedrooms": 1,
                "accommodates": 2,
            },
        )
    )

    assert_demo_read_only(
        client.post(
            "/api/upload/bookings/preview",
            headers=headers,
            files={
                "file": (
                    "demo.csv",
                    b"property_id,check_in,check_out,price,booked_on\n"
                    + f"{property_id},2026-02-01,2026-02-02,5000,2026-01-01\n".encode(),
                    "text/csv",
                )
            },
        )
    )

    assert_demo_read_only(
        client.post(
            f"/api/recommendations/pricing/{property_id}/generate",
            headers=headers,
        )
    )

    assert_demo_read_only(
        client.post(
            "/api/insights/query",
            headers=headers,
            json={"question": "Which property is performing best?"},
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/workspace",
            headers=headers,
            json={"name": "Changed Demo Workspace"},
        )
    )

    assert_demo_read_only(
        client.post(
            "/api/invites",
            headers=headers,
            json={"email": "new.user@example.com", "role": "VIEWER"},
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/notifications/read-all",
            headers=headers,
        )
    )

    assert_demo_read_only(
        client.put(
            f"/api/properties/{property_id}",
            headers=headers,
            json={"base_price": 1},
        )
    )

    assert_demo_read_only(
        client.delete(
            f"/api/properties/{property_id}",
            headers=headers,
        )
    )

    pricing_history = client.get(
        f"/api/recommendations/pricing/{property_id}/history",
        headers=headers,
    ).json()["items"]
    history_id = pricing_history[0]["id"]

    assert_demo_read_only(
        client.patch(
            f"/api/recommendations/pricing/history/{history_id}/status",
            headers=headers,
            json={"status": "accepted"},
        )
    )

    insight_history = client.get(
        "/api/insights/history",
        headers=headers,
    ).json()["items"]
    insight_id = insight_history[0]["id"]

    assert_demo_read_only(
        client.patch(
            f"/api/insights/history/{insight_id}/pin",
            headers=headers,
        )
    )

    assert_demo_read_only(
        client.delete(
            f"/api/insights/history/{insight_id}",
            headers=headers,
        )
    )

    me = client.get("/api/auth/me", headers=headers).json()
    demo_user_id = me["id"]

    assert_demo_read_only(
        client.patch(
            f"/api/workspace/members/{demo_user_id}/role",
            headers=headers,
            json={"role": "VIEWER"},
        )
    )

    assert_demo_read_only(
        client.patch(
            f"/api/workspace/members/{demo_user_id}/deactivate",
            headers=headers,
        )
    )

    notifications = client.get(
        "/api/notifications",
        headers=headers,
    ).json()["items"]
    notification_id = notifications[0]["id"]

    assert_demo_read_only(
        client.patch(
            f"/api/notifications/{notification_id}/read",
            headers=headers,
        )
    )

    assert_demo_read_only(
        client.delete(
            f"/api/notifications/{notification_id}",
            headers=headers,
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/notifications/preferences",
            headers=headers,
            json={"pricing_enabled": False},
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/invites/1/regenerate",
            headers=headers,
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/invites/1/cancel",
            headers=headers,
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/access-requests/1/approve",
            headers=headers,
            json={"role": "VIEWER"},
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/access-requests/1/reject",
            headers=headers,
        )
    )


def test_demo_workspace_blocks_account_mutations(client):
    headers = get_demo_headers(client)

    assert_demo_read_only(
        client.patch(
            "/api/auth/me",
            headers=headers,
            json={"full_name": "Changed Demo User"},
        )
    )

    assert_demo_read_only(
        client.patch(
            "/api/auth/change-password",
            headers=headers,
            json={
                "current_password": "Demo@12345",
                "new_password": "Changed@12345",
            },
        )
    )


def test_demo_sessions_only_expose_current_session(client):
    first_headers = get_demo_headers(client)
    assert first_headers["Authorization"].startswith("Bearer ")

    second_headers = get_demo_headers(client)

    response = client.get(
        "/api/auth/sessions",
        headers=second_headers,
    )

    assert response.status_code == 200

    sessions = response.json()["sessions"]

    assert len(sessions) == 1
    assert sessions[0]["is_current"] is True

    assert_demo_read_only(
        client.delete(
            f"/api/auth/sessions/{sessions[0]['id']}",
            headers=second_headers,
        )
    )

def test_demo_login_repairs_legacy_shared_demo_changes(client, session):
    headers = get_demo_headers(client)
    me = client.get("/api/auth/me", headers=headers).json()
    organization_id = me["organization_id"]

    demo_user = session.exec(
        select(User).where(User.email == "demo@averlen.app")
    ).one()
    demo_user.full_name = "Changed Demo User"
    demo_user.avatar_url = "/uploads/user_avatars/legacy-demo.png"
    session.add(demo_user)

    beach_villa = session.exec(
        select(Property).where(
            Property.organization_id == organization_id,
            Property.name == "Beach Villa",
        )
    ).one()
    beach_villa.base_price = 1
    beach_villa.photo_url = "/uploads/property_photos/legacy-demo.png"
    session.add(beach_villa)

    pricing_record = session.exec(
        select(PricingRecommendationHistory).where(
            PricingRecommendationHistory.organization_id == organization_id
        )
    ).first()
    assert pricing_record is not None
    pricing_record.status = "rejected"
    session.add(pricing_record)

    insight = session.exec(
        select(AIInsightHistory).where(
            AIInsightHistory.organization_id == organization_id
        )
    ).first()
    assert insight is not None
    insight.is_pinned = not insight.is_pinned
    session.add(insight)

    notification = session.exec(
        select(Notification).where(
            Notification.organization_id == organization_id
        )
    ).first()
    assert notification is not None
    notification.is_read = True
    notification.read_at = utc_now()
    session.add(notification)

    session.add(
        Property(
            organization_id=organization_id,
            name="Legacy Demo Property",
            city="Goa",
            property_type="Apartment",
            base_price=1000,
            bedrooms=1,
            accommodates=2,
        )
    )

    assert demo_user.id is not None
    session.add(
        OrganizationInvite(
            organization_id=organization_id,
            invited_by_user_id=demo_user.id,
            email="legacy.invite@example.com",
            role="ANALYST",
            token_hash="legacy-demo-invite-token",
            status="pending",
            expires_at=utc_now() + timedelta(days=7),
        )
    )

    session.commit()

    repaired_headers = get_demo_headers(client)

    repaired_me = client.get(
        "/api/auth/me",
        headers=repaired_headers,
    ).json()
    assert repaired_me["full_name"] == "Demo User"
    assert repaired_me["avatar_url"] is None

    properties = client.get(
        "/api/properties",
        headers=repaired_headers,
    ).json()
    expected_by_name = {item["name"]: item for item in DEMO_PROPERTIES}

    assert len(properties) == len(expected_by_name)
    assert {item["name"] for item in properties} == set(expected_by_name)
    assert all(item["photo_url"] is None for item in properties)

    repaired_beach_villa = next(
        item for item in properties if item["name"] == "Beach Villa"
    )
    assert repaired_beach_villa["base_price"] == 9000

    for property_item in properties:
        history = client.get(
            f"/api/recommendations/pricing/{property_item['id']}/history",
            headers=repaired_headers,
        ).json()
        assert history["total"] == 1
        assert history["items"][0]["status"] == "generated"

    insights = client.get(
        "/api/insights/history",
        headers=repaired_headers,
    ).json()
    assert insights["total"] == 2
    assert {item["question"] for item in insights["items"]} == {
        "Which city is performing best in the demo workspace?",
        "What should I check after uploading my own CSV?",
    }

    notifications = client.get(
        "/api/notifications",
        headers=repaired_headers,
    ).json()
    assert notifications["total"] == 4
    assert notifications["unread_count"] == 4
    assert all(not item["is_read"] for item in notifications["items"])

    invites = client.get(
        "/api/invites",
        headers=repaired_headers,
    )
    assert invites.status_code == 200
    assert invites.json() == []
