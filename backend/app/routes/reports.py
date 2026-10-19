"""PlantCare AI — Reports routes (CRUD)."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request, Query

from app.database import get_db
from app.routes.auth import get_current_user
from app.schemas import ReportResponse, AnalysisResult, DashboardStats, ReportSummary

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("")
async def save_report(request: Request):
    """Save analysis results as a report (from frontend)."""
    user = get_current_user(request)
    body = await request.json()

    required = ["image_filename", "analysis"]
    for field in required:
        if field not in body:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    analysis = body["analysis"]
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO reports
               (user_id, image_filename, crop_type, symptoms, language,
                analysis_json, is_plant_image, plant_name, disease_name,
                severity, confidence)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user.user_id,
                body["image_filename"],
                body.get("crop_type", ""),
                body.get("symptoms", ""),
                body.get("language", "en"),
                json.dumps(analysis),
                1 if analysis.get("is_plant_image", False) else 0,
                analysis.get("plant_name", ""),
                analysis.get("disease_name", ""),
                analysis.get("severity", ""),
                analysis.get("confidence", 0.0),
            ),
        )
        report_id = cursor.lastrowid

    return {"message": "Report saved", "report_id": report_id}


@router.get("")
async def list_reports(
    request: Request,
    search: str = Query("", max_length=100),
    crop: str = Query("", max_length=50),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List the current user's reports with optional filters."""
    user = get_current_user(request)

    query = "SELECT * FROM reports WHERE user_id = ?"
    params: list = [user.user_id]

    if search:
        query += " AND (plant_name LIKE ? OR disease_name LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like])

    if crop:
        query += " AND crop_type = ?"
        params.append(crop)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as db:
        rows = db.execute(query, params).fetchall()
        total = db.execute(
            "SELECT COUNT(*) as cnt FROM reports WHERE user_id = ?",
            (user.user_id,),
        ).fetchone()["cnt"]

    reports = []
    for row in rows:
        try:
            analysis = json.loads(row["analysis_json"])
        except (json.JSONDecodeError, TypeError):
            analysis = {}

        reports.append({
            "id": row["id"],
            "user_id": row["user_id"],
            "image_filename": row["image_filename"],
            "crop_type": row["crop_type"],
            "symptoms": row["symptoms"],
            "language": row["language"],
            "analysis": analysis,
            "created_at": row["created_at"],
        })

    return {"reports": reports, "total": total}


@router.get("/stats")
async def dashboard_stats(request: Request):
    """Return dashboard statistics for the current user."""
    user = get_current_user(request)

    with get_db() as db:
        total = db.execute(
            "SELECT COUNT(*) as cnt FROM reports WHERE user_id = ?",
            (user.user_id,),
        ).fetchone()["cnt"]

        diseases = db.execute(
            "SELECT COUNT(*) as cnt FROM reports WHERE user_id = ? AND disease_name != '' AND disease_name IS NOT NULL",
            (user.user_id,),
        ).fetchone()["cnt"]

        healthy = db.execute(
            "SELECT COUNT(*) as cnt FROM reports WHERE user_id = ? AND (disease_name = '' OR disease_name IS NULL)",
            (user.user_id,),
        ).fetchone()["cnt"]

        # Crop counts
        crop_rows = db.execute(
            "SELECT crop_type, COUNT(*) as cnt FROM reports WHERE user_id = ? AND crop_type != '' GROUP BY crop_type ORDER BY cnt DESC",
            (user.user_id,),
        ).fetchall()
        crop_counts = {row["crop_type"]: row["cnt"] for row in crop_rows}

        # Disease counts
        disease_rows = db.execute(
            "SELECT disease_name, COUNT(*) as cnt FROM reports WHERE user_id = ? AND disease_name != '' GROUP BY disease_name ORDER BY cnt DESC LIMIT 10",
            (user.user_id,),
        ).fetchall()
        disease_counts = {row["disease_name"]: row["cnt"] for row in disease_rows}

        # Recent reports
        recent = db.execute(
            "SELECT id, plant_name, disease_name, severity, confidence, crop_type, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
            (user.user_id,),
        ).fetchall()

    recent_reports = [
        {
            "id": r["id"],
            "plant_name": r["plant_name"] or "Unknown",
            "disease_name": r["disease_name"] or "None detected",
            "severity": r["severity"] or "N/A",
            "confidence": r["confidence"] or 0.0,
            "crop_type": r["crop_type"] or "",
            "created_at": r["created_at"],
        }
        for r in recent
    ]

    return {
        "total_analyses": total,
        "diseases_detected": diseases,
        "healthy_plants": healthy,
        "crop_counts": crop_counts,
        "disease_counts": disease_counts,
        "recent_reports": recent_reports,
    }


@router.get("/{report_id}")
async def get_report(report_id: int, request: Request):
    """Get a single report by ID."""
    user = get_current_user(request)

    with get_db() as db:
        row = db.execute(
            "SELECT * FROM reports WHERE id = ? AND user_id = ?",
            (report_id, user.user_id),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        analysis = json.loads(row["analysis_json"])
    except (json.JSONDecodeError, TypeError):
        analysis = {}

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "image_filename": row["image_filename"],
        "crop_type": row["crop_type"],
        "symptoms": row["symptoms"],
        "language": row["language"],
        "analysis": analysis,
        "created_at": row["created_at"],
    }


@router.delete("/{report_id}")
async def delete_report(report_id: int, request: Request):
    """Delete a report (only the owner can delete)."""
    user = get_current_user(request)

    with get_db() as db:
        row = db.execute(
            "SELECT id FROM reports WHERE id = ? AND user_id = ?",
            (report_id, user.user_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Report not found")
        db.execute("DELETE FROM reports WHERE id = ?", (report_id,))

    return {"message": "Report deleted successfully"}
