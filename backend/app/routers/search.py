"""Search router."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_optional_user
from app.schemas.post import PaginatedPosts
from app.services.search_service import search_posts
from app.config import settings

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/posts", response_model=PaginatedPosts)
async def search(
    q: str | None = None,
    city: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius: int = 10,
    min_price: float | None = None,
    max_price: float | None = None,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    per_page = min(per_page, settings.MAX_PAGE_SIZE)
    return await search_posts(
        db=db,
        q=q,
        city=city,
        lat=lat,
        lng=lng,
        radius_km=float(radius),
        min_price=min_price,
        max_price=max_price,
        page=page,
        per_page=per_page,
        current_user_id=current_user.id if current_user else None,
    )
