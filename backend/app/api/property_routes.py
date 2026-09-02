from collections import defaultdict
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import and_, func
from sqlmodel import Session, select

from app.api.deps import get_current_user, require_writable_manager
from app.core.config import settings
from app.db.database import get_session
from app.db.models import Booking, Property, User
from app.schemas.property import (
    PropertyCreate,
    PropertyListResponse,
    PropertyRead,
    PropertySummary,
    PropertySummaryListResponse,
    PropertyUpdate,
)
from app.services.media_storage_service import (
    MediaStorageError,
    delete_public_image,
    store_public_image,
)
from app.services.scope_service import get_org_property_or_404


router = APIRouter(
    prefix="/properties",
    tags=["Properties"],
)


PropertySortField = Literal[
    "name",
    "city",
    "base_price",
    "revenue",
    "bookings",
    "adr",
]

SortOrder = Literal[
    "asc",
    "desc",
]


ALLOWED_PROPERTY_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_PROPERTY_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def detect_image_extension(
    file_content: bytes,
) -> str | None:
    if file_content.startswith(
        b"\xff\xd8\xff"
    ):
        return ".jpg"

    if file_content.startswith(
        b"\x89PNG\r\n\x1a\n"
    ):
        return ".png"

    if (
        len(file_content) >= 12
        and file_content[:4] == b"RIFF"
        and file_content[8:12] == b"WEBP"
    ):
        return ".webp"

    return None


def find_property_by_name(
    session: Session,
    organization_id: int,
    name: str,
) -> Property | None:
    return session.exec(
        select(Property).where(
            Property.organization_id
            == organization_id,
            Property.name == name,
        )
    ).first()


def calculate_booked_nights(
    booking: Booking,
) -> int:
    return max(
        (
            booking.check_out
            - booking.check_in
        ).days,
        0,
    )


def safe_divide(
    numerator: float,
    denominator: float,
) -> float:
    if denominator == 0:
        return 0.0

    return round(
        numerator / denominator,
        2,
    )


def save_property_photo(
    file: UploadFile,
) -> str:
    if (
        file.content_type
        not in ALLOWED_PROPERTY_IMAGE_TYPES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only JPG, PNG, and WEBP "
                "images are supported"
            ),
        )

    file_content = file.file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is empty",
        )

    if (
        len(file_content)
        > MAX_PROPERTY_IMAGE_SIZE_BYTES
    ):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                "Property photo must be "
                "5MB or smaller"
            ),
        )

    detected_extension = (
        detect_image_extension(
            file_content,
        )
    )

    expected_extension = (
        ALLOWED_PROPERTY_IMAGE_TYPES[
            file.content_type
        ]
    )

    if (
        detected_extension
        != expected_extension
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image content",
        )

    try:
        return store_public_image(
            file_content,
            extension=detected_extension,
            local_directory=(
                settings.public_upload_dir
            ),
            local_url_prefix=(
                "/uploads/property_photos"
            ),
            cloudinary_subfolder=(
                "property_photos"
            ),
        )
    except MediaStorageError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "Property photo storage is "
                "temporarily unavailable"
            ),
        ) from exc


def apply_property_filters(
    statement,
    city: Optional[str],
    property_type: Optional[str],
):
    if city:
        statement = statement.where(
            Property.city == city
        )

    if property_type:
        statement = statement.where(
            Property.property_type
            == property_type
        )

    return statement


def build_property_statement(
    organization_id: int,
    city: Optional[str] = None,
    property_type: Optional[str] = None,
):
    statement = select(
        Property
    ).where(
        Property.organization_id
        == organization_id
    )

    statement = apply_property_filters(
        statement,
        city,
        property_type,
    )

    return statement.order_by(
        func.lower(
            Property.name
        ).asc(),
        Property.id.asc(),
    )


def build_property_count_statement(
    organization_id: int,
    city: Optional[str] = None,
    property_type: Optional[str] = None,
):
    statement = select(
        func.count(
            Property.id
        )
    ).where(
        Property.organization_id
        == organization_id
    )

    return apply_property_filters(
        statement,
        city,
        property_type,
    )


