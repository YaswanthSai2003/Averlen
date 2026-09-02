import time
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.api.deps import get_current_user, is_demo_user, require_writable_user
from app.core.config import settings
from app.core.roles import ORG_ADMIN
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_session
from app.db.models import Organization, User
from app.schemas.auth import (
    ChangePasswordRequest,
    SessionListResponse,
    SessionRead,
    Token,
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.services.audit_service import create_manual_audit_log
from app.services.demo_service import DEMO_EMAIL, ensure_demo_workspace
from app.services.invite_service import (
    get_valid_invite_by_token,
    mark_invite_accepted,
    normalize_email,
)
from app.services.organization_service import (
    build_fallback_organization_name,
    find_organization_by_email_domain,
    get_joinable_email_domain,
)
from app.services.media_storage_service import (
    MediaStorageError,
    delete_public_image,
    store_public_image,
)
from app.services.notification_service import (
    PRIORITY_INFO,
    PRIORITY_SUCCESS,
    notify_security_event,
    notify_workspace_event,
)
from app.services.session_service import (
    clear_refresh_cookie,
    create_refresh_session,
    hash_refresh_token,
    list_active_sessions,
    revoke_all_user_sessions,
    revoke_refresh_session,
    revoke_session_by_id,
    rotate_refresh_session,
    set_refresh_cookie,
)


router = APIRouter(prefix="/auth", tags=["Auth"])

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)



ALLOWED_USER_AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_USER_AVATAR_SIZE_BYTES = 2 * 1024 * 1024


def detect_avatar_extension(file_content: bytes) -> str | None:
    if file_content.startswith(b"\xff\xd8\xff"):
        return ".jpg"

    if file_content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"

    if (
        len(file_content) >= 12
        and file_content[:4] == b"RIFF"
        and file_content[8:12] == b"WEBP"
    ):
        return ".webp"

    return None


def save_user_avatar(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_USER_AVATAR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP profile photos are supported",
        )

    file_content = file.file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile photo file is empty",
        )

    if len(file_content) > MAX_USER_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile photo must be 2MB or smaller",
        )

    detected_extension = detect_avatar_extension(file_content)
    expected_extension = ALLOWED_USER_AVATAR_TYPES[file.content_type]

    if detected_extension != expected_extension:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid profile photo content",
        )

    try:
        return store_public_image(
            file_content,
            extension=detected_extension,
            local_directory=settings.public_avatar_upload_dir,
            local_url_prefix="/uploads/user_avatars",
            cloudinary_subfolder="user_avatars",
        )
    except MediaStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Profile photo storage is temporarily unavailable",
        ) from exc


def delete_user_avatar_file(avatar_url: str | None) -> None:
    delete_public_image(
        avatar_url,
        local_directory=settings.public_avatar_upload_dir,
        local_url_prefix="/uploads/user_avatars",
    )


def build_token_response(user: User, session_jti: str) -> Token:
    return Token(
        access_token=create_access_token(
            subject=user.email,
            extra_claims={"sid": session_jti},
        ),
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
    )



