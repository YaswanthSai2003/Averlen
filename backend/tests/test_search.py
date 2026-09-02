import uuid

from sqlmodel import select

from app.db.models import User


def _unique_email(
    prefix: str,
) -> str:
    return (
        f"{prefix}_"
        f"{uuid.uuid4().hex[:8]}"
        "@example.com"
    )


def _register_and_login(
    client,
    prefix: str,
):
    email = _unique_email(
        prefix,
    )
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": (
                f"{prefix} User"
            ),
            "accepted_terms": True,
            "accepted_privacy_policy": True,
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    token = (
        login_response.json()[
            "access_token"
        ]
    )

    return (
        {
            "Authorization":
                f"Bearer {token}"
        },
        register_response.json(),
    )


def test_global_search_requires_authentication(
    client,
):
    response = client.get(
        "/api/search",
        params={
            "q": "Goa",
        },
    )

    assert response.status_code == 401


def test_global_search_requires_two_characters(
    client,
    auth_headers,
):
    response = client.get(
        "/api/search",
        headers=auth_headers,
        params={
            "q": "G",
        },
    )

    assert response.status_code == 422


def test_global_search_is_tenant_scoped(
    client,
    auth_headers,
):
    own_name = (
        "Search Beach "
        f"{uuid.uuid4().hex[:8]}"
    )

    own_property_response = client.post(
        "/api/properties",
        headers=auth_headers,
        json={
            "name": own_name,
            "city": "Goa",
            "property_type": "Villa",
            "base_price": 9000,
            "bedrooms": 4,
            "accommodates": 8,
        },
    )

    assert own_property_response.status_code == 200

    other_headers, _ = (
        _register_and_login(
            client,
            "search_other",
        )
    )

    other_name = (
        "Search Beach Other "
        f"{uuid.uuid4().hex[:8]}"
    )

    other_property_response = client.post(
        "/api/properties",
        headers=other_headers,
        json={
            "name": other_name,
            "city": "Goa",
            "property_type": "Villa",
            "base_price": 10000,
            "bedrooms": 5,
            "accommodates": 10,
        },
    )

    assert other_property_response.status_code == 200

    response = client.get(
        "/api/search",
        headers=auth_headers,
        params={
            "q": "Search Beach",
            "limit": 20,
        },
    )

    assert response.status_code == 200

    results = response.json()[
        "results"
    ]

    property_titles = {
        item["title"]
        for item in results
        if item["type"]
        == "property"
    }

    assert own_name in property_titles
    assert other_name not in property_titles

    own_result = next(
        item
        for item in results
        if (
            item["type"]
            == "property"
            and item["title"]
            == own_name
        )
    )

    assert " · " in own_result["subtitle"]
    assert "â€¢" not in own_result["subtitle"]


def test_non_admin_search_does_not_expose_workspace_members(
    client,
    auth_headers,
    session,
):
    me_response = client.get(
        "/api/auth/me",
        headers=auth_headers,
    )

    assert me_response.status_code == 200

    me = me_response.json()

    user = session.exec(
        select(User).where(
            User.id == me["id"],
        )
    ).first()

    assert user is not None

    user.role = "VIEWER"
    session.add(user)
    session.commit()

    response = client.get(
        "/api/search",
        headers=auth_headers,
        params={
            "q": me["email"][:8],
            "limit": 20,
        },
    )

    assert response.status_code == 200

    result_types = {
        item["type"]
        for item in response.json()[
            "results"
        ]
    }

    assert (
        "workspace_member"
        not in result_types
    )
