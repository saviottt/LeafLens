"""PlantCare AI — FastAPI application entry point."""
from __future__ import annotations

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, UPLOAD_DIR
from app.database import init_db
from app.routes import analysis, reports, auth, chatbot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="PlantCare AI",
    description="AI-powered plant disease detection API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(analysis.router)
app.include_router(reports.router)
app.include_router(chatbot.router)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "PlantCare AI"}
