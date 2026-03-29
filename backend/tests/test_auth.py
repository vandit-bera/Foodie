"""Auth endpoint tests."""
import pytest


SIGNUP_PAYLOAD = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "Str0ngPass!",
    "full_name": "Test User",
}


@pytest.mark.asyncio
async def test_signup(client):
    r = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert data["user"]["username"] == "testuser"
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_signup_duplicate_email(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    r = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_login(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    r = await client.post("/api/v1/auth/login", json={
        "email": SIGNUP_PAYLOAD["email"],
        "password": SIGNUP_PAYLOAD["password"],
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    r = await client.post("/api/v1/auth/login", json={
        "email": SIGNUP_PAYLOAD["email"],
        "password": "wrongpassword",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh(client):
    signup = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    refresh_token = signup.json()["refresh_token"]

    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_get_me(client):
    signup = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    token = signup.json()["access_token"]

    r = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == SIGNUP_PAYLOAD["email"]
