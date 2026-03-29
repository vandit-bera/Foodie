"""
Image upload service.
Dev: saves files to local MEDIA_DIR.
Prod: swap save_image() to upload to S3 / Cloudflare R2 by changing this module only.
"""
import uuid
import os
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

# Ensure media directories exist
POSTS_DIR = Path(settings.MEDIA_DIR) / "posts"
AVATARS_DIR = Path(settings.MEDIA_DIR) / "avatars"
POSTS_DIR.mkdir(parents=True, exist_ok=True)
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

MAX_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024


async def save_image(file: UploadFile, subfolder: str = "posts") -> str:
    """
    Validate and persist an uploaded image.
    Returns the public URL path (e.g. '/media/posts/abc.jpg').
    """
    # Validate content type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WEBP.",
        )

    content = await file.read()

    # Validate size
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image too large. Max {settings.MAX_IMAGE_SIZE_MB}MB.",
        )

    # Generate unique filename preserving extension
    ext = _ext_from_content_type(file.content_type)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = Path(settings.MEDIA_DIR) / subfolder / filename

    with open(dest, "wb") as f:
        f.write(content)

    return f"/media/{subfolder}/{filename}"


def _ext_from_content_type(content_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(content_type, ".jpg")
