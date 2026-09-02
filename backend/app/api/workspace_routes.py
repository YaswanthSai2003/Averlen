from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_user, require_org_admin, require_writable_org_admin
from app.core.roles import ORG_ADMIN, is_valid_role
from app.db.database import get_session
from app.db.models import Organization, User
from app.schemas.workspace import (
    WorkspaceMemberListResponse,
    WorkspaceMemberRead,
    WorkspaceMemberRoleUpdate,
    WorkspaceRead,
    WorkspaceUpdate,
)
from app.services.session_service import revoke_all_user_sessions

from app.services.notification_service import (
    PRIORITY_INFO,
    PRIORITY_WARNING,
    notify_workspace_event,
)

router = APIRouter(prefix="/workspace", tags=["Workspace"])


def get_org_member_or_404(
    session: Session,
    organization_id: int,
    user_id: int,
) -> User:
    member = session.get(User, user_id)

    if not member or member.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="Workspace member not found")

    return member


def count_active_org_admins(
    session: Session,
    organization_id: int,
) -> int:
    active_admins = session.exec(
        select(User).where(
            User.organization_id == organization_id,
            User.role == ORG_ADMIN,
            User.is_active == True,  # noqa: E712
        )
    ).all()

    return len(active_admins)


def ensure_last_admin_is_protected(
    session: Session,
    member: User,
    *,
    new_role: str | None = None,
    deactivate: bool = False,
) -> None:
    if member.role != ORG_ADMIN or not member.is_active:
        return

    would_remove_admin_power = deactivate or (
        new_role is not None and new_role != ORG_ADMIN
    )

    if not would_remove_admin_power:
        return

    active_admin_count = count_active_org_admins(
        session=session,
        organization_id=member.organization_id,
    )

    if active_admin_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove or downgrade the last active organization admin",
        )


def build_member_read(member: User) -> WorkspaceMemberRead:
    return WorkspaceMemberRead(
        id=member.id,
        organization_id=member.organization_id,
        email=member.email,
        full_name=member.full_name,
        avatar_url=member.avatar_url,
        role=member.role,
        is_active=member.is_active,
        created_at=member.created_at,
    )


@router.get("", response_model=WorkspaceRead)
def get_workspace(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    workspace = session.get(Organization, current_user.organization_id)

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return workspace


@router.patch("", response_model=WorkspaceRead)
def update_workspace(
    payload: WorkspaceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    workspace = session.get(Organization, current_user.organization_id)

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    workspace.name = payload.name

    session.add(workspace)
    session.commit()
    session.refresh(workspace)

    return workspace


@router.get("/members", response_model=WorkspaceMemberListResponse)
def list_workspace_members(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_org_admin),
):
    members = session.exec(
        select(User)
        .where(User.organization_id == current_user.organization_id)
        .order_by(User.created_at.asc())
    ).all()

    return WorkspaceMemberListResponse(
        members=[
            build_member_read(member)
            for member in members
            if member.id is not None
        ]
    )


@router.patch(
    "/members/{user_id}/role",
    response_model=WorkspaceMemberRead,
)
def update_workspace_member_role(
    user_id: int,
    payload: WorkspaceMemberRoleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    if not is_valid_role(payload.role):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role",
        )

    member = get_org_member_or_404(
        session=session,
        organization_id=current_user.organization_id,
        user_id=user_id,
    )

    ensure_last_admin_is_protected(
        session=session,
        member=member,
        new_role=payload.role,
    )

    member.role = payload.role

    session.add(member)
    session.commit()
    session.refresh(member)

    notify_workspace_event(
        session=session,
        current_user=current_user,
        title="Workspace member role updated",
        message=f"{member.full_name or member.email} is now {member.role}.",
        priority=PRIORITY_INFO,
        entity_type="user",
        entity_id=member.id,
    )

    return build_member_read(member)


@router.patch(
    "/members/{user_id}/deactivate",
    response_model=WorkspaceMemberRead,
)
def deactivate_workspace_member(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_org_admin),
):
    member = get_org_member_or_404(
        session=session,
        organization_id=current_user.organization_id,
        user_id=user_id,
    )

    ensure_last_admin_is_protected(
        session=session,
        member=member,
        deactivate=True,
    )

    if not member.is_active:
        return build_member_read(member)

    member.is_active = False

    session.add(member)
    session.commit()
    session.refresh(member)

    if member.id is not None:
        revoke_all_user_sessions(session, member.id)

    notify_workspace_event(
        session=session,
        current_user=current_user,
        title="Workspace member deactivated",
        message=f"{member.full_name or member.email} was deactivated.",
        priority=PRIORITY_WARNING,
        entity_type="user",
        entity_id=member.id,
    )
    return build_member_read(member)