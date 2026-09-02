from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.deps import get_current_user, require_writable_user
from app.db.database import get_session
from app.db.models import Notification, User
from app.schemas.notification import (
    NotificationActionResponse,
    NotificationListResponse,
    NotificationPreferenceRead,
    NotificationPreferenceUpdate,
    NotificationRead,
    NotificationUnreadCountResponse,
)
from app.services.notification_service import (
    get_notification_visibility_filter,
    get_or_create_notification_preferences,
    get_unread_count,
    utc_now,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def build_notification_read(notification: Notification) -> NotificationRead:
    return NotificationRead(
        id=notification.id,
        organization_id=notification.organization_id,
        user_id=notification.user_id,
        actor_user_id=notification.actor_user_id,
        type=notification.type,
        priority=notification.priority,
        title=notification.title,
        message=notification.message,
        entity_type=notification.entity_type,
        entity_id=notification.entity_id,
        is_read=notification.is_read,
        read_at=notification.read_at,
        created_at=notification.created_at,
    )


def get_accessible_notification_or_404(
    session: Session,
    notification_id: int,
    current_user: User,
) -> Notification:
    notification = session.get(Notification, notification_id)

    if (
        not notification
        or notification.organization_id != current_user.organization_id
        or (
            notification.user_id is not None
            and notification.user_id != current_user.id
        )
    ):
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    include_read: bool = Query(default=True),
    notification_type: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    filters = [
        Notification.organization_id == current_user.organization_id,
        get_notification_visibility_filter(current_user),
    ]

    if not include_read:
        filters.append(Notification.is_read == False)  # noqa: E712

    if notification_type:
        filters.append(Notification.type == notification_type.upper())

    total = session.exec(
        select(func.count(Notification.id)).where(*filters)
    ).one()

    notifications = session.exec(
        select(Notification)
        .where(*filters)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return NotificationListResponse(
        items=[
            build_notification_read(notification)
            for notification in notifications
            if notification.id is not None
        ],
        total=total,
        unread_count=get_unread_count(session, current_user),
        limit=limit,
        offset=offset,
    )


@router.get("/unread-count", response_model=NotificationUnreadCountResponse)
def get_notifications_unread_count(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return NotificationUnreadCountResponse(
        unread_count=get_unread_count(session, current_user)
    )


@router.get("/preferences", response_model=NotificationPreferenceRead)
def get_notification_preferences(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    preferences = get_or_create_notification_preferences(session, current_user)

    return NotificationPreferenceRead(
        upload_enabled=preferences.upload_enabled,
        data_quality_enabled=preferences.data_quality_enabled,
        pricing_enabled=preferences.pricing_enabled,
        workspace_enabled=preferences.workspace_enabled,
        ai_insight_enabled=preferences.ai_insight_enabled,
        system_enabled=preferences.system_enabled,
        security_enabled=True,
    )


@router.patch("/preferences", response_model=NotificationPreferenceRead)
def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    preferences = get_or_create_notification_preferences(session, current_user)
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            setattr(preferences, field, value)

    preferences.updated_at = utc_now()

    session.add(preferences)
    session.commit()
    session.refresh(preferences)

    return NotificationPreferenceRead(
        upload_enabled=preferences.upload_enabled,
        data_quality_enabled=preferences.data_quality_enabled,
        pricing_enabled=preferences.pricing_enabled,
        workspace_enabled=preferences.workspace_enabled,
        ai_insight_enabled=preferences.ai_insight_enabled,
        system_enabled=preferences.system_enabled,
        security_enabled=True,
    )


@router.patch("/read-all", response_model=NotificationActionResponse)
def mark_all_notifications_read(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    notifications = session.exec(
        select(Notification).where(
            Notification.organization_id == current_user.organization_id,
            get_notification_visibility_filter(current_user),
            Notification.is_read == False,  # noqa: E712
        )
    ).all()

    now = datetime.now(timezone.utc)

    for notification in notifications:
        notification.is_read = True
        notification.read_at = now
        session.add(notification)

    session.commit()

    return NotificationActionResponse(message="All notifications marked as read")


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    notification = get_accessible_notification_or_404(
        session=session,
        notification_id=notification_id,
        current_user=current_user,
    )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)

        session.add(notification)
        session.commit()
        session.refresh(notification)

    return build_notification_read(notification)


@router.delete("/{notification_id}", response_model=NotificationActionResponse)
def delete_notification(
    notification_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    notification = get_accessible_notification_or_404(
        session=session,
        notification_id=notification_id,
        current_user=current_user,
    )

    session.delete(notification)
    session.commit()

    return NotificationActionResponse(message="Notification deleted")