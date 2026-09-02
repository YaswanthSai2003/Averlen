from app.db.models import (
    AIInsightHistory,
    IngestionJob,
    PricingRecommendationHistory,
    Property,
)


def test_global_search_returns_multiple_result_types(
    client,
    session,
    auth_headers,
):
    me_response = client.get("/api/auth/me", headers=auth_headers)
    organization_id = me_response.json()["organization_id"]
    user_id = me_response.json()["id"]

    property_obj = Property(
        organization_id=organization_id,
        name="Search Villa",
        city="Search City",
        property_type="Villa",
        base_price=9000,
        bedrooms=4,
        accommodates=8,
    )

    session.add(property_obj)
    session.commit()
    session.refresh(property_obj)

    upload_job = IngestionJob(
        organization_id=organization_id,
        user_id=user_id,
        filename="search_upload_bookings.csv",
        status="completed",
        total_rows=10,
        processed_rows=10,
        failed_rows=0,
    )

    insight = AIInsightHistory(
        organization_id=organization_id,
        user_id=user_id,
        question="Search revenue question",
        answer="Search revenue answer",
        source="fallback",
        confidence="medium",
        supporting_facts_json="[]",
        context_summary="Search insight context",
    )

    pricing_record = PricingRecommendationHistory(
        organization_id=organization_id,
        property_id=property_obj.id,
        created_by_user_id=user_id,
        current_base_price=9000,
        recommended_price=9900,
        demand_score=70,
        confidence_score=80,
        adjustment_type="increase",
        reason="Search pricing reason",
        property_average_price=9500,
        city_average_price=9300,
        booking_volume=8,
        city_booking_volume=20,
        price_change_percent=10,
        risk_level="low",
        data_quality="strong",
        explanation_summary="Search pricing opportunity",
        pricing_factors_json="[]",
    )

    session.add(upload_job)
    session.add(insight)
    session.add(pricing_record)
    session.commit()

    response = client.get(
        "/api/search?q=Search&limit=20",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    result_types = {item["type"] for item in data["results"]}

    assert "property" in result_types
    assert "upload_job" in result_types
    assert "ai_insight" in result_types
    assert "pricing_recommendation" in result_types