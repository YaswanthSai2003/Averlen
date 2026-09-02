from datetime import datetime, timezone
from enum import StrEnum

from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.db.models import IngestionJob, Notification, NotificationPreference, Property, User
from app.schemas.pricing import PricingRecommendation


class NotificationType(StrEnum):
    UPLOAD = "UPLOAD"
    DATA_QUALITY = "DATA_QUALITY"
    PRICING = "PRICING"
    SECURITY = "SECURITY"
    WORKSPACE = "WORKSPACE"
    AI_INSIGHT = "AI_INSIGHT"
    SYSTEM = "SYSTEM"


class NotificationPriority(StrEnum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"


NOTIFICATION_TYPE_UPLOAD = NotificationType.UPLOAD.value
NOTIFICATION_TYPE_DATA_QUALITY = NotificationType.DATA_QUALITY.value
NOTIFICATION_TYPE_PRICING = NotificationType.PRICING.value
NOTIFICATION_TYPE_SECURITY = NotificationType.SECURITY.value
NOTIFICATION_TYPE_WORKSPACE = NotificationType.WORKSPACE.value
NOTIFICATION_TYPE_AI_INSIGHT = NotificationType.AI_INSIGHT.value
NOTIFICATION_TYPE_SYSTEM = NotificationType.SYSTEM.value

PRIORITY_INFO = NotificationPriority.INFO.value
PRIORITY_SUCCESS = NotificationPriority.SUCCESS.value
PRIORITY_WARNING = NotificationPriority.WARNING.value
PRIORITY_ERROR = NotificationPriority.ERROR.value


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_notification_visibility_filter(current_user: User):
    return or_(
        Notification.user_id == current_user.id,
        Notification.user_id.is_(None),
    )


def get_or_create_notification_preferences(
    session: Session,
    current_user: User,
) -> NotificationPreference:
    if current_user.id is None:
        raise ValueError("User id is required")

    preferences = session.exec(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id,
        )
    ).first()

    if preferences:
        return preferences

    preferences = NotificationPreference(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
    )

    session.add(preferences)
    session.commit()
    session.refresh(preferences)

    return preferences


def preferences_allow_notification(
    session: Session,
    *,
    user_id: int | None,
    organization_id: int,
    type: str,
) -> bool:
    if type == NOTIFICATION_TYPE_SECURITY:
        return True

    if user_id is None:
        return True

    preferences = session.exec(
        select(NotificationPreference).where(
            NotificationPreference.user_id == user_id,
            NotificationPreference.organization_id == organization_id,
        )
    ).first()

    if not preferences:
        return True

    mapping = {
        NOTIFICATION_TYPE_UPLOAD: preferences.upload_enabled,
        NOTIFICATION_TYPE_DATA_QUALITY: preferences.data_quality_enabled,
        NOTIFICATION_TYPE_PRICING: preferences.pricing_enabled,
        NOTIFICATION_TYPE_WORKSPACE: preferences.workspace_enabled,
        NOTIFICATION_TYPE_AI_INSIGHT: preferences.ai_insight_enabled,
        NOTIFICATION_TYPE_SYSTEM: preferences.system_enabled,
    }

    return mapping.get(type, True)


def get_unread_count(session: Session, current_user: User) -> int:
    return session.exec(
        select(func.count(Notification.id)).where(
            Notification.organization_id == current_user.organization_id,
            get_notification_visibility_filter(current_user),
            Notification.is_read == False,  # noqa: E712
        )
    ).one()


def create_notification(
    session: Session,
    *,
    organization_id: int,
    type: str,
    priority: str,
    title: str,
    message: str,
    user_id: int | None = None,
    actor_user_id: int | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    dedupe_key: str | None = None,
    commit: bool = True,
) -> Notification | None:
    if not preferences_allow_notification(
        session=session,
        user_id=user_id,
        organization_id=organization_id,
        type=type,
    ):
        return None

    if dedupe_key:
        existing = session.exec(
            select(Notification).where(
                Notification.organization_id == organization_id,
                Notification.dedupe_key == dedupe_key,
            )
        ).first()

        if existing:
            return existing

    notification = Notification(
        organization_id=organization_id,
        user_id=user_id,
        actor_user_id=actor_user_id,
        type=type,
        priority=priority,
        title=title.strip(),
        message=message.strip(),
        entity_type=entity_type,
        entity_id=entity_id,
        dedupe_key=dedupe_key,
    )

    session.add(notification)

    if commit:
        session.commit()
        session.refresh(notification)

    return notification


