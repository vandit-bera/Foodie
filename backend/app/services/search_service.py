"""
Search service using PostgreSQL pg_trgm for fuzzy text matching.
Supports filtering by city, price range, and location radius.
"""
import uuid
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.post import Post
from app.models.like import Like
from app.schemas.post import PostCard, PaginatedPosts
from app.services.post_service import _to_post_card


async def search_posts(
    db: AsyncSession,
    q: str | None,
    city: str | None,
    lat: float | None,
    lng: float | None,
    radius_km: float,
    min_price: float | None,
    max_price: float | None,
    page: int,
    per_page: int,
    current_user_id: uuid.UUID | None,
) -> PaginatedPosts:
    offset = (page - 1) * per_page
    filters = [Post.is_active == True]

    # Text search using pg_trgm similarity
    if q:
        search_term = f"%{q}%"
        filters.append(
            or_(
                Post.food_name.ilike(search_term),
                Post.restaurant_name.ilike(search_term),
            )
        )

    if city:
        filters.append(func.lower(Post.city) == city.lower())

    if min_price is not None:
        filters.append(Post.price >= min_price)

    if max_price is not None:
        filters.append(Post.price <= max_price)

    # Location radius filter
    if lat is not None and lng is not None:
        point_wkt = f"SRID=4326;POINT({lng} {lat})"
        filters.append(
            func.ST_DWithin(
                Post.location,
                func.ST_GeogFromText(point_wkt),
                radius_km * 1000,
            )
        )

    total = (
        await db.execute(select(func.count()).select_from(Post).where(*filters))
    ).scalar_one()

    q_stmt = (
        select(Post)
        .options(selectinload(Post.user))
        .where(*filters)
        .order_by(Post.created_at.desc())
        .limit(per_page)
        .offset(offset)
    )
    posts = (await db.execute(q_stmt)).scalars().all()

    # liked_by_me check
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
