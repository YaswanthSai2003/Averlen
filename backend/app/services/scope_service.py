from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlmodel import Session, select

from app.core.roles import MANAGER_ROLES, ORG_ADMIN
from app.db.models import Booking, IngestionJob, Property, User


def require_org_admin_user(current_user: User) -> User:
    if current_user.role != ORG_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin access required",
        )

    return current_user


def require_manager_user(current_user: User) -> User:
    if current_user.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required",
        )

    return current_user


def get_org_property_or_404(
    session: Session,
    property_id: int,
    organization_id: int,
) -> Property:
    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    return property_obj


def get_org_properties_statement(
    organization_id: int,
    city: str | None = None,
    property_type: str | None = None,
):
    statement = select(Property).where(Property.organization_id == organization_id)

    if city:
        statement = statement.where(Property.city == city)

    if property_type:
        statement = statement.where(Property.property_type == property_type)

    return statement


def get_org_property_ids(
    session: Session,
    organization_id: int,
) -> list[int]:
    properties = session.exec(
        select(Property.id).where(Property.organization_id == organization_id)
    ).all()

    return [property_id for property_id in properties if property_id is not None]


def get_org_bookings_statement(
    session: Session,
    organization_id: int,
):
    property_ids = get_org_property_ids(session, organization_id)

    if not property_ids:
        return select(Booking).where(Booking.id == -1)

    return select(Booking).where(
        or_(
            Booking.organization_id == organization_id,
            Booking.property_id.in_(property_ids),
        )
    )


def get_org_upload_jobs_statement(
    organization_id: int,
):
    return select(IngestionJob).where(IngestionJob.organization_id == organization_id)