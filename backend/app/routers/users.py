"""Users/Profile router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.user import UserPrivate, UserPublic, UserUpdate
from app.schemas.post import PaginatedPosts
from app.services import post_service, upload_service
from app.config import settings

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPrivate)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post_count = (
        await db.execute(
            select(func.count()).select_from(Post).where(
                Post.user_id == current_user.id, Post.is_active == True
            )
        )
    ).scalar_one()
    return UserPrivate(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        post_count=post_count,
        created_at=current_user.created_at,
    )


@router.patch("/me", response_model=UserPrivate)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check username uniqueness if changing
    if data.username and data.username != current_user.username:
        existing = (
            await db.execute(select(User).where(User.username == data.username))
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username taken")
        current_user.username = data.username

    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio

    await db.flush()

    post_count = (
        await db.execute(
            select(func.count()).select_from(Post).where(
                Post.user_id == current_user.id, Post.is_active == True
            )
        )
    ).scalar_one()

    return UserPrivate(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        post_count=post_count,
        created_at=current_user.created_at,
    )


@router.post("/me/avatar", status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await upload_service.save_image(file, subfolder="avatars")
    current_user.avatar_url = url
    await db.flush()
    return {"avatar_url": url}


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    post_count = (
        await db.execute(
            select(func.count()).select_from(Post).where(
                Post.user_id == user_id, Post.is_active == True
            )
        )
    ).scalar_one()

    return UserPublic(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
    )


@router.get("/{user_id}/posts", response_model=PaginatedPosts)
async def get_user_posts(
    user_id: uuid.UUID,
    page: int = 1,
    per_page: int = 12,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    per_page = min(per_page, settings.MAX_PAGE_SIZE)
    # Verify user exists
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return await post_service.get_user_posts(
        profile_user_id=user_id,
        db=db,
        page=page,
        per_page=per_page,
        current_user_id=current_user.id if current_user else None,
    )
