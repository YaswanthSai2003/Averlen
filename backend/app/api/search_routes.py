from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.roles import ORG_ADMIN
from app.db.database import get_session
from app.db.models import (
    AIInsightHistory,
    IngestionJob,
    PricingRecommendationHistory,
    Property,
    User,
)
from app.schemas.search import SearchResponse, SearchResult


router = APIRouter(
    prefix="/search",
    tags=["Search"],
)


def _result_relevance(
    result: SearchResult,
    query: str,
) -> tuple[int, str]:
    normalized_title = result.title.lower()
    normalized_subtitle = (
        result.subtitle or ""
    ).lower()

    if normalized_title == query:
        rank = 0
    elif normalized_title.startswith(query):
        rank = 1
    elif query in normalized_title:
        rank = 2
    elif query in normalized_subtitle:
        rank = 3
    else:
        rank = 4

    return (
        rank,
        normalized_title,
    )


@router.get(
    "",
    response_model=SearchResponse,
)
def global_search(
    q: str = Query(
        ...,
        min_length=2,
        max_length=120,
    ),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = Query(
        default=20,
        ge=1,
        le=25,
    ),
):
    normalized_query = q.strip()

    if len(normalized_query) < 2:
        return SearchResponse(
            query=normalized_query,
            results=[],
        )

    search_text = (
        f"%{normalized_query}%"
    )

    # Reserve space for each result category.
    per_type_limit = min(
        5,
        max(
            3,
            limit,
        ),
    )

    properties = session.exec(
        select(Property)
        .where(
            Property.organization_id
            == current_user.organization_id,
            Property.is_archived
            == False,  # noqa: E712
            or_(
                Property.name.ilike(
                    search_text
                ),
                Property.city.ilike(
                    search_text
                ),
                Property.property_type.ilike(
                    search_text
                ),
            ),
        )
        .order_by(
            Property.name.asc(),
            Property.id.asc(),
        )
        .limit(per_type_limit)
    ).all()

    upload_jobs = session.exec(
        select(IngestionJob)
        .where(
            IngestionJob.organization_id
            == current_user.organization_id,
            or_(
                IngestionJob.filename.ilike(
                    search_text
                ),
                IngestionJob.status.ilike(
                    search_text
                ),
            ),
        )
        .order_by(
            IngestionJob.created_at.desc(),
            IngestionJob.id.desc(),
        )
        .limit(per_type_limit)
    ).all()

    members: list[User] = []

    if current_user.role == ORG_ADMIN:
        members = list(
            session.exec(
                select(User)
                .where(
                    User.organization_id
                    == current_user.organization_id,
                    or_(
                        User.email.ilike(
                            search_text
                        ),
                        User.full_name.ilike(
                            search_text
                        ),
                        User.role.ilike(
                            search_text
                        ),
                    ),
                )
                .order_by(
                    User.full_name.asc(),
                    User.email.asc(),
                )
                .limit(per_type_limit)
            ).all()
        )

    insights = session.exec(
        select(AIInsightHistory)
        .where(
            AIInsightHistory.organization_id
            == current_user.organization_id,
            or_(
                AIInsightHistory.question.ilike(
                    search_text
                ),
                AIInsightHistory.answer.ilike(
                    search_text
                ),
                AIInsightHistory.context_summary.ilike(
                    search_text
                ),
            ),
        )
        .order_by(
            AIInsightHistory.is_pinned.desc(),
            AIInsightHistory.created_at.desc(),
        )
        .limit(per_type_limit)
    ).all()

    pricing_rows = session.exec(
        select(
            PricingRecommendationHistory,
            Property,
        )
        .join(
            Property,
            Property.id
            == PricingRecommendationHistory.property_id,
        )
        .where(
            PricingRecommendationHistory.organization_id
            == current_user.organization_id,
            Property.organization_id
            == current_user.organization_id,
            or_(
                Property.name.ilike(
                    search_text
                ),
                Property.city.ilike(
                    search_text
                ),
                PricingRecommendationHistory.adjustment_type.ilike(
                    search_text
                ),
                PricingRecommendationHistory.risk_level.ilike(
                    search_text
                ),
                PricingRecommendationHistory.data_quality.ilike(
                    search_text
                ),
                PricingRecommendationHistory.status.ilike(
                    search_text
                ),
                PricingRecommendationHistory.explanation_summary.ilike(
                    search_text
                ),
            ),
        )
        .order_by(
            PricingRecommendationHistory.created_at.desc(),
            PricingRecommendationHistory.id.desc(),
        )
        .limit(per_type_limit)
    ).all()

    results: list[SearchResult] = []

    results.extend(
        SearchResult(
            type="property",
            id=property_obj.id,
            title=property_obj.name,
            subtitle=(
                f"{property_obj.city} · "
                f"{property_obj.property_type}"
            ),
            extra={
                "city": property_obj.city,
                "property_type": property_obj.property_type,
                "base_price": property_obj.base_price,
                "bedrooms": property_obj.bedrooms,
                "accommodates": property_obj.accommodates,
            },
        )
        for property_obj in properties
        if property_obj.id is not None
    )

    results.extend(
        SearchResult(
            type="upload_job",
            id=job.id,
            title=job.filename,
            subtitle=(
                f"{job.status} · "
                f"{job.processed_rows}/{job.total_rows} "
                "rows processed"
            ),
            extra={
                "status": job.status,
                "processed_rows": job.processed_rows,
                "failed_rows": job.failed_rows,
                "skipped_rows": getattr(
                    job,
                    "skipped_rows",
                    0,
                ),
                "duplicate_rows": getattr(
                    job,
                    "duplicate_rows",
                    0,
                ),
            },
        )
        for job in upload_jobs
        if job.id is not None
    )

    results.extend(
        SearchResult(
            type="workspace_member",
            id=member.id,
            title=(
                member.full_name
                or member.email
            ),
            subtitle=(
                f"{member.email} · "
                f"{member.role}"
            ),
            extra={
                "email": member.email,
                "role": member.role,
                "is_active": member.is_active,
            },
        )
        for member in members
        if member.id is not None
    )

    results.extend(
        SearchResult(
            type="ai_insight",
            id=insight.id,
            title=insight.question,
            subtitle=(
                f"{insight.confidence} confidence · "
                f"{insight.source}"
            ),
            extra={
                "source": insight.source,
                "confidence": insight.confidence,
                "is_pinned": insight.is_pinned,
            },
        )
        for insight in insights
        if insight.id is not None
    )

    results.extend(
        SearchResult(
            type="pricing_recommendation",
            id=record.id,
            title=(
                f"{property_obj.name} pricing recommendation"
            ),
            subtitle=(
                f"{record.adjustment_type} · "
                f"{record.price_change_percent:+.1f}% · "
                f"{record.status}"
            ),
            extra={
                "property_id": record.property_id,
                "property_name": property_obj.name,
                "property_city": property_obj.city,
                "current_base_price": record.current_base_price,
                "recommended_price": record.recommended_price,
                "adjustment_type": record.adjustment_type,
                "status": record.status,
                "risk_level": record.risk_level,
            },
        )
        for record, property_obj in pricing_rows
        if record.id is not None
    )

    normalized_lower = normalized_query.lower()

    results.sort(
        key=lambda result:
            _result_relevance(
                result,
                normalized_lower,
            )
    )

    return SearchResponse(
        query=normalized_query,
        results=results[:limit],
    )
