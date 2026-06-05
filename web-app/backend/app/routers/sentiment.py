from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.services.sentiment_service import sentiment_analysis


router = APIRouter()


@router.post("/sentiment-analysis")
def sentiment_analysis_route(payload: dict[str, Any]) -> dict[str, Any]:
    return sentiment_analysis(payload)
