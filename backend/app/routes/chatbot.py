"""PlantCare AI — Crop Profitability Chatbot Router."""
from __future__ import annotations

import logging
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.chatbot_service import get_crop_profitability_advice

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chatbot"])


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User question or query")
    location: Optional[str] = Field(None, max_length=150, description="Farmer location or region")
    crop: Optional[str] = Field(None, max_length=100, description="Selected crop name")
    timeframe: Optional[str] = Field("1 year", max_length=50, description="Planning horizon (e.g. 1 year, 2 years)")
    weather: Optional[str] = Field(None, max_length=200, description="Weather or rainfall context")
    history: Optional[list[dict[str, str]]] = Field(None, description="Recent conversation turns")


class ChatMessageResponse(BaseModel):
    success: bool
    reply: str
    crop: Optional[str] = None
    timeframe: Optional[str] = None
    model: str


@router.post("/crop-profitability", response_model=ChatMessageResponse)
async def chat_crop_profitability(payload: ChatMessageRequest):
    """
    Evaluate crop profitability over a 1 or 2 year timeframe based on location, weather, and costs.
    """
    try:
        result = await get_crop_profitability_advice(
            message=payload.message,
            location=payload.location,
            crop=payload.crop,
            timeframe=payload.timeframe,
            weather=payload.weather,
            history=payload.history,
        )
        return ChatMessageResponse(
            success=result.get("success", True),
            reply=result.get("reply", "No advice generated. Please try again."),
            crop=result.get("crop"),
            timeframe=result.get("timeframe"),
            model=result.get("model", "gemini-3.8-flash"),
        )
    except Exception as exc:
        logger.error("Chatbot router error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot service encountered an issue: {exc}",
        )
