from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from app.core.config import settings
from app.core.roles import MANAGER_ROLES, ORG_ADMIN
from app.core.security import decode_access_token_claims
from app.db.database import get_session
from app.db.models import User
from app.services.demo_service import is_demo_email
from app.services.session_service import get_active_refresh_session_by_jti


ROLE_VIEWER = "VIEWER"
ROLE_ANALYST = "ANALYST"
ROLE_REVENUE_MANAGER = "REVENUE_MANAGER"
ROLE_ORG_ADMIN = ORG_ADMIN

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    claims = decode_access_token_claims(token)

    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = claims.get("sub")
    session_jti = claims.get("sid")

    if (
        not isinstance(email, str)
        or not isinstance(session_jti, str)
        or not session_jti
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = session.exec(
        select(User).where(User.email == email.lower())
    ).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    active_session = get_active_refresh_session_by_jti(
        session=session,
        session_jti=session_jti,
        user=user,
    )

    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_platform_admin_emails() -> set[str]:
    """Return the backend-only bootstrap admin allowlist."""

    return {
        email.strip().lower()
        for email in settings.admin_emails.split(",")
        if email.strip()
    }


def is_platform_admin(current_user: User) -> bool:
    """Resolve platform-admin access from DB flag or bootstrap allowlist."""

    return bool(current_user.is_platform_admin) or (
        current_user.email.lower() in get_platform_admin_emails()
    )


def require_platform_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not is_platform_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform administrator access required",
        )

    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Authorize legacy admin routes; platform APIs use require_platform_admin."""

    if not is_platform_admin(current_user) and current_user.role != ORG_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def require_org_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != ORG_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin access required",
        )

    return current_user


def require_manager(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required",
        )

    return current_user


def require_roles(allowed_roles: set[str]) -> Callable:
    def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return dependency


def require_viewer_or_above(
    current_user: User = Depends(
        require_roles(
            {
                ROLE_VIEWER,
                ROLE_ANALYST,
                ROLE_REVENUE_MANAGER,
                ROLE_ORG_ADMIN,
            }
        )
    ),
) -> User:
    return current_user


def require_analyst_or_above(
    current_user: User = Depends(
        require_roles(
            {
                ROLE_ANALYST,
                ROLE_REVENUE_MANAGER,
                ROLE_ORG_ADMIN,
            }
        )
    ),
) -> User:
    return current_user


def require_revenue_manager_or_admin(
    current_user: User = Depends(
        require_roles(
            {
                ROLE_REVENUE_MANAGER,
                ROLE_ORG_ADMIN,
            }
        )
    ),
) -> User:
    return current_user


DEMO_READ_ONLY_DETAIL = "Demo workspace is read-only"


def is_demo_user(current_user: User) -> bool:
    return is_demo_email(current_user.email)


def require_writable_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if is_demo_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=DEMO_READ_ONLY_DETAIL,
        )

    return current_user


def require_writable_manager(
    current_user: User = Depends(require_manager),
) -> User:
    return require_writable_user(current_user)


def require_writable_org_admin(
    current_user: User = Depends(require_org_admin),
) -> User:
    return require_writable_user(current_user)


def require_writable_analyst_or_above(
    current_user: User = Depends(require_analyst_or_above),
) -> User:
    return require_writable_user(current_user)


def require_writable_revenue_manager_or_admin(
    current_user: User = Depends(require_revenue_manager_or_admin),
) -> User:
    return require_writable_user(current_user)
