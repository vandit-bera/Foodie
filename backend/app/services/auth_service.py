"""
Auth business logic: register, login, refresh, logout.
Keeps JWT and DB concerns out of the router layer.
"""
from datetime import datetime, timezone

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


async def register_user(data: SignupRequest, db: AsyncSession) -> tuple[User, str, str]:
    """Create a new user and return (user, access_token, refresh_token)."""
    # Check uniqueness
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or username already taken")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()  # get user.id before commit

    access, refresh, expiry = await _issue_tokens(user, db)
    return user, access, refresh


async def login_user(data: LoginRequest, db: AsyncSession) -> tuple[User, str, str]:
    """Verify credentials and return (user, access_token, refresh_token)."""
    result = await db.execute(select(User).where(User.email == data.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access, refresh, expiry = await _issue_tokens(user, db)
    return user, access, refresh


async def refresh_tokens(raw_refresh: str, db: AsyncSession) -> tuple[User, str, str]:
    """Rotate refresh token and return new pair."""
    # Validate JWT
    try:
        payload = decode_token(raw_refresh)
        if payload.get("type") != "refresh":
            raise ValueError
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Ensure token exists in DB (rotation invalidates old ones)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == raw_refresh)
    )
    db_token = result.scalar_one_or_none()
    if not db_token or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    # Load user
    user_result = await db.execute(select(User).where(User.id == db_token.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Delete old token
    await db.delete(db_token)
    await db.flush()

    access, refresh, expiry = await _issue_tokens(user, db)
    return user, access, refresh


async def logout_user(raw_refresh: str, db: AsyncSession) -> None:
    """Invalidate the refresh token."""
    await db.execute(delete(RefreshToken).where(RefreshToken.token == raw_refresh))


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _issue_tokens(user: User, db: AsyncSession) -> tuple[str, str, datetime]:
    """Create and persist a new access+refresh token pair."""
    access = create_access_token(str(user.id))
    refresh_raw, expiry = create_refresh_token(str(user.id))

    db_token = RefreshToken(user_id=user.id, token=refresh_raw, expires_at=expiry)
    db.add(db_token)

    return access, refresh_raw, expiry
