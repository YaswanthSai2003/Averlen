from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.api.deps import require_admin
from app.db.database import get_session
from app.db.models import AuditLog, User
from app.schemas.audit import AuditLogRead

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=list[AuditLogRead])
def list_audit_logs(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    statement = (
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    return session.exec(statement).all()
