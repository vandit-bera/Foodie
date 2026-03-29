"""Comment Pydantic schemas."""
import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.schemas.user import UserPublic


class CommentCreate(BaseModel):
    body: str
    parent_id: uuid.UUID | None = None

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        v = v.strip()
        if not (1 <= len(v) <= 1000):
            raise ValueError("Comment must be 1–1000 characters")
        return v


class CommentOut(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    user: UserPublic
    body: str
    parent_id: uuid.UUID | None
    reply_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedComments(BaseModel):
    items: list[CommentOut]
    total: int
    page: int
    per_page: int
    has_next: bool
