"""User Pydantic schemas."""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
import re


class UserPublic(BaseModel):
    """Minimal user info shown in posts/comments."""
    id: uuid.UUID
    username: str
    full_name: str | None
    avatar_url: str | None

    model_config = {"from_attributes": True}


class UserPrivate(UserPublic):
    """Full user info returned to the authenticated user themselves."""
    email: str
    bio: str | None
    post_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """PATCH /users/me — all fields optional."""
    full_name: str | None = None
    username: str | None = None
    bio: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", v):
            raise ValueError("Username must be 3–30 chars, alphanumeric + underscores only")
        return v