def build_property_summary_statement(
    organization_id: int,
    city: Optional[str],
    property_type: Optional[str],
    sort_by: PropertySortField,
    sort_order: SortOrder,
):
    total_revenue = func.coalesce(
        func.sum(
            Booking.price
        ),
        0.0,
    )

    total_bookings = func.count(
        Booking.id
    )

    adr = func.coalesce(
        total_revenue
        / func.nullif(
            total_bookings,
            0,
        ),
        0.0,
    )

    statement = (
        select(Property)
        .outerjoin(
            Booking,
            and_(
                Booking.property_id
                == Property.id,
                Booking.organization_id
                == organization_id,
            ),
        )
        .where(
            Property.organization_id
            == organization_id
        )
    )

    statement = apply_property_filters(
        statement,
        city,
        property_type,
    )

    sort_expressions = {
        "name": func.lower(
            Property.name
        ),
        "city": func.lower(
            Property.city
        ),
        "base_price": Property.base_price,
        "revenue": total_revenue,
        "bookings": total_bookings,
        "adr": adr,
    }

    sort_expression = (
        sort_expressions[
            sort_by
        ]
    )

    if sort_order == "desc":
        primary_order = (
            sort_expression.desc()
        )
    else:
        primary_order = (
            sort_expression.asc()
        )

    return (
        statement
        .group_by(
            Property.id
        )
        .order_by(
            primary_order,

            func.lower(
                Property.name
            ).asc(),

            Property.id.asc(),
        )
    )


def build_property_summaries(
    session: Session,
    organization_id: int,
    properties: list[Property],
) -> list[PropertySummary]:
    property_ids = [
        property_obj.id
        for property_obj in properties
        if property_obj.id is not None
    ]

    if not property_ids:
        return []

    bookings = session.exec(
        select(Booking).where(
            Booking.organization_id
            == organization_id,
            Booking.property_id.in_(
                property_ids
            ),
        )
    ).all()

    booking_map = defaultdict(
        list
    )

    for booking in bookings:
        booking_map[
            booking.property_id
        ].append(
            booking
        )

    summaries = []

    for property_obj in properties:
        if property_obj.id is None:
            continue

        property_bookings = (
            booking_map[
                property_obj.id
            ]
        )

        total_revenue = sum(
            booking.price
            for booking
            in property_bookings
        )

        total_bookings = len(
            property_bookings
        )

        total_booked_nights = sum(
            calculate_booked_nights(
                booking
            )
            for booking
            in property_bookings
        )

        summaries.append(
            PropertySummary(
                property_id=(
                    property_obj.id
                ),
                name=(
                    property_obj.name
                ),
                city=(
                    property_obj.city
                ),
                property_type=(
                    property_obj
                    .property_type
                ),
                base_price=(
                    property_obj
                    .base_price
                ),
                bedrooms=(
                    property_obj
                    .bedrooms
                ),
                accommodates=(
                    property_obj
                    .accommodates
                ),
                photo_url=(
                    property_obj
                    .photo_url
                ),
                total_revenue=round(
                    total_revenue,
                    2,
                ),
                total_bookings=(
                    total_bookings
                ),
                total_booked_nights=(
                    total_booked_nights
                ),
                adr=safe_divide(
                    total_revenue,
                    total_bookings,
                ),
                revenue_per_booked_night=(
                    safe_divide(
                        total_revenue,
                        total_booked_nights,
                    )
                ),
                average_length_of_stay=(
                    safe_divide(
                        total_booked_nights,
                        total_bookings,
                    )
                ),
            )
        )

    return summaries


@router.post(
    "",
    response_model=PropertyRead,
)
def create_property(
    property_data: PropertyCreate,
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        require_writable_manager
    ),
):
    existing_property = (
        find_property_by_name(
            session=session,
            organization_id=(
                current_user.organization_id
            ),
            name=property_data.name,
        )
    )

    if existing_property:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Property with this name "
                "already exists in your "
                "organization"
            ),
        )

    db_property = Property(
        organization_id=(
            current_user.organization_id
        ),
        **property_data.model_dump(),
    )

    session.add(
        db_property
    )
    session.commit()
    session.refresh(
        db_property
    )

    return db_property


@router.get(
    "",
    response_model=list[
        PropertyRead
    ],
)
def list_properties(
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        get_current_user
    ),
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):
    statement = (
        build_property_statement(
            organization_id=(
                current_user.organization_id
            ),
            city=city,
            property_type=(
                property_type
            ),
        )
    )

    return session.exec(
        statement
        .offset(offset)
        .limit(limit)
    ).all()


@router.get(
    "/page",
    response_model=(
        PropertyListResponse
    ),
)
def list_properties_page(
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        get_current_user
    ),
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):
    total = session.exec(
        build_property_count_statement(
            organization_id=(
                current_user.organization_id
            ),
            city=city,
            property_type=(
                property_type
            ),
        )
    ).one()

    statement = (
        build_property_statement(
            organization_id=(
                current_user.organization_id
            ),
            city=city,
            property_type=(
                property_type
            ),
        )
    )

    items = session.exec(
        statement
        .offset(offset)
        .limit(limit)
    ).all()

    return PropertyListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    response_model=list[
        PropertySummary
    ],
)
def list_property_summaries(
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        get_current_user
    ),
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    sort_by: PropertySortField = Query(
        default="name"
    ),
    sort_order: SortOrder = Query(
        default="asc"
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):
    statement = (
        build_property_summary_statement(
            organization_id=(
                current_user.organization_id
            ),
            city=city,
            property_type=(
                property_type
            ),
            sort_by=sort_by,
            sort_order=sort_order,
        )
    )

    properties = session.exec(
        statement
        .offset(offset)
        .limit(limit)
    ).all()

    return build_property_summaries(
        session,
        current_user.organization_id,
        properties,
    )


