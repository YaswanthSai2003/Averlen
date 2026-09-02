import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response, status
from sqlmodel import Session, select

from app.core.config import settings
from app.db.models import RefreshToken, User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value


def get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return None


def get_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    max_age = settings.refresh_token_expire_days * 24 * 60 * 60

    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=max_age,
        expires=max_age,
        path=settings.refresh_cookie_path,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
    )


def create_refresh_session(
    session: Session,
    user: User,
    request: Request,
    rotated_from_token_id: int | None = None,
) -> tuple[RefreshToken, str]:
    if user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    raw_token = generate_refresh_token()

    refresh_session = RefreshToken(
        user_id=user.id,
        organization_id=user.organization_id,
        token_hash=hash_refresh_token(raw_token),
        jti=str(uuid.uuid4()),
        user_agent=get_user_agent(request),
        ip_address=get_client_ip(request),
        expires_at=utc_now() + timedelta(days=settings.refresh_token_expire_days),
        rotated_from_token_id=rotated_from_token_id,
    )

    session.add(refresh_session)
    session.commit()
    session.refresh(refresh_session)

    return refresh_session, raw_token


def get_active_refresh_session_by_jti(
    session: Session,
    session_jti: str,
    user: User,
) -> RefreshToken | None:
    if user.id is None:
        return None

    refresh_session = session.exec(
        select(RefreshToken).where(
            RefreshToken.jti == session_jti,
            RefreshToken.user_id == user.id,
            RefreshToken.organization_id == user.organization_id,
        )
    ).first()

    if not refresh_session or refresh_session.is_revoked:
        return None

    if normalize_datetime(refresh_session.expires_at) <= utc_now():
        return None

    return refresh_session


def revoke_all_user_sessions(session: Session, user_id: int) -> None:
    active_sessions = session.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False,  # noqa: E712
        )
    ).all()

    now = utc_now()

    for active_session in active_sessions:
        active_session.is_revoked = True
        active_session.revoked_at = now
        session.add(active_session)

    session.commit()


def get_refresh_session_from_token(
    session: Session,
    raw_token: str,
    *,
    detect_reuse: bool = True,
) -> RefreshToken:
    token_hash = hash_refresh_token(raw_token)

    refresh_session = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()

    if not refresh_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    expires_at = normalize_datetime(refresh_session.expires_at)
    now = utc_now()

    if refresh_session.is_revoked:
        if detect_reuse:
            rotated_replacement = session.exec(
                select(RefreshToken).where(
                    RefreshToken.rotated_from_token_id == refresh_session.id
                )
            ).first()

            if rotated_replacement:
                revoke_all_user_sessions(session, refresh_session.user_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token reuse detected. All sessions revoked.",
                )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked",
        )

    if expires_at < now:
        refresh_session.is_revoked = True
        refresh_session.revoked_at = now
        session.add(refresh_session)
        session.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked",
        )

    return refresh_session


def rotate_refresh_session(
    session: Session,
    raw_token: str,
    request: Request,
) -> tuple[User, RefreshToken, str]:
    old_session = get_refresh_session_from_token(
        session,
        raw_token,
        detect_reuse=True,
    )

    user = session.get(User, old_session.user_id)

    if not user or not user.is_active:
        revoke_all_user_sessions(session, old_session.user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    old_session.is_revoked = True
    old_session.revoked_at = utc_now()

    session.add(old_session)
    session.commit()
    session.refresh(old_session)

    new_session, new_raw_token = create_refresh_session(
        session=session,
        user=user,
        request=request,
        rotated_from_token_id=old_session.id,
    )

    return user, new_session, new_raw_token


def revoke_refresh_session(
    session: Session,
    raw_token: str,
) -> None:
    refresh_session = get_refresh_session_from_token(
        session,
        raw_token,
        detect_reuse=False,
    )

    refresh_session.is_revoked = True
    refresh_session.revoked_at = utc_now()

    session.add(refresh_session)
    session.commit()


def revoke_session_by_id(
    session: Session,
    session_id: int,
    current_user: User,
) -> None:
    refresh_session = session.get(RefreshToken, session_id)

    if (
        not refresh_session
        or refresh_session.user_id != current_user.id
        or refresh_session.organization_id != current_user.organization_id
    ):
        raise HTTPException(status_code=404, detail="Session not found")

    refresh_session.is_revoked = True
    refresh_session.revoked_at = utc_now()

    session.add(refresh_session)
    session.commit()


def list_active_sessions(
    session: Session,
    current_user: User,
) -> list[RefreshToken]:
    return session.exec(
        select(RefreshToken)
        .where(
            RefreshToken.user_id == current_user.id,
            RefreshToken.organization_id == current_user.organization_id,
            RefreshToken.is_revoked == False,  # noqa: E712
        )
        .order_by(RefreshToken.created_at.desc())
    ).all()