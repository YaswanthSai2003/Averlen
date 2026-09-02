import json
from collections import Counter
from datetime import date, datetime, timezone

from sqlmodel import Session, select

from app.core.roles import ORG_ADMIN
from app.core.security import hash_password, verify_password
from app.db.models import (
    AIInsightHistory,
    Booking,
    IngestionError,
    IngestionJob,
    Notification,
    NotificationPreference,
    Organization,
    OrganizationAccessRequest,
    OrganizationInvite,
    PricingRecommendationHistory,
    Property,
    RefreshToken,
    UploadSession,
    User,
)
from app.services.notification_service import (
    NOTIFICATION_TYPE_DATA_QUALITY,
    NOTIFICATION_TYPE_PRICING,
    NOTIFICATION_TYPE_SYSTEM,
    NOTIFICATION_TYPE_UPLOAD,
    PRIORITY_INFO,
    PRIORITY_SUCCESS,
    create_notification,
)

DEMO_EMAIL = "demo@averlen.app"
DEMO_PASSWORD = "Demo@12345"
DEMO_ORG_NAME = "Averlen Demo Workspace"


def is_demo_email(email: str) -> bool:
    return email.strip().lower() == DEMO_EMAIL.lower()


def get_existing_demo_user(session: Session) -> User | None:
    return session.exec(
        select(User).where(User.email == DEMO_EMAIL)
    ).first()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


DEMO_PROPERTIES = [
    {
        "name": "Sea View Apartment",
        "city": "Goa",
        "property_type": "Apartment",
        "base_price": 5000,
        "bedrooms": 2,
        "accommodates": 4,
    },
    {
        "name": "Beach Villa",
        "city": "Goa",
        "property_type": "Villa",
        "base_price": 9000,
        "bedrooms": 4,
        "accommodates": 8,
    },
    {
        "name": "City Studio",
        "city": "Bengaluru",
        "property_type": "Studio",
        "base_price": 3500,
        "bedrooms": 1,
        "accommodates": 2,
    },
    {
        "name": "Hill View Cottage",
        "city": "Ooty",
        "property_type": "Cottage",
        "base_price": 6500,
        "bedrooms": 3,
        "accommodates": 6,
    },
    {
        "name": "Business Bay Suites",
        "city": "Hyderabad",
        "property_type": "Serviced Apartment",
        "base_price": 7200,
        "bedrooms": 2,
        "accommodates": 4,
    },
]


DEMO_BOOKINGS = [
    {
        "property_name": "Sea View Apartment",
        "check_in": date(2026, 1, 5),
        "check_out": date(2026, 1, 8),
        "price": 7200,
        "booked_on": date(2025, 12, 20),
    },
    {
        "property_name": "Sea View Apartment",
        "check_in": date(2026, 1, 12),
        "check_out": date(2026, 1, 15),
        "price": 7650,
        "booked_on": date(2025, 12, 28),
    },
    {
        "property_name": "Beach Villa",
        "check_in": date(2026, 1, 7),
        "check_out": date(2026, 1, 11),
        "price": 13200,
        "booked_on": date(2025, 12, 21),
    },
    {
        "property_name": "Beach Villa",
        "check_in": date(2026, 1, 19),
        "check_out": date(2026, 1, 22),
        "price": 14100,
        "booked_on": date(2026, 1, 2),
    },
    {
        "property_name": "City Studio",
        "check_in": date(2026, 1, 9),
        "check_out": date(2026, 1, 10),
        "price": 3900,
        "booked_on": date(2026, 1, 4),
    },
    {
        "property_name": "City Studio",
        "check_in": date(2026, 1, 20),
        "check_out": date(2026, 1, 23),
        "price": 4200,
        "booked_on": date(2026, 1, 5),
    },
    {
        "property_name": "Hill View Cottage",
        "check_in": date(2026, 1, 8),
        "check_out": date(2026, 1, 12),
        "price": 8200,
        "booked_on": date(2025, 12, 27),
    },
    {
        "property_name": "Hill View Cottage",
        "check_in": date(2026, 1, 18),
        "check_out": date(2026, 1, 21),
        "price": 7800,
        "booked_on": date(2026, 1, 3),
    },
    {
        "property_name": "Business Bay Suites",
        "check_in": date(2026, 1, 6),
        "check_out": date(2026, 1, 9),
        "price": 8800,
        "booked_on": date(2025, 12, 26),
    },
    {
        "property_name": "Business Bay Suites",
        "check_in": date(2026, 1, 16),
        "check_out": date(2026, 1, 18),
        "price": 7900,
        "booked_on": date(2026, 1, 6),
    },
]


