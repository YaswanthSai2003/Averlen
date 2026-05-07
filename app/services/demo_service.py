from datetime import date

from sqlmodel import Session, select

from app.core.security import hash_password
from app.db.models import Booking, Organization, Property, User

DEMO_EMAIL = "demo@pricepilot.app"
DEMO_PASSWORD = "Demo@12345"
DEMO_ORG_NAME = "PricePilot Demo Workspace"


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
]


DEMO_BOOKINGS = [
    {
        "property_name": "Sea View Apartment",
        "check_in": date(2025, 3, 1),
        "check_out": date(2025, 3, 5),
        "price": 5000,
        "booked_on": date(2025, 2, 20),
    },
    {
        "property_name": "Sea View Apartment",
        "check_in": date(2025, 3, 10),
        "check_out": date(2025, 3, 12),
        "price": 4500,
        "booked_on": date(2025, 2, 25),
    },
    {
        "property_name": "Beach Villa",
        "check_in": date(2025, 3, 2),
        "check_out": date(2025, 3, 6),
        "price": 6000,
        "booked_on": date(2025, 2, 22),
    },
    {
        "property_name": "Beach Villa",
        "check_in": date(2025, 3, 15),
        "check_out": date(2025, 3, 18),
        "price": 9500,
        "booked_on": date(2025, 3, 1),
    },
    {
        "property_name": "City Studio",
        "check_in": date(2025, 3, 5),
        "check_out": date(2025, 3, 7),
        "price": 7000,
        "booked_on": date(2025, 2, 28),
    },
    {
        "property_name": "Hill View Cottage",
        "check_in": date(2025, 3, 8),
        "check_out": date(2025, 3, 11),
        "price": 8000,
        "booked_on": date(2025, 3, 2),
    },
]


def get_or_create_demo_organization(session: Session) -> Organization:
    organization = session.exec(
        select(Organization).where(Organization.name == DEMO_ORG_NAME)
    ).first()

    if organization:
        return organization

    organization = Organization(name=DEMO_ORG_NAME)
    session.add(organization)
    session.commit()
    session.refresh(organization)

    return organization


def get_or_create_demo_user(session: Session, organization_id: int) -> User:
    user = session.exec(select(User).where(User.email == DEMO_EMAIL)).first()

    if user:
        return user

    user = User(
        organization_id=organization_id,
        email=DEMO_EMAIL,
        full_name="Demo User",
        hashed_password=hash_password(DEMO_PASSWORD),
        is_active=True,
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
    property_map: dict[str, Property],
) -> None:
    property_ids = [
        property_obj.id for property_obj in property_map.values() if property_obj.id
    ]

    if not property_ids:
        return

    existing_booking = session.exec(
        select(Booking).where(Booking.property_id.in_(property_ids))
    ).first()

    if existing_booking:
        return

    bookings = []

    for booking_data in DEMO_BOOKINGS:
        property_obj = property_map[booking_data["property_name"]]

        booking = Booking(
            property_id=property_obj.id,
            check_in=booking_data["check_in"],
            check_out=booking_data["check_out"],
            price=booking_data["price"],
            booked_on=booking_data["booked_on"],
        )

        bookings.append(booking)

    session.add_all(bookings)
    session.commit()


def ensure_demo_workspace(session: Session) -> User:
    organization = get_or_create_demo_organization(session)
    user = get_or_create_demo_user(session, organization.id)
    property_map = get_or_create_demo_properties(session, organization.id)
    seed_demo_bookings_if_needed(session, property_map)

    return user
