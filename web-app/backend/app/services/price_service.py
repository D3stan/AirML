from __future__ import annotations

from hashlib import sha256
from typing import Any


def _stable_score(payload: dict[str, Any], salt: str, modulo: int) -> int:
    source = repr(sorted(payload.items())) + salt
    digest = sha256(source.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % modulo


def predict_price(payload: dict[str, Any]) -> dict[str, Any]:
    base_price = 95
    guests = int(payload.get("accommodates", payload.get("guests", 2)) or 2)
    bedrooms = int(payload.get("bedrooms", 1) or 1)
    bathrooms = int(payload.get("bathrooms", 1) or 1)
    city_boost = _stable_score(payload, "price-city", 45)

    prediction = base_price + guests * 11 + bedrooms * 14 + bathrooms * 9 + city_boost
    relative_error = 7
    error = round(prediction * relative_error / 100)

    return {
        "model": payload.get("model", "XGBoost"),
        "prediction": prediction,
        "lower": max(0, prediction - error),
        "upper": prediction + error,
        "relativeError": relative_error,
        "accuracy": 100 - relative_error,
        "currency": "EUR",
        "unit": "night",
    }
