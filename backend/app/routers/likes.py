"""Likes router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.like import Like
from app.middleware.auth import get_current_user
from app.schemas.like import LikeResponse, LikeUserItem, PaginatedLikes
from app.config import settings

router = APIRouter(prefix="/posts", tags=["likes"])


@router.post("/{post_id}/like", response_model=LikeResponse)
async def like_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify post exists
    post = (await db.execute(select(Post).where(Post.id == post_id, Post.is_active == True))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check duplicate
    existing = (
        await db.execute(select(Like).where(Like.user_id == current_user.id, Like.post_id == post_id))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already liked")

    like = Like(user_id=current_user.id, post_id=post_id)
    db.add(like)
    await db.flush()

    # Refresh post to get updated count (DB trigger handles increment)
    await db.refresh(post)
    return LikeResponse(liked=True, like_count=post.like_count)


@router.delete("/{post_id}/like", response_model=LikeResponse)
async def unlike_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    like = (
        await db.execute(select(Like).where(Like.user_id == current_user.id, Like.post_id == post_id))
    ).scalar_one_or_none()
    if not like:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Like not found")

    await db.delete(like)
    await db.flush()

    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    return LikeResponse(liked=False, like_count=post.like_count if post else 0)


@router.get("/{post_id}/likes", response_model=PaginatedLikes)
async def get_likes(
    post_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db),
):
    per_page = min(per_page, settings.MAX_PAGE_SIZE)
    offset = (page - 1) * per_page

    total = (
        await db.execute(select(func.count()).select_from(Like).where(Like.post_id == post_id))
    ).scalar_one()

    q = (
        select(Like, User)
        .join(User, User.id == Like.user_id)
        .where(Like.post_id == post_id)
        .order_by(Like.created_at.desc())
        .limit(per_page)
        .offset(offset)
    )
    rows = (await db.execute(q)).all()

    items = [
        LikeUserItem(
            id=user.id,
            username=user.username,
            avatar_url=user.avatar_url,
            liked_at=like.created_at,
        )
        for like, user in rows
    ]

    return PaginatedLikes(items=items, total=total, page=page, per_page=per_page, has_next=(offset + per_page) < total)
