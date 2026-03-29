"""Posts router — create, feed, detail, delete."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.post import PostCreate, PostCard, PostDetail, PaginatedPosts
from app.services import post_service, upload_service
from app.config import settings

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostDetail, status_code=status.HTTP_201_CREATED)
async def create_post(
    # Text fields via multipart form
    food_name: Annotated[str, Form()],
    restaurant_name: Annotated[str, Form()],
    price: Annotated[float | None, Form()] = None,
    caption: Annotated[str | None, Form()] = None,
    location_name: Annotated[str | None, Form()] = None,
    address: Annotated[str | None, Form()] = None,
    city: Annotated[str | None, Form()] = None,
    latitude: Annotated[float | None, Form()] = None,
    longitude: Annotated[float | None, Form()] = None,
    # Image files — 1 to 5
    images: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not images or len(images) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide 1–5 images",
        )

    # Upload all images and collect URLs
    image_urls = []
    for img in images:
        url = await upload_service.save_image(img, subfolder="posts")
        image_urls.append(url)

    data = PostCreate(
        food_name=food_name,
        restaurant_name=restaurant_name,
        price=price,
        caption=caption,
        location_name=location_name,
        address=address,
        city=city,
        latitude=latitude,
        longitude=longitude,
    )
    post = await post_service.create_post(data, image_urls, current_user.id, db)

    return await post_service.get_post_by_id(post.id, db, current_user.id)


@router.get("/feed", response_model=PaginatedPosts)
async def get_feed(
    lat: float | None = None,
    lng: float | None = None,
    radius: int = 10,
    city: str | None = None,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    per_page = min(per_page, settings.MAX_PAGE_SIZE)
    return await post_service.get_feed(
        db=db,
        page=page,
        per_page=per_page,
        lat=lat,
        lng=lng,
        radius_km=float(radius),
        city=city,
        current_user_id=current_user.id if current_user else None,
    )


@router.get("/{post_id}", response_model=PostDetail)
async def get_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    return await post_service.get_post_by_id(
        post_id, db, current_user.id if current_user else None
    )


@router.delete("/{post_id}", status_code=status.HTTP_200_OK)
async def delete_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await post_service.delete_post(post_id, current_user.id, db)
    return {"message": "Post deleted"}
