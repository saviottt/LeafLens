"""PlantCare AI — Pydantic schemas for request/response validation."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(default="", max_length=100)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str


class TokenData(BaseModel):
    user_id: int
    username: str


# ── Analysis ──────────────────────────────────────────────────────
class AnalysisResult(BaseModel):
    is_plant_image: bool = True
    plant_name: str = ""
    plant_part: str = ""
    health_status: str = ""
    disease_name: str = ""
    confidence: float = 0.0
    confidence_explanation: str = ""
    symptoms_observed: list[str] = Field(default_factory=list)
    possible_causes: list[str] = Field(default_factory=list)
    severity: str = ""
    explanation: str = ""
    recommended_actions: list[str] = Field(default_factory=list)
    prevention_tips: list[str] = Field(default_factory=list)
    professional_help_needed: bool = False
    limitations: str = ""


# ── Reports ───────────────────────────────────────────────────────
class ReportResponse(BaseModel):
    id: int
    user_id: int
    image_filename: str
    crop_type: str
    symptoms: str
    language: str
    analysis: AnalysisResult
    created_at: str


class ReportSummary(BaseModel):
    id: int
    plant_name: str
    disease_name: str
    severity: str
    confidence: float
    crop_type: str
    created_at: str


class DashboardStats(BaseModel):
    total_analyses: int = 0
    diseases_detected: int = 0
    healthy_plants: int = 0
    crop_counts: dict[str, int] = Field(default_factory=dict)
    disease_counts: dict[str, int] = Field(default_factory=dict)
    recent_reports: list[ReportSummary] = Field(default_factory=list)
