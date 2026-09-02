import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.deps import get_current_user, require_writable_analyst_or_above
from app.core.config import settings
from app.db.database import get_session
from app.db.models import AIInsightHistory, User
from app.schemas.insights import (
    InsightHistoryListResponse,
    InsightHistoryRead,
    InsightQuery,
    InsightResponse,
)
from app.services.audit_service import create_manual_audit_log
from app.services.insights_service import (
    ask_llm,
    build_insight_context,
    calculate_confidence,
    extract_supporting_facts,
)
from app.services.notification_service import (
    NOTIFICATION_TYPE_AI_INSIGHT,
    PRIORITY_ERROR,
    create_notification,
)

router = APIRouter(prefix="/insights", tags=["Insights"])

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)


def store_insight_history(
    session: Session,
    *,
    current_user: User,
    response: InsightResponse,
) -> AIInsightHistory:
    record = AIInsightHistory(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        question=response.question,
        answer=response.answer,
        source=response.source,
        confidence=response.confidence,
        supporting_facts_json=json.dumps(response.supporting_facts),
        context_summary=response.context_summary,
    )

    session.add(record)
    session.commit()
    session.refresh(record)

    return record


def build_insight_history_read(record: AIInsightHistory) -> InsightHistoryRead:
    try:
        supporting_facts = json.loads(record.supporting_facts_json or "[]")
    except Exception:
        supporting_facts = []

    return InsightHistoryRead(
        id=record.id,
        organization_id=record.organization_id,
        user_id=record.user_id,
        question=record.question,
        answer=record.answer,
        supporting_facts=supporting_facts,
        confidence=record.confidence,
        context_summary=record.context_summary,
        source=record.source,
        is_pinned=record.is_pinned,
        created_at=record.created_at,
    )


def get_insight_history_or_404(
    session: Session,
    *,
    insight_id: int,
    current_user: User,
) -> AIInsightHistory:
    record = session.get(AIInsightHistory, insight_id)

    if not record or record.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Insight not found")

    return record


@router.post("/query", response_model=InsightResponse)
@limiter.limit("20/minute")
def query_insights(
    request: Request,
    payload: InsightQuery,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_analyst_or_above),
):
    context = build_insight_context(
        session=session,
        organization_id=current_user.organization_id,
    )

    answer, source = ask_llm(
        question=payload.question,
        context=context,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
    )

    supporting_facts = extract_supporting_facts(context)
    confidence = calculate_confidence(context, source)

    create_manual_audit_log(
        session=session,
        request=request,
        action=f"AI_INSIGHT_QUERY_{source.upper()}",
        status_code=200,
        user=current_user,
    )

    response = InsightResponse(
        question=payload.question,
        answer=answer,
        supporting_facts=supporting_facts,
        confidence=confidence,
        context_summary=context,
        source=source,
    )

    insight_record = store_insight_history(
        session=session,
        current_user=current_user,
        response=response,
    )

    if source == "fallback":
        create_notification(
            session=session,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            actor_user_id=current_user.id,
            type=NOTIFICATION_TYPE_AI_INSIGHT,
            priority=PRIORITY_ERROR,
            title="AI insight fallback used",
            message=(
                "The AI service was unavailable, so Averlen used a fallback answer."
            ),
            entity_type="ai_insight",
            entity_id=insight_record.id,
        )

    return response


@router.get("/history", response_model=InsightHistoryListResponse)
def list_insight_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    pinned_only: bool = Query(default=False),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    filters = [
        AIInsightHistory.organization_id == current_user.organization_id,
    ]

    if pinned_only:
        filters.append(AIInsightHistory.is_pinned == True)  # noqa: E712

    total = session.exec(
        select(func.count(AIInsightHistory.id)).where(*filters)
    ).one()

    records = session.exec(
        select(AIInsightHistory)
        .where(*filters)
        .order_by(
            AIInsightHistory.is_pinned.desc(),
            AIInsightHistory.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    ).all()

    return InsightHistoryListResponse(
        items=[
            build_insight_history_read(record)
            for record in records
            if record.id is not None
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.patch("/history/{insight_id}/pin", response_model=InsightHistoryRead)
def toggle_insight_pin(
    insight_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_analyst_or_above),
):
    record = get_insight_history_or_404(
        session=session,
        insight_id=insight_id,
        current_user=current_user,
    )

    record.is_pinned = not record.is_pinned

    session.add(record)
    session.commit()
    session.refresh(record)

    return build_insight_history_read(record)


@router.delete("/history/{insight_id}")
def delete_insight_history(
    insight_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_writable_analyst_or_above),
):
    record = get_insight_history_or_404(
        session=session,
        insight_id=insight_id,
        current_user=current_user,
    )

    session.delete(record)
    session.commit()

    return {"message": "Insight deleted"}