def resolve_organization_name(
    value: str | None,
    *,
    email: str,
    full_name: str | None,
) -> str:
    # Older clients may omit organization_name.
    if value is None:
        return build_fallback_organization_name(
            email=email,
            full_name=full_name,
        )

    organization_name = " ".join(value.strip().split())

    if len(organization_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name must be at least 2 characters long",
        )

    if len(organization_name) > 120:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name must be 120 characters or shorter",
        )

    return organization_name


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    if len(password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be 128 characters or shorter",
        )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(
    request: Request,
    payload: UserCreate,
    session: Session = Depends(get_session),
):
    start_time = time.perf_counter()
    normalized_email = normalize_email(payload.email)
    validate_password_strength(payload.password)

    if not payload.accepted_terms or not payload.accepted_privacy_policy:
        create_manual_audit_log(
            session=session,
            request=request,
            action="REGISTER_ATTEMPT",
            status_code=status.HTTP_400_BAD_REQUEST,
            email=normalized_email,
            user=None,
            duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept the Terms and Privacy Policy to create an account",
        )

    existing_user = session.exec(
        select(User).where(User.email == normalized_email)
    ).first()

    if existing_user:
        create_manual_audit_log(
            session=session,
            request=request,
            action="REGISTER_ATTEMPT",
            status_code=status.HTTP_400_BAD_REQUEST,
            email=normalized_email,
            user=existing_user,
            duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    invite = None

    if payload.invite_token:
        invite = get_valid_invite_by_token(session, payload.invite_token)

        if normalize_email(invite.email) != normalized_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite email does not match registration email",
            )

        organization = session.get(Organization, invite.organization_id)

        if not organization:
            raise HTTPException(status_code=404, detail="Invite workspace not found")

        organization_id = organization.id
        user_role = invite.role

    else:
        organization_name = resolve_organization_name(
            payload.organization_name,
            email=normalized_email,
            full_name=payload.full_name,
        )

        email_domain = get_joinable_email_domain(normalized_email)
        existing_organization = find_organization_by_email_domain(
            session=session,
            email_domain=email_domain,
        )

        if existing_organization:
            create_manual_audit_log(
                session=session,
                request=request,
                action="REGISTER_ATTEMPT",
                status_code=status.HTTP_409_CONFLICT,
                email=normalized_email,
                user=None,
                duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A Averlen workspace already exists for this company "
                    "email domain. Request access or ask an organization admin "
                    "for an invitation."
                ),
            )

        organization = Organization(
            name=organization_name,
            email_domain=email_domain,
        )
        session.add(organization)

        try:
            session.flush()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A Averlen workspace already exists for this company "
                    "email domain. Request access or ask an organization admin "
                    "for an invitation."
                ),
            ) from exc

        if organization.id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create workspace",
            )

        organization_id = organization.id
        user_role = ORG_ADMIN

    accepted_at = datetime.now(timezone.utc)

    user = User(
        organization_id=organization_id,
        email=normalized_email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=user_role,
        terms_accepted_at=accepted_at,
        privacy_accepted_at=accepted_at,
        terms_version=settings.terms_version,
        privacy_version=settings.privacy_version,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    if invite and user.id is not None:
        mark_invite_accepted(
            session=session,
            invite=invite,
            accepted_by_user_id=user.id,
        )

        notify_workspace_event(
            session=session,
            current_user=user,
            title="New workspace member joined",
            message=f"{user.full_name or user.email} joined the workspace as {user.role}.",
            priority=PRIORITY_INFO,
            entity_type="user",
            entity_id=user.id,
            dedupe_key=f"workspace_member_joined:{user.id}",
        )

    create_manual_audit_log(
        session=session,
        request=request,
        action="REGISTER_ATTEMPT",
        status_code=status.HTTP_201_CREATED,
        email=normalized_email,
        user=user,
        duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
    )

    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login_user(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    start_time = time.perf_counter()
    normalized_email = normalize_email(form_data.username)

    user = session.exec(select(User).where(User.email == normalized_email)).first()

    if (
        not user
        or not user.is_active
        or not verify_password(form_data.password, user.hashed_password)
    ):
        create_manual_audit_log(
            session=session,
            request=request,
            action="LOGIN_ATTEMPT",
            status_code=status.HTTP_401_UNAUTHORIZED,
            email=normalized_email,
            user=user,
            duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    refresh_session, refresh_token = create_refresh_session(
        session=session,
        user=user,
        request=request,
    )

    set_refresh_cookie(response, refresh_token)

    notify_security_event(
        session=session,
        current_user=user,
        title="New login detected",
        message="A new login was detected for your Averlen account.",
        priority=PRIORITY_INFO,
        entity_type="user",
        entity_id=user.id,
    )

    create_manual_audit_log(
        session=session,
        request=request,
        action="LOGIN_ATTEMPT",
        status_code=status.HTTP_200_OK,
        email=normalized_email,
        user=user,
        duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
    )

    return build_token_response(user, refresh_session.jti)


@router.post("/demo-login", response_model=Token)
def demo_login(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
):
    start_time = time.perf_counter()

    demo_user = ensure_demo_workspace(session)

    if not demo_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo user is inactive",
        )

    refresh_session, refresh_token = create_refresh_session(
        session=session,
        user=demo_user,
        request=request,
    )

    set_refresh_cookie(response, refresh_token)

    create_manual_audit_log(
        session=session,
        request=request,
        action="DEMO_LOGIN",
        status_code=status.HTTP_200_OK,
        email=DEMO_EMAIL,
        user=demo_user,
        duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
    )

    return build_token_response(demo_user, refresh_session.jti)


@router.post("/refresh", response_model=Token)
def refresh_access_token(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
):
    refresh_token = request.cookies.get(settings.refresh_cookie_name)

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    user, refresh_session, new_refresh_token = rotate_refresh_session(
        session=session,
        raw_token=refresh_token,
        request=request,
    )

    set_refresh_cookie(response, new_refresh_token)

    return build_token_response(user, refresh_session.jti)


@router.post("/logout")
def logout_user(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
):
    refresh_token = request.cookies.get(settings.refresh_cookie_name)

    if refresh_token:
        try:
            revoke_refresh_session(session, refresh_token)
        except HTTPException:
            pass

    clear_refresh_cookie(response)

    return {"message": "Logged out successfully"}


@router.get("/sessions", response_model=SessionListResponse)
def get_sessions(
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    sessions = list_active_sessions(
        session,
        current_user,
    )

    current_refresh_token = request.cookies.get(
        settings.refresh_cookie_name
    )

    current_token_hash = (
        hash_refresh_token(current_refresh_token)
        if current_refresh_token
        else None
    )

    if is_demo_user(current_user):
        sessions = [
            session_obj
            for session_obj in sessions
            if (
                current_token_hash is not None
                and session_obj.token_hash == current_token_hash
            )
        ]

    return SessionListResponse(
        sessions=[
            SessionRead(
                id=session_obj.id,
                user_agent=session_obj.user_agent,
                ip_address=session_obj.ip_address,
                is_revoked=session_obj.is_revoked,
                is_current=(
                    current_token_hash is not None
                    and session_obj.token_hash
                    == current_token_hash
                ),
                expires_at=session_obj.expires_at,
                created_at=session_obj.created_at,
            )
            for session_obj in sessions
            if session_obj.id is not None
        ]
    )

@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    revoke_session_by_id(
        session=session,
        session_id=session_id,
        current_user=current_user,
    )

    notify_security_event(
        session=session,
        current_user=current_user,
        title="Session revoked",
        message="One of your active sessions was revoked.",
        priority=PRIORITY_SUCCESS,
        entity_type="session",
        entity_id=session_id,
    )

    return {"message": "Session revoked successfully"}


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    if current_user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    db_user = session.get(User, current_user.id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name is not None:
        db_user.full_name = payload.full_name.strip() or None

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    notify_security_event(
        session=session,
        current_user=db_user,
        title="Profile updated",
        message="Your account profile was updated successfully.",
        priority=PRIORITY_SUCCESS,
        entity_type="user",
        entity_id=db_user.id,
    )

    return db_user


@router.post("/me/avatar", response_model=UserRead)
def upload_my_avatar(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    if current_user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    db_user = session.get(User, current_user.id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_avatar_url = db_user.avatar_url
    avatar_url = save_user_avatar(file)

    db_user.avatar_url = avatar_url

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    delete_user_avatar_file(old_avatar_url)

    notify_security_event(
        session=session,
        current_user=db_user,
        title="Profile photo updated",
        message="Your profile photo was updated successfully.",
        priority=PRIORITY_SUCCESS,
        entity_type="user",
        entity_id=db_user.id,
    )

    return db_user


@router.delete("/me/avatar", response_model=UserRead)
def delete_my_avatar(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    if current_user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    db_user = session.get(User, current_user.id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_avatar_url = db_user.avatar_url
    db_user.avatar_url = None

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    delete_user_avatar_file(old_avatar_url)

    notify_security_event(
        session=session,
        current_user=db_user,
        title="Profile photo removed",
        message="Your profile photo was removed successfully.",
        priority=PRIORITY_SUCCESS,
        entity_type="user",
        entity_id=db_user.id,
    )

    return db_user


@router.patch("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_user),
):
    if current_user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    db_user = session.get(User, current_user.id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    validate_password_strength(payload.new_password)

    db_user.hashed_password = hash_password(payload.new_password)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    notify_security_event(
        session=session,
        current_user=db_user,
        title="Password changed",
        message="Your account password was changed successfully.",
        priority=PRIORITY_SUCCESS,
        entity_type="user",
        entity_id=db_user.id,
    )

    revoke_all_user_sessions(session, db_user.id)

    return {"message": "Password changed successfully. Please log in again."}