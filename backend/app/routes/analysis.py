"""PlantCare AI — Analysis route (image upload + Gemini)."""
from __future__ import annotations

import json
import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from PIL import Image
import io

from app.config import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_UPLOAD_SIZE_BYTES,
    UPLOAD_DIR,
    GEMINI_API_KEY,
)
from app.database import get_db
from app.routes.auth import get_current_user, get_optional_user
from app.services.gemini_service import analyze_plant_image

router = APIRouter(prefix="/api", tags=["analysis"])
logger = logging.getLogger(__name__)


def _validate_image(file_bytes: bytes, content_type: str, filename: str) -> str:
    """Validate image type/size and return the canonical MIME type."""
    # Check size
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB.",
        )

    # Check extension
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Validate with Pillow
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file")

    # Determine MIME type from actual image
    img = Image.open(io.BytesIO(file_bytes))
    fmt = img.format
    mime_map = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
    mime = mime_map.get(fmt, content_type)

    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Image format '{fmt}' is not supported.",
        )

    return mime


@router.post("/analyze")
async def analyze(
    request: Request,
    image: UploadFile = File(...),
    crop: str = Form(""),
    symptoms: str = Form(""),
    language: str = Form("en"),
):
    """Upload a plant image and get AI analysis."""
    # Advisory if API key is not configured
    if not GEMINI_API_KEY or GEMINI_API_KEY.strip() == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY not configured. Running in simulated fallback mode.")

    # Validate language
    if language not in ("en", "ml"):
        language = "en"

    # Read and validate image
    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    mime_type = _validate_image(file_bytes, image.content_type or "", image.filename or "image.jpg")

    # Generate safe filename
    ext = Path(image.filename or "image.jpg").suffix.lower()
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / safe_filename

    # Save image
    file_path.write_bytes(file_bytes)

    # Run Gemini analysis
    try:
        result = await analyze_plant_image(
            image_bytes=file_bytes,
            mime_type=mime_type,
            crop=crop,
            symptoms=symptoms,
            language=language,
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # Auto-save report if user is logged in
    user = get_optional_user(request)
    report_id = None
    if user:
        with get_db() as db:
            cursor = db.execute(
                """INSERT INTO reports
                   (user_id, image_filename, crop_type, symptoms, language,
                    analysis_json, is_plant_image, plant_name, disease_name,
                    severity, confidence)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    user.user_id,
                    safe_filename,
                    crop,
                    symptoms,
                    language,
                    json.dumps(result),
                    1 if result.get("is_plant_image", False) else 0,
                    result.get("plant_name", ""),
                    result.get("disease_name", ""),
                    result.get("severity", ""),
                    result.get("confidence", 0.0),
                ),
            )
            report_id = cursor.lastrowid

    return {
        "success": True,
        "report_id": report_id,
        "image_filename": safe_filename,
        "analysis": result,
    }
