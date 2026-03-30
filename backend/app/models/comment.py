"""Comment ORM model — supports nested replies via self-referential parent_id."""
import uuid
from datetime import datetime

from sqlalchemy import Text, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref
from sqlalchemy.sql import func

from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # Null = top-level comment; UUID = reply to another comment
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    # Self-referential: one comment (parent) has many replies
    # remote_side on the backref makes "parent" a many-to-one accessor
    replies = relationship(
        "Comment",
        backref=backref("parent", remote_side="Comment.id"),
        foreign_keys="[Comment.parent_id]",
        lazy="select",
    )

    __table_args__ = (
        CheckConstraint("char_length(body) BETWEEN 1 AND 1000", name="chk_comment_body_length"),
        Index("idx_comments_post_id", "post_id", "created_at"),
        Index("idx_comments_parent_id", "parent_id"),
        Index("idx_comments_user_id", "user_id"),
    )
