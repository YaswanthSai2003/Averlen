import os
import shutil
import uuid

# These must be set BEFORE importing app/settings.
os.environ["TESTING"] = "true"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["BCRYPT_ROUNDS"] = "4"
os.environ["DISABLE_AUDIT_LOGS"] = "true"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-pytest-only"
os.environ["DATABASE_URL"] = "sqlite:///./test_averlen.db"
os.environ["PRIVATE_UPLOAD_DIR"] = ""
os.environ["PUBLIC_UPLOAD_DIR"] = "test_uploads/property_photos"
os.environ["UPLOAD_DIR"] = "test_uploads/private_csv"
os.environ["PUBLIC_AVATAR_UPLOAD_DIR"] = "test_uploads/user_avatars"
os.environ["MEDIA_STORAGE_BACKEND"] = "local"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings
from app.db.database import get_session
from app.main import app

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(autouse=True)
def disable_external_services(monkeypatch, tmp_path):
    private_upload_dir = tmp_path / "private_csv"
    public_upload_dir = tmp_path / "property_photos"
    public_avatar_upload_dir = tmp_path / "user_avatars"

    private_upload_dir.mkdir(parents=True, exist_ok=True)
    public_upload_dir.mkdir(parents=True, exist_ok=True)
    public_avatar_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(settings, "testing", True)
    monkeypatch.setattr(settings, "redis_url", "redis://localhost:0/0")
    monkeypatch.setattr(settings, "openrouter_api_key", "")
    monkeypatch.setattr(settings, "media_storage_backend", "local")
    monkeypatch.setattr(settings, "rate_limit_enabled", False)
    monkeypatch.setattr(settings, "disable_audit_logs", True)
    monkeypatch.setattr(settings, "bcrypt_rounds", 4)
    monkeypatch.setattr(settings, "upload_dir", str(private_upload_dir))
    monkeypatch.setattr(settings, "private_upload_dir", "")
    monkeypatch.setattr(settings, "public_upload_dir", str(public_upload_dir))
    monkeypatch.setattr(settings, "public_avatar_upload_dir", str(public_avatar_upload_dir))

    yield

    shutil.rmtree(private_upload_dir, ignore_errors=True)
    shutil.rmtree(public_upload_dir, ignore_errors=True)
    shutil.rmtree(public_avatar_upload_dir, ignore_errors=True)

@pytest.fixture()
def session():
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)

    with Session(test_engine) as session:
        yield session

    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture()
def client(session):
    def get_test_session():
        yield session

    app.dependency_overrides[get_session] = get_test_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    email = f"user_{uuid.uuid4().hex}@example.com"
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Test User",
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

    token = login_response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}