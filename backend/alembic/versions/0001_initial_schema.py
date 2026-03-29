"""Initial schema — users, posts, likes, comments, refresh_tokens + PostGIS triggers

Revision ID: 0001
Revises:
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import geoalchemy2

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extensions ────────────────────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── shared updated_at trigger function ────────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)

    # ── users ─────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("username", sa.String(30), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_username", "users", ["username"])
    op.execute("""
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)

    # ── posts ─────────────────────────────────────────────────────────────
    op.create_table(
        "posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("food_name", sa.String(100), nullable=False),
        sa.Column("restaurant_name", sa.String(150), nullable=False),
        sa.Column("price", sa.Numeric(8, 2), nullable=True),
        sa.Column("caption", sa.Text, nullable=True),
        sa.Column("location_name", sa.String(200), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("location", geoalchemy2.Geography(geometry_type="POINT", srid=4326), nullable=True),
        sa.Column("images", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("like_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("comment_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("share_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("idx_posts_location", "posts", ["location"], postgresql_using="gist")
    op.create_index("idx_posts_created_at", "posts", ["created_at"])
    op.create_index("idx_posts_user_id_created", "posts", ["user_id", "created_at"])
    op.create_index("idx_posts_city", "posts", ["city"])
    op.execute("CREATE INDEX idx_posts_food_name_trgm ON posts USING GIN (food_name gin_trgm_ops)")
    op.execute("CREATE INDEX idx_posts_restaurant_trgm ON posts USING GIN (restaurant_name gin_trgm_ops)")

    # Auto-populate PostGIS geography column from lat/lng
    op.execute("""
        CREATE OR REPLACE FUNCTION set_post_location()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
                NEW.location = ST_SetSRID(
                    ST_MakePoint(NEW.longitude::float, NEW.latitude::float), 4326
                )::GEOGRAPHY;
            END IF;
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("""
        CREATE TRIGGER trg_posts_set_location
        BEFORE INSERT OR UPDATE ON posts
        FOR EACH ROW EXECUTE FUNCTION set_post_location()
    """)

    # ── likes ─────────────────────────────────────────────────────────────
    op.create_table(
        "likes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.UniqueConstraint("user_id", "post_id", name="uq_likes_user_post"),
    )
    op.create_index("idx_likes_user_post", "likes", ["user_id", "post_id"])
    op.create_index("idx_likes_post_id", "likes", ["post_id"])

    # Triggers: keep like_count in sync
    op.execute("""
        CREATE OR REPLACE FUNCTION increment_like_count()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION decrement_like_count()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("CREATE TRIGGER trg_likes_insert AFTER INSERT ON likes FOR EACH ROW EXECUTE FUNCTION increment_like_count()")
    op.execute("CREATE TRIGGER trg_likes_delete AFTER DELETE ON likes FOR EACH ROW EXECUTE FUNCTION decrement_like_count()")

    # ── comments ──────────────────────────────────────────────────────────
    op.create_table(
        "comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", UUID(as_uuid=True), sa.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("char_length(body) BETWEEN 1 AND 1000", name="chk_comment_body_length"),
    )
    op.create_index("idx_comments_post_id", "comments", ["post_id", "created_at"])
    op.create_index("idx_comments_parent_id", "comments", ["parent_id"])
    op.create_index("idx_comments_user_id", "comments", ["user_id"])
    op.execute("CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    # Triggers: keep comment_count in sync (top-level only)
    op.execute("""
        CREATE OR REPLACE FUNCTION increment_comment_count()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.parent_id IS NULL THEN
                UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION decrement_comment_count()
        RETURNS TRIGGER AS $$
        BEGIN
            IF OLD.parent_id IS NULL THEN
                UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
            END IF;
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("CREATE TRIGGER trg_comments_insert AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION increment_comment_count()")
    op.execute("CREATE TRIGGER trg_comments_delete AFTER DELETE ON comments FOR EACH ROW EXECUTE FUNCTION decrement_comment_count()")

    # ── refresh_tokens ────────────────────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(512), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("idx_refresh_tokens_token", "refresh_tokens", ["token"])
    op.create_index("idx_refresh_tokens_user_id", "refresh_tokens", ["user_id"])


def downgrade() -> None:
    op.drop_table("refresh_tokens")
    op.drop_table("comments")
    op.drop_table("likes")
    op.drop_table("posts")
    op.drop_table("users")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column CASCADE")
    op.execute("DROP FUNCTION IF EXISTS set_post_location CASCADE")
    op.execute("DROP FUNCTION IF EXISTS increment_like_count CASCADE")
    op.execute("DROP FUNCTION IF EXISTS decrement_like_count CASCADE")
    op.execute("DROP FUNCTION IF EXISTS increment_comment_count CASCADE")
    op.execute("DROP FUNCTION IF EXISTS decrement_comment_count CASCADE")
