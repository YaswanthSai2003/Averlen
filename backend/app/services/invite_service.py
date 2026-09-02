import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.config import settings
from app.core.roles import VALID_ORG_ROLES
from app.db.models import OrganizationInvite


def normalize_email(email: str) -> str:
    return email.lower().strip()


def generate_invite_token() -> str:
    return secrets.token_urlsafe(32)


def hash_invite_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def validate_invite_role(role: str) -> str:
    normalized_role = role.strip().upper()

    if normalized_role not in VALID_ORG_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role",
        )

    return normalized_role


def create_invite(
    session: Session,
    organization_id: int,
    invited_by_user_id: int,
    email: str,
    role: str,
) -> tuple[OrganizationInvite, str]:
    normalized_email = normalize_email(email)
    normalized_role = validate_invite_role(role)

    existing_pending_invite = session.exec(
        select(OrganizationInvite).where(
            OrganizationInvite.organization_id == organization_id,
            OrganizationInvite.email == normalized_email,
            OrganizationInvite.status == "pending",
        )
    ).first()

    if existing_pending_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending invite already exists for this email",
        )

    invite_token = generate_invite_token()
    token_hash = hash_invite_token(invite_token)

    invite = OrganizationInvite(
        organization_id=organization_id,
        invited_by_user_id=invited_by_user_id,
        email=normalized_email,
        role=normalized_role,
        token_hash=token_hash,
        status="pending",
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=settings.invite_expire_hours),
    )

    session.add(invite)
    session.commit()
    session.refresh(invite)

    return invite, invite_token


def regenerate_invite_token(
    session: Session,
    invite: OrganizationInvite,
) -> tuple[OrganizationInvite, str]:
    invite_token = generate_invite_token()

    invite.token_hash = hash_invite_token(
        invite_token
    )
    invite.status = "pending"
    invite.expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            hours=settings.invite_expire_hours
        )
    )
    invite.accepted_at = None
    invite.accepted_by_user_id = None

    session.add(invite)
    session.commit()
    session.refresh(invite)

    return invite, invite_token


def get_valid_invite_by_token(
    session: Session,
    invite_token: str,
) -> OrganizationInvite:
    token_hash = hash_invite_token(invite_token)

    invite = session.exec(
        select(OrganizationInvite).where(
            OrganizationInvite.token_hash == token_hash,
            OrganizationInvite.status == "pending",
        )
    ).first()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite",
        )

    now = datetime.now(timezone.utc)

    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        invite.status = "expired"
        session.add(invite)
        session.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite has expired",
        )

    return invite


def mark_invite_accepted(
    session: Session,
    invite: OrganizationInvite,
    accepted_by_user_id: int,
) -> OrganizationInvite:
    invite.status = "accepted"
    invite.accepted_by_user_id = accepted_by_user_id
    invite.accepted_at = datetime.now(timezone.utc)

    session.add(invite)
    session.commit()
    session.refresh(invite)

    return invite