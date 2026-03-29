"""Auth router — signup, login, refresh, logout."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import (
    SignupRequest, LoginRequest, RefreshRequest, LogoutRequest, TokenResponse
)
from app.schemas.user import UserPrivate
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token_response(user, access: str, refresh: str) -> TokenResponse:
    return TokenResponse(
        user=UserPrivate(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            post_count=0,
            created_at=user.created_at,
        ),
        access_token=access,
        refresh_token=refresh,
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    user, access, refresh = await auth_service.register_user(data, db)
    return _build_token_response(user, access, refresh)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, access, refresh = await auth_service.login_user(data, db)
    return _build_token_response(user, access, refresh)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    user, access, refresh = await auth_service.refresh_tokens(data.refresh_token, db)
    return _build_token_response(user, access, refresh)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(data: LogoutRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.logout_user(data.refresh_token, db)
    return {"message": "Logged out successfully"}
