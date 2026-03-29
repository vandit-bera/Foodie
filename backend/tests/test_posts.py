"""Posts endpoint tests."""
import pytest
import io


async def _signup_and_token(client, suffix="") -> str:
    r = await client.post("/api/v1/auth/signup", json={
        "username": f"user{suffix}",
        "email": f"user{suffix}@example.com",
        "password": "Str0ngPass!",
    })
    return r.json()["access_token"]


async def _create_post(client, token: str):
    fake_image = io.BytesIO(b"\xff\xd8\xff" + b"\x00" * 100)  # minimal JPEG bytes
    return await client.post(
        "/api/v1/posts",
        files={"images": ("test.jpg", fake_image, "image/jpeg")},
        data={
            "food_name": "Butter Chicken",
            "restaurant_name": "Moti Mahal",
            "price": "349",
            "caption": "Delicious!",
            "city": "Delhi",
        },
        headers={"Authorization": f"Bearer {token}"},
    )


@pytest.mark.asyncio
async def test_create_post(client):
    token = await _signup_and_token(client, "1")
    r = await _create_post(client, token)
    assert r.status_code == 201
    data = r.json()
    assert data["food_name"] == "Butter Chicken"
    assert len(data["images"]) == 1


@pytest.mark.asyncio
async def test_feed(client):
    token = await _signup_and_token(client, "2")
    await _create_post(client, token)

    r = await client.get("/api/v1/posts/feed")
    assert r.status_code == 200
    assert r.json()["total"] >= 1


@pytest.mark.asyncio
async def test_get_post(client):
    token = await _signup_and_token(client, "3")
    create_r = await _create_post(client, token)
    post_id = create_r.json()["id"]

    r = await client.get(f"/api/v1/posts/{post_id}")
    assert r.status_code == 200
    assert r.json()["id"] == post_id


@pytest.mark.asyncio
async def test_delete_post_forbidden(client):
    token1 = await _signup_and_token(client, "4")
    token2 = await _signup_and_token(client, "5")
    create_r = await _create_post(client, token1)
    post_id = create_r.json()["id"]

    r = await client.delete(f"/api/v1/posts/{post_id}", headers={"Authorization": f"Bearer {token2}"})
    assert r.status_code == 403
