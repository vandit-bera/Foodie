"""Post ORM model — includes spatial location column via GeoAlchemy2."""
import uuid
from datetime import datetime

from sqlalchemy import (
    String, Text, Numeric, Integer, Boolean,
    DateTime, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geography

from app.database import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Food details
    food_name: Mapped[str] = mapped_column(String(100), nullable=False)
    restaurant_name: Mapped[str] = mapped_column(String(150), nullable=False)
    price: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Human-readable location
    location_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # Spatial coordinates
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    # PostGIS GEOGRAPHY column — populated by DB trigger from lat/lng
    location: Mapped[object | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True
    )

    # Images stored as JSON array: [{"url": "...", "order": 1}, ...]
    images: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    # Denormalized counts (updated by DB triggers)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    share_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="posts")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        # Spatial index for location queries
        Index("idx_posts_location", "location", postgresql_using="gist"),
        # Recency index for default feed sort
        Index("idx_posts_created_at", "created_at"),
        # User posts lookup
        Index("idx_posts_user_id_created", "user_id", "created_at"),
    )
