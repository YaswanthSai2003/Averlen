from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.api.deps import require_platform_admin
from app.db.database import get_session
from app.db.models import (
    AIInsightHistory,
    AuditLog,
    Booking,
    IngestionJob,
    Notification,
    Organization,
    PricingRecommendationHistory,
    Property,
    User,
)
from app.schemas.internal import (
    InternalOrganizationPageResponse,
    InternalOrganizationRead,
    InternalOverviewRead,
    InternalUsageRead,
    InternalUserPageResponse,
    InternalUserRead,
)


router = APIRouter(prefix="/internal", tags=["Internal platform"])


def _count(session: Session, statement) -> int:
    return int(session.exec(statement).one() or 0)


@router.get("/overview", response_model=InternalOverviewRead)
def get_internal_overview(
    session: Session = Depends(get_session),
    _: User = Depends(require_platform_admin),
):
    return InternalOverviewRead(
        organizations=_count(session, select(func.count(Organization.id))),
        users=_count(session, select(func.count(User.id))),
        active_users=_count(
            session,
            select(func.count(User.id)).where(User.is_active == True),  # noqa: E712
        ),
        properties=_count(session, select(func.count(Property.id))),
        bookings=_count(session, select(func.count(Booking.id))),
        import_jobs=_count(session, select(func.count(IngestionJob.id))),
        audit_events=_count(session, select(func.count(AuditLog.id))),
        error_events=_count(
            session,
            select(func.count(AuditLog.id)).where(AuditLog.status_code >= 400),
        ),
    )


@router.get(
    "/organizations/page",
    response_model=InternalOrganizationPageResponse,
)
def list_internal_organizations(
    session: Session = Depends(get_session),
    _: User = Depends(require_platform_admin),
    q: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    filters = []

    normalized_query = q.strip() if q else ""
    if normalized_query:
        pattern = f"%{normalized_query}%"
        filters.append(
            or_(
                Organization.name.ilike(pattern),
                Organization.email_domain.ilike(pattern),
            )
        )

    count_statement = select(func.count(Organization.id))
    list_statement = select(Organization)

    for condition in filters:
        count_statement = count_statement.where(condition)
        list_statement = list_statement.where(condition)

    total = _count(session, count_statement)
    organizations = session.exec(
        list_statement
        .order_by(Organization.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    items: list[InternalOrganizationRead] = []

    for organization in organizations:
        if organization.id is None:
            continue

        user_count = _count(
            session,
            select(func.count(User.id)).where(
                User.organization_id == organization.id
            ),
        )
        active_user_count = _count(
            session,
            select(func.count(User.id)).where(
                User.organization_id == organization.id,
                User.is_active == True,  # noqa: E712
            ),
        )
        property_count = _count(
            session,
            select(func.count(Property.id)).where(
                Property.organization_id == organization.id
            ),
        )
        booking_count = _count(
            session,
            select(func.count(Booking.id)).where(
                Booking.organization_id == organization.id
            ),
        )

        items.append(
            InternalOrganizationRead(
                id=organization.id,
                name=organization.name,
                email_domain=organization.email_domain,
                user_count=user_count,
                active_user_count=active_user_count,
                property_count=property_count,
                booking_count=booking_count,
                created_at=organization.created_at,
            )
        )

    return InternalOrganizationPageResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/users/page",
    response_model=InternalUserPageResponse,
)
def list_internal_users(
    session: Session = Depends(get_session),
    _: User = Depends(require_platform_admin),
    q: str | None = Query(default=None, max_length=120),
    organization_id: int | None = Query(default=None, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    count_statement = (
        select(func.count(User.id))
        .select_from(User)
        .join(Organization, Organization.id == User.organization_id)
    )
    list_statement = select(User, Organization).join(
        Organization,
        Organization.id == User.organization_id,
    )

    if organization_id is not None:
        count_statement = count_statement.where(
            User.organization_id == organization_id
        )
        list_statement = list_statement.where(
            User.organization_id == organization_id
        )

    normalized_query = q.strip() if q else ""
    if normalized_query:
        pattern = f"%{normalized_query}%"
        search_condition = or_(
            User.email.ilike(pattern),
            User.full_name.ilike(pattern),
            Organization.name.ilike(pattern),
        )
        count_statement = count_statement.where(search_condition)
        list_statement = list_statement.where(search_condition)

    total = _count(session, count_statement)
    rows = session.exec(
        list_statement
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    items = [
        InternalUserRead(
            id=user.id,
            organization_id=user.organization_id,
            organization_name=organization.name,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            is_platform_admin=user.is_platform_admin,
            created_at=user.created_at,
        )
        for user, organization in rows
        if user.id is not None
    ]

    return InternalUserPageResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/usage", response_model=InternalUsageRead)
def get_internal_usage(
    session: Session = Depends(get_session),
    _: User = Depends(require_platform_admin),
):
    return InternalUsageRead(
        organizations=_count(session, select(func.count(Organization.id))),
        users=_count(session, select(func.count(User.id))),
        active_users=_count(
            session,
            select(func.count(User.id)).where(User.is_active == True),  # noqa: E712
        ),
        properties=_count(session, select(func.count(Property.id))),
        bookings=_count(session, select(func.count(Booking.id))),
        import_jobs=_count(session, select(func.count(IngestionJob.id))),
        completed_import_jobs=_count(
            session,
            select(func.count(IngestionJob.id)).where(
                IngestionJob.status == "completed"
            ),
        ),
        failed_import_jobs=_count(
            session,
            select(func.count(IngestionJob.id)).where(
                IngestionJob.status == "failed"
            ),
        ),
        pricing_recommendations=_count(
            session,
            select(func.count(PricingRecommendationHistory.id)),
        ),
        ai_insights=_count(session, select(func.count(AIInsightHistory.id))),
        notifications=_count(session, select(func.count(Notification.id))),
    )
