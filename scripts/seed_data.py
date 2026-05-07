from datetime import date

from sqlmodel import Session, select

from app.db.database import engine
from app.db.models import Booking, Organization, Property

PROPERTY_SEED_DATA = [
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


BOOKING_SEED_DATA = [
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


def get_or_create_seed_organization(session: Session) -> Organization:
    organization = session.exec(
        select(Organization).where(Organization.name == "Demo Workspace")
    ).first()

    if organization:
        return organization

    organization = Organization(name="Demo Workspace")
    session.add(organization)
    session.commit()
    session.refresh(organization)

    print("Seeded demo organization.")
    return organization


def get_or_create_property(
    session: Session,
    organization_id: int,
    property_data: dict,
) -> Property:
    existing_property = session.exec(
        select(Property).where(
            Property.name == property_data["name"],
            Property.organization_id == organization_id,
        )
    ).first()

    if existing_property:
        return existing_property

    property_obj = Property(
        organization_id=organization_id,
        **property_data,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    return property_obj


def seed_properties(
    session: Session,
    organization_id: int,
) -> dict[str, Property]:
    property_map = {}

    for property_data in PROPERTY_SEED_DATA:
        property_obj = get_or_create_property(
            session=session,
            organization_id=organization_id,
            property_data=property_data,
        )
        property_map[property_obj.name] = property_obj

    print("Properties seeded or already available.")
    return property_map


def seed_bookings(session: Session, property_map: dict[str, Property]) -> None:
    existing_bookings = session.exec(select(Booking)).all()

    if existing_bookings:
        print("Bookings already exist. Skipping booking seed.")
        return

    bookings = []

    for booking_data in BOOKING_SEED_DATA:
        property_name = booking_data["property_name"]
        property_obj = property_map[property_name]

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

    print("Seeded bookings successfully.")


def main() -> None:
    with Session(engine) as session:
        organization = get_or_create_seed_organization(session)
        property_map = seed_properties(session, organization.id)
        seed_bookings(session, property_map)

    print("Seed data completed.")


if __name__ == "__main__":
    main()
