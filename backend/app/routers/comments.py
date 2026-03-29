"""Comments router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.middleware.auth import get_current_user
from app.schemas.comment import CommentCreate, CommentOut, PaginatedComments
from app.config import settings

router = APIRouter(prefix="/posts", tags=["comments"])


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: uuid.UUID,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify post
    post = (await db.execute(select(Post).where(Post.id == post_id, Post.is_active == True))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Validate parent belongs to same post
    if data.parent_id:
        parent = (await db.execute(select(Comment).where(Comment.id == data.parent_id))).scalar_one_or_none()
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid parent_id")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=data.parent_id,
        body=data.body,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment, ["user"])

    # Count replies
    reply_count = 0  # brand new comment has no replies

    return CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        user=comment.user,
        body=comment.body,
        parent_id=comment.parent_id,
        reply_count=reply_count,
        created_at=comment.created_at,
    )


@router.get("/{post_id}/comments", response_model=PaginatedComments)
async def get_comments(
    post_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
    parent_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    per_page = min(per_page, settings.MAX_PAGE_SIZE)
    offset = (page - 1) * per_page

    filters = [Comment.post_id == post_id]
    if parent_id:
        filters.append(Comment.parent_id == parent_id)
    else:
        filters.append(Comment.parent_id == None)  # noqa: E711 — SQLAlchemy needs ==

    total = (
        await db.execute(select(func.count()).select_from(Comment).where(*filters))
    ).scalar_one()

    q = (
        select(Comment)
        .options(selectinload(Comment.user))
        .where(*filters)
        .order_by(Comment.created_at.asc())
        .limit(per_page)
        .offset(offset)
    )
    comments = (await db.execute(q)).scalars().all()

    # Batch-count replies for each top-level comment
    comment_ids = [c.id for c in comments]
    reply_counts: dict[uuid.UUID, int] = {}
    if comment_ids and not parent_id:
        rc_q = (
            select(Comment.parent_id, func.count().label("cnt"))
            .where(Comment.parent_id.in_(comment_ids))
            .group_by(Comment.parent_id)
        )
        for row in (await db.execute(rc_q)).all():
            reply_counts[row[0]] = row[1]

    items = [
        CommentOut(
            id=c.id,
            post_id=c.post_id,
            user=c.user,
            body=c.body,
            parent_id=c.parent_id,
            reply_count=reply_counts.get(c.id, 0),
            created_at=c.created_at,
        )
        for c in comments
    ]

    return PaginatedComments(items=items, total=total, page=page, per_page=per_page, has_next=(offset + per_page) < total)


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_200_OK)
async def delete_comment(
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = (await db.execute(select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id))).scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    # Post owner can delete any comment; comment owner can delete their own
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    is_post_owner = post and post.user_id == current_user.id
    if comment.user_id != current_user.id and not is_post_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    await db.delete(comment)
    return {"message": "Comment deleted"}