@router.get(
    "/summary/page",
    response_model=(
        PropertySummaryListResponse
    ),
)
def list_property_summaries_page(
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        get_current_user
    ),
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    sort_by: PropertySortField = Query(
        default="name"
    ),
    sort_order: SortOrder = Query(
        default="asc"
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):
    total = session.exec(
        build_property_count_statement(
            organization_id=(
                current_user.organization_id
            ),
            city=city,
            property_type=(
                property_type
            ),
        )
    ).one()

    statement = (
        build_property_summary_statement(
            organization_id=(
                current_user.organization_id
            ),
            city=city,
            property_type=(
                property_type
            ),
            sort_by=sort_by,
            sort_order=sort_order,
        )
    )

    properties = session.exec(
        statement
        .offset(offset)
        .limit(limit)
    ).all()

    items = build_property_summaries(
        session,
        current_user.organization_id,
        properties,
    )

    return (
        PropertySummaryListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )
    )


@router.get(
    "/summary/{property_id}",
    response_model=PropertySummary,
)
def get_property_summary(
    property_id: int,
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    property_obj = (
        get_org_property_or_404(
            session=session,
            property_id=property_id,
            organization_id=(
                current_user.organization_id
            ),
        )
    )

    summaries = (
        build_property_summaries(
            session=session,
            organization_id=(
                current_user.organization_id
            ),
            properties=[
                property_obj
            ],
        )
    )

    return summaries[0]

@router.get(
    "/{property_id}",
    response_model=PropertyRead,
)
def get_property(
    property_id: int,
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_org_property_or_404(
        session=session,
        property_id=property_id,
        organization_id=(
            current_user.organization_id
        ),
    )


@router.put(
    "/{property_id}",
    response_model=PropertyRead,
)
def update_property(
    property_id: int,
    property_data: PropertyUpdate,
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        require_writable_manager
    ),
):
    property_obj = (
        get_org_property_or_404(
            session=session,
            property_id=property_id,
            organization_id=(
                current_user.organization_id
            ),
        )
    )

    update_data = (
        property_data.model_dump(
            exclude_unset=True
        )
    )

    new_name = (
        update_data.get(
            "name"
        )
    )

    if (
        new_name
        and new_name
        != property_obj.name
    ):
        existing_property = (
            find_property_by_name(
                session=session,
                organization_id=(
                    current_user
                    .organization_id
                ),
                name=new_name,
            )
        )

        if existing_property:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Property with this "
                    "name already exists "
                    "in your organization"
                ),
            )

    for key, value in (
        update_data.items()
    ):
        setattr(
            property_obj,
            key,
            value,
        )

    property_obj.updated_at = (
        datetime.now(
            timezone.utc
        )
    )

    session.add(
        property_obj
    )
    session.commit()
    session.refresh(
        property_obj
    )

    return property_obj


@router.post(
    "/{property_id}/photo",
    response_model=PropertyRead,
)
def upload_property_photo(
    property_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(
        get_session
    ),
    current_user: User = Depends(
        require_writable_manager
    ),
):
    property_obj = (
        get_org_property_or_404(
            session=session,
            property_id=property_id,
            organization_id=(
                current_user.organization_id
            ),
        )
    )

    old_photo_url = (
        property_obj.photo_url
    )

    photo_url = (
        save_property_photo(
            file
        )
    )

    property_obj.photo_url = (
        photo_url
    )

    property_obj.updated_at = (
        datetime.now(
            timezone.utc
        )
    )

    session.add(
        property_obj
    )
    session.commit()
    session.refresh(
        property_obj
    )

    delete_public_image(
        old_photo_url,
        local_directory=(
            settings.public_upload_dir
        ),
        local_url_prefix=(
            "/uploads/property_photos"
        ),
    )

    return property_obj


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_manager),
):
    property_obj = get_org_property_or_404(
        session=session,
        property_id=property_id,
        organization_id=current_user.organization_id,
    )

    existing_booking = session.exec(
        select(Booking.id)
        .where(
            Booking.organization_id
            == current_user.organization_id,
            Booking.property_id
            == property_id,
        )
        .limit(1)
    ).first()

    if existing_booking is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Property cannot be deleted because "
                "booking history exist for it"
            ),
        )

    old_photo_url = property_obj.photo_url

    session.delete(property_obj)
    session.commit()

    delete_public_image(
        old_photo_url,
        local_directory=(
            settings.public_upload_dir
        ),
        local_url_prefix=(
            "/uploads/property_photos"
        ),
    )

    return {
        "message": "Property deleted"
    }
