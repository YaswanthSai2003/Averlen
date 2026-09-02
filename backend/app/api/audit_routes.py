from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.deps import require_platform_admin
from app.db.database import get_session
from app.db.models import AuditLog, User
from app.schemas.audit import AuditLogPageResponse, AuditLogRead


router = APIRouter(prefix="/internal/audit-logs", tags=["Internal audit logs"])


def build_audit_statement(*, errors_only: bool = False):
    statement = select(AuditLog)

    if errors_only:
        statement = statement.where(AuditLog.status_code >= 400)

    return statement


def build_audit_count_statement(*, errors_only: bool = False):
    statement = select(func.count(AuditLog.id))

    if errors_only:
        statement = statement.where(AuditLog.status_code >= 400)

    return statement


@router.get("", response_model=list[AuditLogRead])
def list_audit_logs(
    session: Session = Depends(get_session),
    _: User = Depends(require_platform_admin),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    statement = (
        build_audit_statement()
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    return session.exec(statement).all()


@router.get("/page", response_model=AuditLogPageResponse)
def list_audit_logs_page(
    session: Session = Depends(get_session),
    _: User = Depends(require_platform_admin),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    total = session.exec(build_audit_count_statement()).one()

    statement = (
        build_audit_statement()
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    items = session.exec(statement).all()

    return AuditLogPageResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/errors/page", response_model=AuditLogPageResponse)
def list_audit_errors_page(
    session: Session = Depends(get_session),
    _: User = Depends(require_platform_admin),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    total = session.exec(
        build_audit_count_statement(errors_only=True)
    ).one()

    statement = (
        build_audit_statement(errors_only=True)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    items = session.exec(statement).all()

    return AuditLogPageResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )
