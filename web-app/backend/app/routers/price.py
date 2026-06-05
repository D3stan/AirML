from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.services.price_service import predict_price


router = APIRouter()


@router.post("/predict-price")
def predict_price_route(payload: dict[str, Any]) -> dict[str, Any]:
    return predict_price(payload)
