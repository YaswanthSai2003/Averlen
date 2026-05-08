from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.database import get_session
from app.db.models import User
from app.schemas.insights import InsightQuery, InsightResponse
from app.services.insights_service import (ask_llm, build_insight_context,
                                           calculate_confidence,
                                           extract_supporting_facts)

router = APIRouter(prefix="/insights", tags=["Insights"])

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)


@router.post("/query", response_model=InsightResponse)
@limiter.limit("20/minute")
def query_insights(
    request: Request,
    payload: InsightQuery,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    context = build_insight_context(
        session=session,
        organization_id=current_user.organization_id,
    )

    answer, source = ask_llm(payload.question, context)
    supporting_facts = extract_supporting_facts(context)
    confidence = calculate_confidence(context, source)

    return InsightResponse(
        question=payload.question,
        answer=answer,
        supporting_facts=supporting_facts,
        confidence=confidence,
        context_summary=context,
        source=source,
    )
