"""
Foodie API — FastAPI application entry point.

Startup order:
  1. CORS middleware
  2. Static file serving (media uploads)
  3. All routers under /api/v1
  4. Health check endpoint
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, posts, likes, comments, search, users, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure media directories exist on startup
    Path(settings.MEDIA_DIR).mkdir(parents=True, exist_ok=True)
    (Path(settings.MEDIA_DIR) / "posts").mkdir(exist_ok=True)
    (Path(settings.MEDIA_DIR) / "avatars").mkdir(exist_ok=True)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static media files ────────────────────────────────────────────────────────
# Served at /media/** in development
# In production, offload to Nginx / CDN
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

# ── API routers ───────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router,     prefix=API_PREFIX)
app.include_router(users.router,    prefix=API_PREFIX)
app.include_router(posts.router,    prefix=API_PREFIX)
app.include_router(likes.router,    prefix=API_PREFIX)
app.include_router(comments.router, prefix=API_PREFIX)
app.include_router(search.router,   prefix=API_PREFIX)
app.include_router(upload.router,   prefix=API_PREFIX)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