def notify_upload_finished(
    session: Session,
    job: IngestionJob,
) -> None:
    if job.id is None:
        return

    if job.failed_rows > 0 or job.duplicate_rows > 0 or job.skipped_rows > 0:
        create_notification(
            session=session,
            organization_id=job.organization_id,
            user_id=job.user_id,
            actor_user_id=job.user_id,
            type=NOTIFICATION_TYPE_DATA_QUALITY,
            priority=PRIORITY_WARNING,
            title="Upload completed with issues",
            message=(
                f"{job.filename} processed {job.processed_rows} row(s), "
                f"with {job.failed_rows} failed row(s), "
                f"{job.duplicate_rows} duplicate row(s), "
                f"and {job.skipped_rows} skipped row(s)."
            ),
            entity_type="upload_job",
            entity_id=job.id,
            dedupe_key=f"upload_job:{job.id}:completed_with_issues",
        )
        return

    create_notification(
        session=session,
        organization_id=job.organization_id,
        user_id=job.user_id,
        actor_user_id=job.user_id,
        type=NOTIFICATION_TYPE_UPLOAD,
        priority=PRIORITY_SUCCESS,
        title="Upload completed",
        message=f"{job.filename} processed successfully with {job.processed_rows} row(s).",
        entity_type="upload_job",
        entity_id=job.id,
        dedupe_key=f"upload_job:{job.id}:completed",
    )


def notify_upload_failed(
    session: Session,
    job: IngestionJob,
) -> None:
    if job.id is None:
        return

    create_notification(
        session=session,
        organization_id=job.organization_id,
        user_id=job.user_id,
        actor_user_id=job.user_id,
        type=NOTIFICATION_TYPE_UPLOAD,
        priority=PRIORITY_ERROR,
        title="Upload failed",
        message=job.error_message or f"{job.filename} could not be processed.",
        entity_type="upload_job",
        entity_id=job.id,
        dedupe_key=f"upload_job:{job.id}:failed",
    )


def notify_pricing_opportunity(
    session: Session,
    *,
    current_user: User,
    property_obj: Property,
    recommendation: PricingRecommendation,
) -> None:
    if property_obj.id is None:
        return

    if recommendation.adjustment_type == "keep":
        return

    if abs(recommendation.price_change_percent) < 5:
        return

    action = recommendation.adjustment_type.lower()

    if action == "increase":
        title = "Pricing increase opportunity"
        priority = PRIORITY_INFO
    elif action == "decrease":
        title = "Pricing decrease recommended"
        priority = PRIORITY_WARNING
    else:
        return

    create_notification(
        session=session,
        organization_id=current_user.organization_id,
        user_id=None,
        actor_user_id=current_user.id,
        type=NOTIFICATION_TYPE_PRICING,
        priority=priority,
        title=title,
        message=(
            f"{property_obj.name} has a {recommendation.price_change_percent}% "
            f"{action} recommendation. Current base price: "
            f"{recommendation.current_base_price}, recommended price: "
            f"{recommendation.recommended_price}."
        ),
        entity_type="property",
        entity_id=property_obj.id,
        dedupe_key=(
            f"pricing:{property_obj.id}:"
            f"{recommendation.adjustment_type}:"
            f"{recommendation.current_base_price}:"
            f"{recommendation.recommended_price}"
        ),
    )


def notify_security_event(
    session: Session,
    *,
    current_user: User,
    title: str,
    message: str,
    priority: str = PRIORITY_INFO,
    entity_type: str | None = None,
    entity_id: int | None = None,
    dedupe_key: str | None = None,
) -> None:
    create_notification(
        session=session,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        actor_user_id=current_user.id,
        type=NOTIFICATION_TYPE_SECURITY,
        priority=priority,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        dedupe_key=dedupe_key,
    )


def notify_workspace_event(
    session: Session,
    *,
    current_user: User,
    title: str,
    message: str,
    priority: str = PRIORITY_INFO,
    entity_type: str | None = None,
    entity_id: int | None = None,
    dedupe_key: str | None = None,
) -> None:
    create_notification(
        session=session,
        organization_id=current_user.organization_id,
        user_id=None,
        actor_user_id=current_user.id,
        type=NOTIFICATION_TYPE_WORKSPACE,
        priority=priority,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        dedupe_key=dedupe_key,
    )