from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.deps import require_org_admin, require_writable_org_admin
from app.core.roles import ORG_ADMIN, is_valid_role
from app.db.database import get_session
from app.db.models import OrganizationAccessRequest, OrganizationInvite, User
from app.schemas.access_request import (
    AccessRequestAdminRead,
    AccessRequestApprovalResponse,
    AccessRequestApprove,
    AccessRequestCreate,
    AccessRequestListResponse,
    AccessRequestPublicRead,
    WorkspaceDiscoveryRead,
)
from app.schemas.invite import InviteCreate, InviteCreateResponse, InviteRead
from app.services.invite_service import (
    create_invite,
    get_valid_invite_by_token,
    normalize_email,
    regenerate_invite_token,
)
from app.services.notification_service import (
    NOTIFICATION_TYPE_WORKSPACE,
    PRIORITY_INFO,
    PRIORITY_SUCCESS,
    PRIORITY_WARNING,
    create_notification,
    notify_workspace_event,
)
from app.services.organization_service import (
    find_organization_by_email_domain,
    get_joinable_email_domain,
)


invites_router = APIRouter(prefix="/invites", tags=["Invites"])
access_requests_router = APIRouter(
    prefix="/access-requests",
    tags=["Workspace access requests"],
)
router = APIRouter()


def build_access_request_admin_read(
    request_obj: OrganizationAccessRequest,
) -> AccessRequestAdminRead:
    return AccessRequestAdminRead(
        id=request_obj.id,
        organization_id=request_obj.organization_id,
        email=request_obj.email,
        full_name=request_obj.full_name,
        status=request_obj.status,
        reviewed_by_user_id=request_obj.reviewed_by_user_id,
        reviewed_at=request_obj.reviewed_at,
        approved_role=request_obj.approved_role,
        invite_id=request_obj.invite_id,
        created_at=request_obj.created_at,
    )


def get_access_request_or_404(
    session: Session,
    *,
    request_id: int,
    organization_id: int,
) -> OrganizationAccessRequest:
    request_obj = session.get(OrganizationAccessRequest, request_id)

    if not request_obj or request_obj.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="Access request not found")

    return request_obj


def notify_org_admins_of_access_request(
    session: Session,
    request_obj: OrganizationAccessRequest,
) -> None:
    admins = session.exec(
        select(User).where(
            User.organization_id == request_obj.organization_id,
            User.role == ORG_ADMIN,
            User.is_active == True,  # noqa: E712
        )
    ).all()

    for admin in admins:
        if admin.id is None:
            continue

        create_notification(
            session=session,
            organization_id=request_obj.organization_id,
            user_id=admin.id,
            actor_user_id=None,
            type=NOTIFICATION_TYPE_WORKSPACE,
            priority=PRIORITY_INFO,
            title="Workspace access requested",
            message=(
                f"{request_obj.full_name or request_obj.email} requested access "
                "to your Averlen workspace."
            ),
            entity_type="access_request",
            entity_id=request_obj.id,
            dedupe_key=f"access_request:{request_obj.id}:admin:{admin.id}",
        )