DEMO_INSIGHTS = [
    {
        "question": "Which city is performing best in the demo workspace?",
        "answer": (
            "Goa is the strongest demo market because it has multiple properties "
            "with higher booking value and stronger leisure demand."
        ),
        "confidence": "high",
        "source": "demo_seed",
        "facts": [
            "Goa has both apartment and villa inventory in the demo data.",
            "Beach Villa has the highest demo booking value.",
        ],
        "is_pinned": False,
    },
    {
        "question": "What should I check after uploading my own CSV?",
        "answer": (
            "Start with data quality, then review revenue trend, occupancy, "
            "property performance, and pricing recommendations."
        ),
        "confidence": "high",
        "source": "demo_seed",
        "facts": [
            "Upload quality affects analytics reliability.",
            "Pricing recommendations depend on clean booking data.",
        ],
        "is_pinned": True,
    },
]


def get_or_create_demo_organization(session: Session) -> Organization:
    demo_user = get_existing_demo_user(session)

    # Reuse the demo user's existing organization if it was renamed.
    if demo_user:
        organization = session.get(Organization, demo_user.organization_id)

        if organization:
            organization.name = DEMO_ORG_NAME
            organization.email_domain = None
            session.add(organization)
            session.commit()
            session.refresh(organization)
            return organization

    organization = session.exec(
        select(Organization).where(Organization.name == DEMO_ORG_NAME)
    ).first()

    if organization:
        if organization.email_domain is not None:
            organization.email_domain = None
            session.add(organization)
            session.commit()
            session.refresh(organization)

        return organization

    organization = Organization(
        name=DEMO_ORG_NAME,
        email_domain=None,
    )
    session.add(organization)
    session.commit()
    session.refresh(organization)

    return organization


