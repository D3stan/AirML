from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.schemas.occupancy import OccupancyPredictionRequest
from app.services.occupancy_service import list_occupancy_models, predict_occupancy, settings_options


router = APIRouter()


@router.get("/models/occupancy")
def occupancy_models() -> list[dict[str, int | str]]:
    return list_occupancy_models()


@router.get("/settings/options")
def get_settings_options() -> dict[str, Any]:
    return settings_options()


@router.post("/predict-occupancy")
def predict_occupancy_route(payload: OccupancyPredictionRequest) -> dict[str, Any]:
    return predict_occupancy(payload)
