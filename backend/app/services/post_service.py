"""
Post business logic: create, feed, detail, delete.
Location-aware feed uses PostGIS ST_DWithin + ST_Distance.
"""
import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select, func, text, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.post import Post
from app.models.like import Like
from app.models.user import User
from app.schemas.post import PostCreate, PostCard, PostDetail, PaginatedPosts


async def create_post(
    data: PostCreate,
    image_urls: list[str],
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Post:
    """Persist a new post with images."""
    images = [{"url": url, "order": i + 1} for i, url in enumerate(image_urls)]

    post = Post(
        user_id=user_id,
        food_name=data.food_name,
        restaurant_name=data.restaurant_name,
        price=data.price,
        caption=data.caption,
        location_name=data.location_name,
        address=data.address,
        city=data.city,
        latitude=data.latitude,
        longitude=data.longitude,
        images=images,
    )
    db.add(post)
    await db.flush()

    # Reload with user relationship for response
    await db.refresh(post, ["user"])
    return post


async def get_feed(
    db: AsyncSession,
    page: int,
    per_page: int,
    lat: float | None,
    lng: float | None,
    radius_km: float,
    city: str | None,
    current_user_id: uuid.UUID | None,
) -> PaginatedPosts:
    """
    Returns paginated feed.
    If lat/lng provided → sort by distance ASC within radius.
    Otherwise → sort by created_at DESC.
    """
    offset = (page - 1) * per_page

    # Base filter: active posts only
    filters = [Post.is_active == True]
    if city:
        filters.append(func.lower(Post.city) == city.lower())

    # ── Location-aware query ─────────────────────────────────────────────
    if lat is not None and lng is not None:
        point_wkt = f"SRID=4326;POINT({lng} {lat})"
        distance_col = func.ST_Distance(
            Post.location,
            func.ST_GeogFromText(point_wkt),
        ).label("distance_meters")

        filters.append(
            func.ST_DWithin(
                Post.location,
                func.ST_GeogFromText(point_wkt),
                radius_km * 1000,  # metres
            )
        )

        count_q = select(func.count()).select_from(Post).where(*filters)
        total = (await db.execute(count_q)).scalar_one()

        q = (
            select(Post, distance_col)
            .options(selectinload(Post.user))
            .where(*filters)
            .order_by(distance_col.asc(), Post.created_at.desc())
            .limit(per_page)
            .offset(offset)
        )
        rows = (await db.execute(q)).all()
        posts_with_dist = [(row[0], row[1]) for row in rows]

    else:
        # ── Recency-only query ──────────────────────────────────────────
        count_q = select(func.count()).select_from(Post).where(*filters)
        total = (await db.execute(count_q)).scalar_one()

        q = (
            select(Post)
            .options(selectinload(Post.user))
            .where(*filters)
            .order_by(Post.created_at.desc())
            .limit(per_page)
            .offset(offset)
        )
        rows = (await db.execute(q)).scalars().all()
        posts_with_dist = [(p, None) for p in rows]

    # ── Check liked_by_me for authenticated users ────────────────────────
    liked_ids: set[uuid.UUID] = set()
    if current_user_id and posts_with_dist:
        post_ids = [p.id for p, _ in posts_with_dist]
        liked_q = select(Like.post_id).where(
            Like.user_id == current_user_id,
            Like.post_id.in_(post_ids),
        )
        liked_ids = set((await db.execute(liked_q)).scalars().all())

    items = []
    for post, dist in posts_with_dist:
        card = _to_post_card(post, liked_by_me=post.id in liked_ids, distance_m=dist)
        items.append(card)

    return PaginatedPosts(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        has_next=(offset + per_page) < total,
    )


async def get_post_by_id(
    post_id: uuid.UUID,
    db: AsyncSession,
    current_user_id: uuid.UUID | None = None,
) -> PostDetail:
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.id == post_id, Post.is_active == True)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    liked_by_me = False
    if current_user_id:
        like_q = select(Like).where(Like.user_id == current_user_id, Like.post_id == post_id)
        liked_by_me = (await db.execute(like_q)).scalar_one_or_none() is not None

    return PostDetail(
        id=post.id,
        user=post.user,
        food_name=post.food_name,
        restaurant_name=post.restaurant_name,
        price=float(post.price) if post.price else None,
        caption=post.caption,
        location_name=post.location_name,
        city=post.city,
        address=post.address,
        latitude=float(post.latitude) if post.latitude else None,
        longitude=float(post.longitude) if post.longitude else None,
        images=post.images,
        like_count=post.like_count,
        comment_count=post.comment_count,
        share_count=post.share_count,
        liked_by_me=liked_by_me,
        created_at=post.created_at,
    )


async def delete_post(post_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your post")
    # Soft delete
    post.is_active = False


async def get_user_posts(
    profile_user_id: uuid.UUID,
    db: AsyncSession,
    page: int,
    per_page: int,
    current_user_id: uuid.UUID | None,
) -> PaginatedPosts:
    offset = (page - 1) * per_page
    filters = [Post.user_id == profile_user_id, Post.is_active == True]

    total = (await db.execute(select(func.count()).select_from(Post).where(*filters))).scalar_one()

    q = (
        select(Post)
        .options(selectinload(Post.user))
        .where(*filters)
        .order_by(Post.created_at.desc())
        .limit(per_page)
        .offset(offset)
    )
    posts = (await db.execute(q)).scalars().all()

    liked_ids: set[uuid.UUID] = set()
    if current_user_id and posts:
        liked_q = select(Like.post_id).where(
            Like.user_id == current_user_id,
            Like.post_id.in_([p.id for p in posts]),
        )
        liked_ids = set((await db.execute(liked_q)).scalars().all())

    return PaginatedPosts(
        items=[_to_post_card(p, p.id in liked_ids) for p in posts],
        total=total,
        page=page,
        per_page=per_page,
        has_next=(offset + per_page) < total,
    )


# ── Helpers ────────────────────────────────────────────────────────────────

def _to_post_card(post: Post, liked_by_me: bool, distance_m: float | None = None) -> PostCard:
    return PostCard(
        id=post.id,
        user=post.user,
        food_name=post.food_name,
        restaurant_name=post.restaurant_name,
        price=float(post.price) if post.price else None,
        caption=post.caption,
        location_name=post.location_name,
        city=post.city,
        images=post.images,
        like_count=post.like_count,
        comment_count=post.comment_count,
        share_count=post.share_count,
        liked_by_me=liked_by_me,
        distance_km=round(distance_m / 1000, 2) if distance_m is not None else None,
        created_at=post.created_at,
    )
