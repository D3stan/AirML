from __future__ import annotations

from hashlib import sha256
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="AirML FastAPI Mock Backend",
    description="Mock backend for AirML university MVP",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _stable_score(payload: dict[str, Any], salt: str, modulo: int) -> int:
    source = repr(sorted(payload.items())) + salt
    digest = sha256(source.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % modulo


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "airml-backend"}


@app.post("/predict-price")
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


@app.post("/predict-occupancy")
def predict_occupancy(payload: dict[str, Any]) -> dict[str, Any]:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    seasonal = [15, 13, 18, 22, 21, 24, 26, 27, 24, 18, 15, 17]
    boost = _stable_score(payload, "occupancy", 5)
    monthly = {month: min(31, max(0, value + boost)) for month, value in zip(months, seasonal)}
    annual_days = sum(monthly.values())

    return {
        "model": payload.get("model", "Lasso"),
        "monthly": monthly,
        "annual_days": annual_days,
        "annual_revenue": annual_days * int(payload.get("daily_price", 135) or 135),
        "relativeError": 6,
        "accuracy": 94,
    }


@app.post("/sentiment-analysis")
def sentiment_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    text = str(payload.get("text", ""))
    positive_words = {"great", "excellent", "clean", "perfect", "amazing", "good"}
    negative_words = {"bad", "dirty", "poor", "noisy", "terrible", "broken"}
    tokens = {token.strip(".,!?;:").lower() for token in text.split()}
    score = len(tokens & positive_words) - len(tokens & negative_words)

    if score > 0:
        label = "positive"
    elif score < 0:
        label = "negative"
    else:
        label = "neutral"

    return {"sentiment": label, "score": score}