@invites_router.post("", response_model=InviteCreateResponse)
def create_organization_invite(
    payload: InviteCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    if current_user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    existing_user = session.exec(
        select(User).where(User.email == normalize_email(payload.email))
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    invite, invite_token = create_invite(
        session=session,
        organization_id=current_user.organization_id,
        invited_by_user_id=current_user.id,
        email=payload.email,
        role=payload.role,
    )

    notify_workspace_event(
        session=session,
        current_user=current_user,
        title="Invite sent",
        message=f"An invitation was sent to {invite.email} as {invite.role}.",
        priority=PRIORITY_INFO,
        entity_type="invite",
        entity_id=invite.id,
        dedupe_key=f"invite_sent:{invite.id}",
    )

    invite_url = f"/register?invite_token={invite_token}"

    return InviteCreateResponse(
        invite=invite,
        invite_token=invite_token,
        invite_url=invite_url,
    )


@invites_router.get("", response_model=list[InviteRead])
def list_organization_invites(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_org_admin),
    status_filter: str | None = Query(default=None),
):
    statement = select(OrganizationInvite).where(
        OrganizationInvite.organization_id == current_user.organization_id
    )

    if status_filter:
        statement = statement.where(OrganizationInvite.status == status_filter)

    statement = statement.order_by(OrganizationInvite.created_at.desc())

    return session.exec(statement).all()


@invites_router.patch(
    "/{invite_id}/regenerate",
    response_model=InviteCreateResponse,
)
def regenerate_invitation_link(
    invite_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    invite = session.get(
        OrganizationInvite,
        invite_id,
    )

    if (
        not invite
        or invite.organization_id
        != current_user.organization_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Invite not found",
        )

    if invite.status not in {
        "pending",
        "expired",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only pending or expired invitations "
                "can receive a new link"
            ),
        )

    invite, invite_token = (
        regenerate_invite_token(
            session=session,
            invite=invite,
        )
    )

    notify_workspace_event(
        session=session,
        current_user=current_user,
        title="Invitation link regenerated",
        message=(
            f"A new invitation link was generated "
            f"for {invite.email}."
        ),
        priority=PRIORITY_INFO,
        entity_type="invite",
        entity_id=invite.id,
    )

    return InviteCreateResponse(
        invite=invite,
        invite_token=invite_token,
        invite_url=(
            "/register?invite_token="
            f"{invite_token}"
        ),
    )


@invites_router.get("/validate", response_model=InviteRead)
def validate_invite_token(
    invite_token: str,
    session: Session = Depends(get_session),
):
    return get_valid_invite_by_token(session, invite_token)


@invites_router.patch("/{invite_id}/cancel", response_model=InviteRead)
def cancel_invite(
    invite_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    invite = session.get(OrganizationInvite, invite_id)

    if not invite or invite.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending invites can be cancelled",
        )

    invite.status = "cancelled"

    session.add(invite)
    session.commit()
    session.refresh(invite)

    notify_workspace_event(
        session=session,
        current_user=current_user,
        title="Invite cancelled",
        message=f"The invitation for {invite.email} was cancelled.",
        priority=PRIORITY_INFO,
        entity_type="invite",
        entity_id=invite.id,
        dedupe_key=f"invite_cancelled:{invite.id}",
    )

    return invite


@access_requests_router.get(
    "/discover",
    response_model=WorkspaceDiscoveryRead,
)
def discover_existing_workspace(
    email: str = Query(min_length=3),
    session: Session = Depends(get_session),
):
    normalized_email = normalize_email(email)
    email_domain = get_joinable_email_domain(normalized_email)

    organization = find_organization_by_email_domain(
        session=session,
        email_domain=email_domain,
    )

    exists = organization is not None

    return WorkspaceDiscoveryRead(
        existing_workspace=exists,
        can_request_access=exists and email_domain is not None,
    )


@access_requests_router.post(
    "",
    response_model=AccessRequestPublicRead,
    status_code=status.HTTP_201_CREATED,
)
def create_workspace_access_request(
    payload: AccessRequestCreate,
    session: Session = Depends(get_session),
):
    normalized_email = normalize_email(payload.email)

    existing_user = session.exec(
        select(User).where(User.email == normalized_email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Sign in instead.",
        )

    email_domain = get_joinable_email_domain(normalized_email)

    if not email_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Public email domains cannot be matched to an existing workspace. "
                "Ask an organization admin for an invitation."
            ),
        )

    organization = find_organization_by_email_domain(
        session=session,
        email_domain=email_domain,
    )

    if not organization or organization.id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existing Averlen workspace was found for this company email domain.",
        )

    existing_pending = session.exec(
        select(OrganizationAccessRequest).where(
            OrganizationAccessRequest.organization_id == organization.id,
            OrganizationAccessRequest.email == normalized_email,
            OrganizationAccessRequest.status == "pending",
        )
    ).first()

    if existing_pending:
        return AccessRequestPublicRead(
            id=existing_pending.id,
            email=existing_pending.email,
            status=existing_pending.status,
            created_at=existing_pending.created_at,
        )

    existing_approved = session.exec(
        select(OrganizationAccessRequest).where(
            OrganizationAccessRequest.organization_id == organization.id,
            OrganizationAccessRequest.email == normalized_email,
            OrganizationAccessRequest.status == "approved",
        )
        .order_by(OrganizationAccessRequest.created_at.desc())
    ).first()

    if existing_approved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Your access request has already been approved. Ask the workspace "
                "administrator for your invitation link."
            ),
        )

    full_name = payload.full_name.strip() if payload.full_name else None

    request_obj = OrganizationAccessRequest(
        organization_id=organization.id,
        email=normalized_email,
        full_name=full_name or None,
        status="pending",
    )

    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)

    notify_org_admins_of_access_request(
        session=session,
        request_obj=request_obj,
    )

    return AccessRequestPublicRead(
        id=request_obj.id,
        email=request_obj.email,
        status=request_obj.status,
        created_at=request_obj.created_at,
    )


