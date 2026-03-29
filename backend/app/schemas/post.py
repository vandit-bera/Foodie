"""Post Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, field_validator
from app.schemas.user import UserPublic


class ImageItem(BaseModel):
    url: str
    order: int


class PostCreate(BaseModel):
    """Fields accepted when creating a post (non-file fields via form)."""
    food_name: str
    restaurant_name: str
    price: float | None = None
    caption: str | None = None
    location_name: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("caption")
    @classmethod
    def cap_caption(cls, v: str | None) -> str | None:
        if v and len(v) > 500:
            raise ValueError("Caption max 500 characters")
        return v

    @field_validator("food_name", "restaurant_name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class PostCard(BaseModel):
    """Compact post representation shown in feeds."""
    id: uuid.UUID
    user: UserPublic
    food_name: str
    restaurant_name: str
    price: float | None
    caption: str | None
    location_name: str | None
    city: str | None
    images: list[Any]           # raw JSONB list
    like_count: int
    comment_count: int
    share_count: int
    liked_by_me: bool = False
    distance_km: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PostDetail(PostCard):
    """Full post with address and coordinates."""
    address: str | None
    latitude: float | None
    longitude: float | None

    model_config = {"from_attributes": True}


class PaginatedPosts(BaseModel):
    items: list[PostCard]
    total: int
    page: int
    per_page: int
    has_next: bool
