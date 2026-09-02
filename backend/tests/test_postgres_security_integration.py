import os
import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url
from sqlmodel import SQLModel, Session, create_engine, select

import app.db.models  # noqa: F401
from app.db.database import get_session
from app.db.models import Booking, Property
from app.main import app
from app.core.config import settings


def get_postgres_test_url() -> str:
    postgres_url = os.getenv("TEST_DATABASE_URL", "")

    if not postgres_url:
        pytest.skip("TEST_DATABASE_URL is not set")

    parsed_url = make_url(postgres_url)

    if parsed_url.get_backend_name() not in {"postgresql", "postgresql+psycopg"}:
        pytest.skip("TEST_DATABASE_URL must point to PostgreSQL")

    database_name = parsed_url.database or ""

    if not database_name.endswith("_test"):
        pytest.skip(
            "Refusing to run destructive PostgreSQL tests on a non-test database"
        )

    return postgres_url


@pytest.fixture()
def pg_engine(monkeypatch, tmp_path):
    if os.getenv("RUN_POSTGRES_TESTS") != "true":
        pytest.skip("Set RUN_POSTGRES_TESTS=true to run PostgreSQL tests")

    monkeypatch.setattr(settings, "testing", True)
    monkeypatch.setattr(settings, "redis_url", "redis://localhost:0/0")
    monkeypatch.setattr(settings, "disable_audit_logs", True)
    monkeypatch.setattr(settings, "rate_limit_enabled", False)
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "private_csv"))
    monkeypatch.setattr(settings, "private_upload_dir", "")
    monkeypatch.setattr(settings, "public_upload_dir", str(tmp_path / "property_photos"))

    postgres_url = get_postgres_test_url()

    engine = create_engine(postgres_url)

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    yield engine

    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def pg_session(pg_engine):
    with Session(pg_engine) as session:
        yield session


@pytest.fixture()
def pg_client(pg_session):
    def get_pg_test_session():
        yield pg_session

    app.dependency_overrides[get_session] = get_pg_test_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@gmail.com"


def register_and_login(client, prefix: str):
    email = unique_email(prefix)
    password = "Test@12345"
    full_name = f"{prefix}_{uuid.uuid4().hex[:8]} User"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
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

    headers = {
        "Authorization": f"Bearer {login_response.json()['access_token']}"
    }

    me_response = client.get(
        "/api/auth/me",
        headers=headers,
    )

    assert me_response.status_code == 200

    organization_id = me_response.json()["organization_id"]

    return headers, organization_id


def create_property(session: Session, organization_id: int) -> Property:
    property_obj = Property(
        organization_id=organization_id,
        name=f"PG Property {uuid.uuid4().hex[:8]}",
        city="Goa",
        property_type="Hotel",
        base_price=5000,
        bedrooms=2,
        accommodates=4,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    return property_obj


def upload_preview(client, headers, property_id: int):
    csv_content = (
        "property_id,check_in,check_out,price,booked_on\n"
        f"{property_id},2025-03-01,2025-03-05,5000,2025-02-20\n"
    ).encode("utf-8")

    response = client.post(
        "/api/upload/bookings/preview",
        headers=headers,
        files={
            "file": (
                "bookings.csv",
                csv_content,
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    return response.json()["upload_id"]


def process_upload(client, headers, upload_id: str):
    return client.post(
        "/api/upload/bookings/process",
        headers=headers,
        json={
            "upload_id": upload_id,
            "property_id": "property_id",
            "check_in": "check_in",
            "check_out": "check_out",
            "price": "price",
            "booked_on": "booked_on",
        },
    )


def test_postgres_tenant_isolation_excludes_wrong_org_booking(
    pg_client,
    pg_session,
):
    org_a_headers, org_a_id = register_and_login(pg_client, "pg_org_a")
    _, org_b_id = register_and_login(pg_client, "pg_org_b")

    assert org_a_id != org_b_id, f"Expected different orgs, got same org_id={org_a_id}"

    property_a = create_property(pg_session, org_a_id)

    valid_booking = Booking(
        organization_id=org_a_id,
        property_id=property_a.id,
        check_in=date(2025, 3, 1),
        check_out=date(2025, 3, 3),
        price=1000,
        booked_on=date(2025, 2, 20),
    )

    corrupted_cross_tenant_booking = Booking(
        organization_id=org_b_id,
        property_id=property_a.id,
        check_in=date(2025, 3, 4),
        check_out=date(2025, 3, 6),
        price=999999,
        booked_on=date(2025, 2, 21),
    )

    pg_session.add_all([valid_booking, corrupted_cross_tenant_booking])
    pg_session.commit()

    response = pg_client.get(
        "/api/analytics/revenue",
        headers=org_a_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_revenue"] == 1000
    assert data["total_bookings"] == 1


def test_postgres_same_upload_id_cannot_be_processed_twice(
    pg_client,
    pg_session,
):
    headers, organization_id = register_and_login(pg_client, "pg_upload_owner")
    property_obj = create_property(pg_session, organization_id)

    upload_id = upload_preview(pg_client, headers, property_obj.id)

    first_response = process_upload(pg_client, headers, upload_id)

    assert first_response.status_code == 200

    second_response = process_upload(pg_client, headers, upload_id)

    assert second_response.status_code == 400
    assert (
        second_response.json()["detail"]
        == "Upload has already been queued or processed"
    )

    pg_session.expire_all()

    bookings = pg_session.exec(
        select(Booking).where(
            Booking.organization_id == organization_id,
            Booking.property_id == property_obj.id,
        )
    ).all()

    assert len(bookings) == 1


def test_postgres_org_b_cannot_process_org_a_upload_id(
    pg_client,
    pg_session,
):
    org_a_headers, org_a_id = register_and_login(pg_client, "pg_upload_org_a")
    org_b_headers, _ = register_and_login(pg_client, "pg_upload_org_b")

    property_a = create_property(pg_session, org_a_id)

    upload_id = upload_preview(pg_client, org_a_headers, property_a.id)

    response = process_upload(pg_client, org_b_headers, upload_id)

    assert response.status_code == 404