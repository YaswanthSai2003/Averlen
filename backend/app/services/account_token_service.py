import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.config import settings
from app.db.models import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value


def generate_account_token() -> str:
    return secrets.token_urlsafe(48)


def hash_account_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_email_verification_token(
    session: Session,
    user: User,
) -> str:
    raw_token = generate_account_token()

    user.email_verification_token_hash = hash_account_token(raw_token)
    user.email_verification_expires_at = (
        utc_now() + timedelta(hours=settings.email_verification_expire_hours)
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return raw_token


def verify_email_token(
    session: Session,
    raw_token: str,
) -> User:
    token_hash = hash_account_token(raw_token)

    user = session.exec(
        select(User).where(
            User.email_verification_token_hash == token_hash
        )
    ).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification link is invalid or has already been used",
        )

    if user.email_verification_expires_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification link is invalid or has already been used",
        )

    if normalize_datetime(user.email_verification_expires_at) <= utc_now():
        user.email_verification_token_hash = None
        user.email_verification_expires_at = None
        session.add(user)
        session.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification link has expired. Request a new verification email.",
        )

    user.email_verified_at = utc_now()
    user.email_verification_token_hash = None
    user.email_verification_expires_at = None

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def issue_password_reset_token(
    session: Session,
    user: User,
) -> str:
    raw_token = generate_account_token()

    user.password_reset_token_hash = hash_account_token(raw_token)
    user.password_reset_expires_at = (
        utc_now() + timedelta(minutes=settings.password_reset_expire_minutes)
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return raw_token


def get_user_for_password_reset(
    session: Session,
    raw_token: str,
) -> User:
    token_hash = hash_account_token(raw_token)

    user = session.exec(
        select(User).where(
            User.password_reset_token_hash == token_hash
        )
    ).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link is invalid or has already been used",
        )

    if user.password_reset_expires_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link is invalid or has already been used",
        )

    if normalize_datetime(user.password_reset_expires_at) <= utc_now():
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        session.add(user)
        session.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link has expired. Request a new reset email.",
        )

    return user


def consume_password_reset_token(
    session: Session,
    user: User,
) -> None:
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None

    session.add(user)
    session.commit()
    session.refresh(user)
