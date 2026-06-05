from __future__ import annotations

from fastapi import APIRouter

from app.schemas.price import PricePredictionRequest
from app.services.price_service import list_price_models, predict_price


router = APIRouter()


@router.get("/models/price")
def price_models() -> list[dict[str, int | str]]:
    return list_price_models()


@router.post("/predict-price")
def predict_price_route(payload: PricePredictionRequest) -> dict[str, object]:
    return predict_price(payload)