@access_requests_router.get(
    "",
    response_model=AccessRequestListResponse,
)
def list_workspace_access_requests(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_org_admin),
    status_filter: str | None = Query(default=None),
):
    statement = select(OrganizationAccessRequest).where(
        OrganizationAccessRequest.organization_id == current_user.organization_id
    )

    if status_filter:
        statement = statement.where(
            OrganizationAccessRequest.status == status_filter.strip().lower()
        )

    statement = statement.order_by(OrganizationAccessRequest.created_at.desc())
    request_objects = session.exec(statement).all()

    return AccessRequestListResponse(
        requests=[
            build_access_request_admin_read(request_obj)
            for request_obj in request_objects
        ]
    )


@access_requests_router.patch(
    "/{request_id}/approve",
    response_model=AccessRequestApprovalResponse,
)
def approve_workspace_access_request(
    request_id: int,
    payload: AccessRequestApprove,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    if current_user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    if not is_valid_role(payload.role):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role",
        )

    request_obj = get_access_request_or_404(
        session=session,
        request_id=request_id,
        organization_id=current_user.organization_id,
    )

    if request_obj.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending access requests can be approved",
        )

    existing_user = session.exec(
        select(User).where(User.email == request_obj.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    invite, invite_token = create_invite(
        session=session,
        organization_id=current_user.organization_id,
        invited_by_user_id=current_user.id,
        email=request_obj.email,
        role=payload.role,
    )

    request_obj.status = "approved"
    request_obj.reviewed_by_user_id = current_user.id
    request_obj.reviewed_at = datetime.now(timezone.utc)
    request_obj.approved_role = invite.role
    request_obj.invite_id = invite.id

    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)

    notify_workspace_event(
        session=session,
        current_user=current_user,
        title="Workspace access approved",
        message=(
            f"Access for {request_obj.email} was approved as {invite.role}."
        ),
        priority=PRIORITY_SUCCESS,
        entity_type="access_request",
        entity_id=request_obj.id,
        dedupe_key=f"access_request_approved:{request_obj.id}",
    )

    return AccessRequestApprovalResponse(
        request=build_access_request_admin_read(request_obj),
        invite_token=invite_token,
        invite_url=f"/register?invite_token={invite_token}",
    )


@access_requests_router.patch(
    "/{request_id}/reject",
    response_model=AccessRequestAdminRead,
)
def reject_workspace_access_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    if current_user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    request_obj = get_access_request_or_404(
        session=session,
        request_id=request_id,
        organization_id=current_user.organization_id,
    )

    if request_obj.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending access requests can be rejected",
        )

    request_obj.status = "rejected"
    request_obj.reviewed_by_user_id = current_user.id
    request_obj.reviewed_at = datetime.now(timezone.utc)
    request_obj.approved_role = None
    request_obj.invite_id = None

    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)

    notify_workspace_event(
        session=session,
        current_user=current_user,
        title="Workspace access rejected",
        message=f"The access request from {request_obj.email} was rejected.",
        priority=PRIORITY_WARNING,
        entity_type="access_request",
        entity_id=request_obj.id,
        dedupe_key=f"access_request_rejected:{request_obj.id}",
    )

    return build_access_request_admin_read(request_obj)


router.include_router(invites_router)
router.include_router(access_requests_router)
