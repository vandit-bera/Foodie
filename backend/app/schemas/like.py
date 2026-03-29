"""Like Pydantic schemas."""
import uuid
from datetime import datetime
from pydantic import BaseModel


class LikeResponse(BaseModel):
    liked: bool
    like_count: int


class LikeUserItem(BaseModel):
    id: uuid.UUID
    username: str
    avatar_url: str | None
    liked_at: datetime

    model_config = {"from_attributes": True}


class PaginatedLikes(BaseModel):
    items: list[LikeUserItem]
    total: int
    page: int
    per_page: int
    has_next: bool
