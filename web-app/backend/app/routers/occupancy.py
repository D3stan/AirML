from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.schemas.occupancy import OccupancyPredictionRequest
from app.services.occupancy_service import list_occupancy_models, predict_occupancy


router = APIRouter()


@router.get("/models/occupancy")
def occupancy_models() -> list[dict[str, int | str]]:
    return list_occupancy_models()


@router.post("/predict-occupancy")
def predict_occupancy_route(payload: OccupancyPredictionRequest) -> dict[str, Any]:
    return predict_occupancy(payload)
