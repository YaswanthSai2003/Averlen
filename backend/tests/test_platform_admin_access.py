from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, require_platform_admin
from app.db.models import User


def build_user(*, is_platform_admin: bool) -> User:
    return User(
        organization_id=1,
        email=(
            "platform-admin@example.com"
            if is_platform_admin
            else "customer@example.com"
        ),
        full_name="Test User",
        hashed_password="not-used",
        role="ORG_ADMIN",
        is_platform_admin=is_platform_admin,
    )


def build_test_app() -> FastAPI:
    app = FastAPI()

    @app.get("/internal-test")
    def internal_test(
        current_user: User = Depends(require_platform_admin),
    ):
        return {
            "email": current_user.email,
            "is_platform_admin": current_user.is_platform_admin,
        }

    return app


def test_internal_route_requires_authentication():
    app = build_test_app()
    client = TestClient(app)

    response = client.get("/internal-test")

    assert response.status_code == 401


def test_org_admin_cannot_access_platform_internal_route():
    app = build_test_app()
    app.dependency_overrides[get_current_user] = lambda: build_user(
        is_platform_admin=False
    )
    client = TestClient(app)

    response = client.get("/internal-test")

    assert response.status_code == 403
    assert response.json()["detail"] == "Platform administrator access required"


def test_platform_admin_can_access_internal_route():
    app = build_test_app()
    app.dependency_overrides[get_current_user] = lambda: build_user(
        is_platform_admin=True
    )
    client = TestClient(app)

    response = client.get("/internal-test")

    assert response.status_code == 200
    assert response.json()["is_platform_admin"] is True
