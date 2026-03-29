"""Standalone image upload endpoint."""
from fastapi import APIRouter, Depends, UploadFile, File
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.upload_service import save_image
import os

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    url = await save_image(file, subfolder="posts")
    return {
        "url": url,
        "filename": os.path.basename(url),
        "size_bytes": file.size,
    }
