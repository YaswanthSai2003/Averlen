from fastapi import Request
from jose import JWTError, jwt
from sqlmodel import Session, select

from app.core.config import settings
from app.db.models import AuditLog, User


def get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host

    return None


def get_user_from_request_token(request: Request, session: Session) -> User | None:
    authorization = request.headers.get("authorization")

    if not authorization:
        return None

    if not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        email = payload.get("sub")

        if not email:
            return None

        return session.exec(select(User).where(User.email == email)).first()

    except JWTError:
        return None


def infer_action(method: str, path: str) -> str:
    if path == "/api/auth/login":
        return "LOGIN_ATTEMPT"

    if path == "/api/auth/register":
        return "REGISTER_ATTEMPT"

    if path == "/api/auth/demo-login":
        return "DEMO_LOGIN"

    if path.startswith("/api/properties"):
        return "PROPERTY_ACCESS"

    if path.startswith("/api/upload"):
        return "UPLOAD_ACCESS"

    if path.startswith("/api/analytics"):
        return "ANALYTICS_VIEWED"

    if path.startswith("/api/recommendations"):
        return "PRICING_VIEWED"

    if path.startswith("/api/insights"):
        return "AI_INSIGHT_ACCESSED"

    if path.startswith("/api/audit-logs"):
        return "AUDIT_LOGS_VIEWED"

    if path.startswith("/docs") or path.startswith("/openapi.json"):
        return "DOCS_VIEWED"

    return "API_ACCESS"


def should_skip_middleware_audit(path: str) -> bool:
    skip_paths = {
        "/favicon.ico",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/demo-login",
    }

    return path in skip_paths


def create_audit_log(
    session: Session,
    request: Request,
    status_code: int,
    duration_ms: float,
) -> None:
    path = request.url.path

    if should_skip_middleware_audit(path):
        return

    user = get_user_from_request_token(request, session)

    audit_log = AuditLog(
        user_id=user.id if user else None,
        organization_id=user.organization_id if user else None,
        email=user.email if user else None,
        action=infer_action(request.method, path),
        method=request.method,
        path=path,
        status_code=status_code,
        duration_ms=duration_ms,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )

    session.add(audit_log)
    session.commit()


def create_manual_audit_log(
    session: Session,
    request: Request,
    action: str,
    status_code: int,
    email: str | None = None,
    user: User | None = None,
    duration_ms: float = 0.0,
) -> None:
    audit_log = AuditLog(
        user_id=user.id if user else None,
        organization_id=user.organization_id if user else None,
        email=email.lower() if email else user.email if user else None,
        action=action,
        method=request.method,
        path=request.url.path,
        status_code=status_code,
        duration_ms=duration_ms,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )

    session.add(audit_log)
    session.commit()
