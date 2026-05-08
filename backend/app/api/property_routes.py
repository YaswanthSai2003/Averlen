from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.db.database import get_session
from app.db.models import Property, User
from app.schemas.property import PropertyCreate, PropertyRead, PropertyUpdate

router = APIRouter(
    prefix="/properties",
    tags=["Properties"],
)


def find_property_by_name(
    session: Session,
    organization_id: int,
    name: str,
) -> Property | None:
    return session.exec(
        select(Property).where(
            Property.organization_id == organization_id,
            Property.name == name,
        )
    ).first()


@router.post("", response_model=PropertyRead)
def create_property(
    property_data: PropertyCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    existing_property = find_property_by_name(
        session=session,
        organization_id=current_user.organization_id,
        name=property_data.name,
    )

    if existing_property:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property with this name already exists in your organization",
        )

    db_property = Property(
        organization_id=current_user.organization_id,
        **property_data.model_dump(),
    )

    session.add(db_property)
    session.commit()
    session.refresh(db_property)
    return db_property


@router.get("", response_model=list[PropertyRead])
def list_properties(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    statement = select(Property).where(
        Property.organization_id == current_user.organization_id
    )

    if city:
        statement = statement.where(Property.city == city)

    if property_type:
        statement = statement.where(Property.property_type == property_type)

    return session.exec(statement.offset(offset).limit(limit)).all()


@router.get("/{property_id}", response_model=PropertyRead)
def get_property(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    return property_obj


@router.put("/{property_id}", response_model=PropertyRead)
def update_property(
    property_id: int,
    property_data: PropertyUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    update_data = property_data.model_dump(exclude_unset=True)

    new_name = update_data.get("name")
    if new_name and new_name != property_obj.name:
        existing_property = find_property_by_name(
            session=session,
            organization_id=current_user.organization_id,
            name=new_name,
        )

        if existing_property:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Property with this name already exists in your organization",
            )

    for key, value in update_data.items():
        setattr(property_obj, key, value)

    property_obj.updated_at = datetime.now(timezone.utc)

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)
    return property_obj


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    property_obj = session.get(Property, property_id)

    if not property_obj or property_obj.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Property not found")

    session.delete(property_obj)
    session.commit()

    return {"message": f"Property with id {property_id} deleted successfully"}