def get_or_create_demo_user(session: Session, organization_id: int) -> User:
    user = get_existing_demo_user(session)

    if user:
        user.organization_id = organization_id
        user.email = DEMO_EMAIL
        user.full_name = "Demo User"
        user.avatar_url = None
        user.role = ORG_ADMIN
        user.is_active = True
        user.is_platform_admin = False

        if not verify_password(DEMO_PASSWORD, user.hashed_password):
            user.hashed_password = hash_password(DEMO_PASSWORD)

        session.add(user)
        session.commit()
        session.refresh(user)

        return user

    user = User(
        organization_id=organization_id,
        email=DEMO_EMAIL,
        full_name="Demo User",
        hashed_password=hash_password(DEMO_PASSWORD),
        role=ORG_ADMIN,
        is_active=True,
        is_platform_admin=False,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def get_or_create_demo_properties(
    session: Session,
    organization_id: int,
) -> dict[str, Property]:
    property_map = {}

    for property_data in DEMO_PROPERTIES:
        existing_property = session.exec(
            select(Property).where(
                Property.organization_id == organization_id,
                Property.name == property_data["name"],
            )
        ).first()

        if existing_property:
            existing_property.city = property_data["city"]
            existing_property.property_type = property_data["property_type"]
            existing_property.base_price = property_data["base_price"]
            existing_property.bedrooms = property_data["bedrooms"]
            existing_property.accommodates = property_data["accommodates"]
            existing_property.photo_url = None
            existing_property.updated_at = utc_now()

            session.add(existing_property)
            session.commit()
            session.refresh(existing_property)

            property_map[existing_property.name] = existing_property
            continue

        property_obj = Property(
            organization_id=organization_id,
            **property_data,
        )

        session.add(property_obj)
        session.commit()
        session.refresh(property_obj)

        property_map[property_obj.name] = property_obj

    return property_map


def seed_demo_bookings_if_needed(
    session: Session,
    organization_id: int,
    property_map: dict[str, Property],
) -> None:
    property_ids = [
        property_obj.id
        for property_obj in property_map.values()
        if property_obj.id is not None
    ]

    if not property_ids:
        return

    existing_booking = session.exec(
        select(Booking).where(
            Booking.organization_id == organization_id,
            Booking.property_id.in_(property_ids),
        )
    ).first()

    if existing_booking:
        return

    bookings = []

    for booking_data in DEMO_BOOKINGS:
        property_obj = property_map[booking_data["property_name"]]

        if property_obj.id is None:
            continue

        booking = Booking(
            organization_id=organization_id,
            property_id=property_obj.id,
            check_in=booking_data["check_in"],
            check_out=booking_data["check_out"],
            price=booking_data["price"],
            booked_on=booking_data["booked_on"],
        )

        bookings.append(booking)

    session.add_all(bookings)
    session.commit()


def seed_demo_upload_job_if_needed(
    session: Session,
    organization_id: int,
    user_id: int | None,
) -> None:
    existing_job = session.exec(
        select(IngestionJob).where(
            IngestionJob.organization_id == organization_id,
            IngestionJob.filename == "averlen_demo_bookings.csv",
        )
    ).first()

    if existing_job:
        return

    job = IngestionJob(
        organization_id=organization_id,
        user_id=user_id,
        filename="averlen_demo_bookings.csv",
        status="completed",
        total_rows=len(DEMO_BOOKINGS),
        processed_rows=len(DEMO_BOOKINGS),
        failed_rows=0,
        skipped_rows=0,
        duplicate_rows=0,
        error_message=None,
        error_summary=None,
        completed_at=utc_now(),
    )

    session.add(job)
    session.commit()


def seed_demo_pricing_history_if_needed(
    session: Session,
    organization_id: int,
    user_id: int | None,
    property_map: dict[str, Property],
) -> None:
    for property_obj in property_map.values():
        if property_obj.id is None:
            continue

        existing_record = session.exec(
            select(PricingRecommendationHistory).where(
                PricingRecommendationHistory.organization_id == organization_id,
                PricingRecommendationHistory.property_id == property_obj.id,
            )
        ).first()

        if existing_record:
            continue

        recommended_price = round(property_obj.base_price * 1.08, 2)

        pricing_factors = [
            {
                "name": "Recent demand",
                "value": "Strong",
                "impact": "positive",
                "explanation": "Demo booking activity indicates healthy demand.",
            },
            {
                "name": "City benchmark",
                "value": property_obj.city,
                "impact": "positive",
                "explanation": "Demo city demand supports a moderate price increase.",
            },
        ]

        record = PricingRecommendationHistory(
            organization_id=organization_id,
            property_id=property_obj.id,
            created_by_user_id=user_id,
            current_base_price=property_obj.base_price,
            recommended_price=recommended_price,
            demand_score=74.0,
            confidence_score=82.0,
            adjustment_type="increase",
            reason="Demo data indicates room for a moderate pricing increase.",
            property_average_price=property_obj.base_price,
            city_average_price=round(property_obj.base_price * 1.04, 2),
            booking_volume=2,
            city_booking_volume=6,
            price_change_percent=8.0,
            risk_level="low",
            data_quality="strong",
            explanation_summary=(
                f"{property_obj.name} has healthy demo demand. "
                "A small increase can improve revenue without major risk."
            ),
            pricing_factors_json=json.dumps(pricing_factors),
            status="generated",
        )

        session.add(record)

    session.commit()


def seed_demo_ai_insights_if_needed(
    session: Session,
    organization_id: int,
    user_id: int | None,
) -> None:
    for item in DEMO_INSIGHTS:
        existing_record = session.exec(
            select(AIInsightHistory).where(
                AIInsightHistory.organization_id == organization_id,
                AIInsightHistory.question == item["question"],
            )
        ).first()

        if existing_record:
            continue

        record = AIInsightHistory(
            organization_id=organization_id,
            user_id=user_id,
            question=item["question"],
            answer=item["answer"],
            source=item["source"],
            confidence=item["confidence"],
            supporting_facts_json=json.dumps(item["facts"]),
            context_summary="Seeded demo workspace insight.",
            is_pinned=item["is_pinned"],
        )

        session.add(record)

    session.commit()


def seed_demo_notifications_if_needed(
    session: Session,
    organization_id: int,
    user_id: int | None,
) -> None:
    create_notification(
        session=session,
        organization_id=organization_id,
        user_id=user_id,
        actor_user_id=user_id,
        type=NOTIFICATION_TYPE_SYSTEM,
        priority=PRIORITY_INFO,
        title="Welcome to the Averlen demo",
        message=(
            "This workspace contains sample properties and bookings so you can "
            "understand how Averlen works before uploading your own CSV."
        ),
        entity_type="demo_workspace",
        entity_id=None,
        dedupe_key=f"demo:{organization_id}:welcome",
    )

    create_notification(
        session=session,
        organization_id=organization_id,
        user_id=user_id,
        actor_user_id=user_id,
        type=NOTIFICATION_TYPE_UPLOAD,
        priority=PRIORITY_SUCCESS,
        title="Demo bookings loaded",
        message="Sample booking rows are available for analytics and pricing previews.",
        entity_type="upload_job",
        entity_id=None,
        dedupe_key=f"demo:{organization_id}:upload_loaded",
    )

    create_notification(
        session=session,
        organization_id=organization_id,
        user_id=None,
        actor_user_id=user_id,
        type=NOTIFICATION_TYPE_PRICING,
        priority=PRIORITY_INFO,
        title="Demo pricing opportunities available",
        message="Open Pricing to review generated sample recommendations.",
        entity_type="pricing",
        entity_id=None,
        dedupe_key=f"demo:{organization_id}:pricing_available",
    )

    create_notification(
        session=session,
        organization_id=organization_id,
        user_id=user_id,
        actor_user_id=user_id,
        type=NOTIFICATION_TYPE_DATA_QUALITY,
        priority=PRIORITY_SUCCESS,
        title="Demo data quality looks good",
        message="The seeded demo booking data is clean and ready for exploration.",
        entity_type="data_quality",
        entity_id=None,
        dedupe_key=f"demo:{organization_id}:data_quality",
    )


def _demo_notification_keys(organization_id: int) -> set[str]:
    return {
        f"demo:{organization_id}:welcome",
        f"demo:{organization_id}:upload_loaded",
        f"demo:{organization_id}:pricing_available",
        f"demo:{organization_id}:data_quality",
    }


def _canonical_booking_counter() -> Counter[tuple]:
    return Counter(
        (
            item["property_name"],
            item["check_in"],
            item["check_out"],
            float(item["price"]),
            item["booked_on"],
        )
        for item in DEMO_BOOKINGS
    )


def demo_workspace_needs_repair(
    session: Session,
    organization_id: int,
    demo_user_id: int | None,
    property_map: dict[str, Property],
) -> bool:
    properties = session.exec(
        select(Property).where(Property.organization_id == organization_id)
    ).all()

    expected_properties = {item["name"]: item for item in DEMO_PROPERTIES}

    if len(properties) != len(expected_properties):
        return True

    for property_obj in properties:
        expected = expected_properties.get(property_obj.name)

        if not expected:
            return True

        if (
            property_obj.city != expected["city"]
            or property_obj.property_type != expected["property_type"]
            or float(property_obj.base_price) != float(expected["base_price"])
            or property_obj.bedrooms != expected["bedrooms"]
            or property_obj.accommodates != expected["accommodates"]
            or property_obj.photo_url is not None
        ):
            return True

    property_names_by_id = {
        property_obj.id: property_obj.name
        for property_obj in properties
        if property_obj.id is not None
    }

    bookings = session.exec(
        select(Booking).where(Booking.organization_id == organization_id)
    ).all()

    actual_bookings = Counter(
        (
            property_names_by_id.get(booking.property_id),
            booking.check_in,
            booking.check_out,
            float(booking.price),
            booking.booked_on,
        )
        for booking in bookings
    )

    if actual_bookings != _canonical_booking_counter():
        return True

    jobs = session.exec(
        select(IngestionJob).where(IngestionJob.organization_id == organization_id)
    ).all()

    if len(jobs) != 1:
        return True

    job = jobs[0]
    if (
        job.filename != "averlen_demo_bookings.csv"
        or job.status != "completed"
        or job.total_rows != len(DEMO_BOOKINGS)
        or job.processed_rows != len(DEMO_BOOKINGS)
        or job.failed_rows != 0
        or job.skipped_rows != 0
        or job.duplicate_rows != 0
    ):
        return True

    pricing_records = session.exec(
        select(PricingRecommendationHistory).where(
            PricingRecommendationHistory.organization_id == organization_id
        )
    ).all()

    if len(pricing_records) != len(property_map):
        return True

    pricing_property_ids = {record.property_id for record in pricing_records}
    expected_property_ids = {
        property_obj.id
        for property_obj in property_map.values()
        if property_obj.id is not None
    }

    if pricing_property_ids != expected_property_ids:
        return True

    if any(record.status != "generated" for record in pricing_records):
        return True

    insights = session.exec(
        select(AIInsightHistory).where(
            AIInsightHistory.organization_id == organization_id
        )
    ).all()
    expected_insights = {item["question"]: item for item in DEMO_INSIGHTS}

    if len(insights) != len(expected_insights):
        return True

    for insight in insights:
        expected = expected_insights.get(insight.question)
        if not expected:
            return True

        if (
            insight.source != expected["source"]
            or insight.confidence != expected["confidence"]
            or insight.is_pinned != expected["is_pinned"]
        ):
            return True

    notifications = session.exec(
        select(Notification).where(Notification.organization_id == organization_id)
    ).all()
    expected_notification_keys = _demo_notification_keys(organization_id)

    if len(notifications) != len(expected_notification_keys):
        return True

    if {item.dedupe_key for item in notifications} != expected_notification_keys:
        return True

    if any(item.is_read or item.read_at is not None for item in notifications):
        return True

    invites = session.exec(
        select(OrganizationInvite).where(
            OrganizationInvite.organization_id == organization_id
        )
    ).all()
    access_requests = session.exec(
        select(OrganizationAccessRequest).where(
            OrganizationAccessRequest.organization_id == organization_id
        )
    ).all()

    if invites or access_requests:
        return True

    users = session.exec(
        select(User).where(User.organization_id == organization_id)
    ).all()

    if any(user.id != demo_user_id for user in users):
        return True

    preferences = session.exec(
        select(NotificationPreference).where(
            NotificationPreference.organization_id == organization_id
        )
    ).all()

    for preference in preferences:
        if (
            preference.user_id != demo_user_id
            or not preference.upload_enabled
            or not preference.data_quality_enabled
            or not preference.pricing_enabled
            or not preference.workspace_enabled
            or not preference.ai_insight_enabled
            or not preference.system_enabled
        ):
            return True

    return False


def reset_demo_workspace_content(
    session: Session,
    organization_id: int,
    demo_user_id: int | None,
) -> None:
    # Delete dependants first for PostgreSQL and SQLite compatibility.
    cleanup_models = (
        OrganizationAccessRequest,
        OrganizationInvite,
        Notification,
        NotificationPreference,
        AIInsightHistory,
        PricingRecommendationHistory,
        IngestionError,
        IngestionJob,
        UploadSession,
        Booking,
    )

    for model in cleanup_models:
        rows = session.exec(
            select(model).where(model.organization_id == organization_id)
        ).all()
        for row in rows:
            session.delete(row)

    canonical_property_names = {item["name"] for item in DEMO_PROPERTIES}
    properties = session.exec(
        select(Property).where(Property.organization_id == organization_id)
    ).all()

    for property_obj in properties:
        if property_obj.name not in canonical_property_names:
            session.delete(property_obj)

    extra_users = session.exec(
        select(User).where(User.organization_id == organization_id)
    ).all()
    extra_user_ids = {
        user.id
        for user in extra_users
        if user.id is not None and user.id != demo_user_id
    }

    if extra_user_ids:
        refresh_tokens = session.exec(
            select(RefreshToken).where(
                RefreshToken.organization_id == organization_id,
                RefreshToken.user_id.in_(extra_user_ids),
            )
        ).all()

        for token in sorted(
            refresh_tokens,
            key=lambda item: item.id or 0,
            reverse=True,
        ):
            session.delete(token)

        session.flush()

        for user in extra_users:
            if user.id in extra_user_ids:
                session.delete(user)

    session.commit()


def ensure_demo_workspace(session: Session) -> User:
    organization = get_or_create_demo_organization(session)

    if organization.id is None:
        raise RuntimeError("Demo organization was not created")

    user = get_or_create_demo_user(session, organization.id)

    property_map = get_or_create_demo_properties(session, organization.id)

    if demo_workspace_needs_repair(
        session=session,
        organization_id=organization.id,
        demo_user_id=user.id,
        property_map=property_map,
    ):
        reset_demo_workspace_content(
            session=session,
            organization_id=organization.id,
            demo_user_id=user.id,
        )
        property_map = get_or_create_demo_properties(session, organization.id)

    seed_demo_bookings_if_needed(
        session=session,
        organization_id=organization.id,
        property_map=property_map,
    )

    seed_demo_upload_job_if_needed(
        session=session,
        organization_id=organization.id,
        user_id=user.id,
    )

    seed_demo_pricing_history_if_needed(
        session=session,
        organization_id=organization.id,
        user_id=user.id,
        property_map=property_map,
    )

    seed_demo_ai_insights_if_needed(
        session=session,
        organization_id=organization.id,
        user_id=user.id,
    )

    seed_demo_notifications_if_needed(
        session=session,
        organization_id=organization.id,
        user_id=user.id,
    )

    return user
