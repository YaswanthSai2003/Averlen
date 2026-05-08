def test_protected_route_requires_auth(client):
    response = client.get("/api/analytics/revenue")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"
