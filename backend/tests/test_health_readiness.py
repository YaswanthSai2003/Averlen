def test_health_endpoint(client):
    response = client.get("/api/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ok"
    assert "app" in data
    assert "version" in data
    assert "X-Request-ID" in response.headers


def test_healthz_endpoint(client):
    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "X-Request-ID" in response.headers


def test_readyz_endpoint(client):
    response = client.get("/readyz")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ok"
    assert data["database"] == "ok"
    assert "X-Request-ID" in response.headers


def test_request_id_header_is_preserved(client):
    response = client.get(
        "/healthz",
        headers={"X-Request-ID": "test-request-id-123"},
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "test-request-id-123"