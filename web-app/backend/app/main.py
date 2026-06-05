from __future__ import annotations

import json
import logging
import math
import sys
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


logger = logging.getLogger("airml-backend")

MONTHS: tuple[tuple[str, int, int], ...] = (
    ("Jan", 1, 31),
    ("Feb", 2, 28),
    ("Mar", 3, 31),
    ("Apr", 4, 30),
    ("May", 5, 31),
    ("Jun", 6, 30),
    ("Jul", 7, 31),
    ("Aug", 8, 31),
    ("Sep", 9, 30),
    ("Oct", 10, 31),
    ("Nov", 11, 30),
    ("Dec", 12, 31),
)

WEB_APP_DIR = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = WEB_APP_DIR / "artifacts"
OCCUPANCY_PREPROCESSOR_PATH = ARTIFACTS_DIR / "occ_model_preprocessor.joblib"
OCCUPANCY_MODEL_PATH = ARTIFACTS_DIR / "occ_model_xgboost.joblib"
OCCUPANCY_TEMPLATE_PATH = ARTIFACTS_DIR / "occ_model_payload.json"

OCCUPANCY_MODELS: dict[str, dict[str, Any]] = {
    "xgboost": {
        "id": "xgboost",
        "name": "XGBoost",
        "accuracy": 82,
        "relativeError": 3,
        "model_path": OCCUPANCY_MODEL_PATH,
    }
}

KNOWN_AMENITY_FEATURES = {
    "Air conditioning",
    "Bed linens",
    "Bidet",
    "Carbon monoxide alarm",
    "Cooking basics",
    "Dining table",
    "Dishes and silverware",
    "Essentials",
    "Fire extinguisher",
    "Freezer",
    "Hair dryer",
    "Hangers",
    "Heating",
    "Hot water",
    "Iron",
    "Kitchen",
    "Other",
    "Refrigerator",
    "Shampoo",
    "TV",
    "Wifi",
}

CITY_TO_TRAINING_VALUE = {
    "Bologna": "bologna",
    "Florence": "firenze",
    "Milan": "milano",
    "Naples": "napoli",
    "Rome": "roma",
    "Venice": "venezia",
}

SUPPORTED_ROOM_TYPES = {"Entire home/apt", "Hotel room", "Private room", "Shared room"}
SUPPORTED_PROPERTY_TYPES = {
    "Entire condo",
    "Entire home",
    "Entire loft",
    "Entire rental unit",
    "Entire serviced apartment",
    "Entire townhouse",
    "Entire vacation home",
    "Entire villa",
    "Other",
    "Private room in bed and breakfast",
    "Private room in condo",
    "Private room in home",
    "Private room in rental unit",
    "Room in hotel",
    "Tiny home",
    "Trullo",
}


app = FastAPI(
    title="AirML FastAPI Backend",
    description="Backend for AirML university MVP",
    version="0.2.0",
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


class ReviewPayload(BaseModel):
    id: str | None = None
    text: str = ""


class PropertySettingsPayload(BaseModel):
    city: str | None = None
    neighbourhood_cleansed: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    property_type: str | None = None
    room_type: str | None = None
    amenities: list[str] = Field(default_factory=list)
    accommodates: float | None = Field(default=None, ge=1)
    bathrooms: float | None = Field(default=None, ge=0)
    bedrooms: float | None = Field(default=None, ge=0)
    beds: float | None = Field(default=None, ge=0)
    nightly_price: float | None = Field(default=None, ge=0)
    minimum_nights: float | None = Field(default=None, ge=1)
    maximum_nights: float | None = Field(default=None, ge=1)
    instant_bookable: bool | None = None
    has_availability: bool | None = None
    has_reviews: bool | None = None
    review_frequency_days: float | None = Field(default=None, ge=1)
    reviews: list[ReviewPayload] = Field(default_factory=list)


class OccupancyPredictionRequest(BaseModel):
    model_id: str
    property: PropertySettingsPayload


def _stable_score(payload: dict[str, Any], salt: str, modulo: int) -> int:
    source = repr(sorted(payload.items())) + salt
    digest = sha256(source.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % modulo


def _missing_artifact_error(path: Path) -> HTTPException:
    message = f"Missing occupancy artifact: {path}"
    logger.error(message)
    return HTTPException(status_code=503, detail=message)


def _ensure_artifact(path: Path) -> None:
    if not path.exists():
        raise _missing_artifact_error(path)


class MLBTransformer:  # pragma: no cover - needed only for legacy joblib payloads
    def __init__(self) -> None:
        from sklearn.preprocessing import MultiLabelBinarizer

        self.mlb = MultiLabelBinarizer(sparse_output=False)

    def fit(self, x, y=None):
        self.mlb.fit(x)
        return self

    def transform(self, x):
        return self.mlb.transform(x)

    def get_feature_names_out(self, input_features=None):
        import numpy as np

        return np.array([c for c in self.mlb.classes_])


@lru_cache(maxsize=1)
def _load_occupancy_template() -> dict[str, Any]:
    _ensure_artifact(OCCUPANCY_TEMPLATE_PATH)
    try:
        with OCCUPANCY_TEMPLATE_PATH.open(encoding="utf-8") as payload_file:
            template = json.load(payload_file)
    except Exception as exc:  # pragma: no cover - corrupt local artifact
        message = f"Unable to load occupancy template at {OCCUPANCY_TEMPLATE_PATH}: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    if not isinstance(template, dict):
        message = f"Occupancy template must be a JSON object: {OCCUPANCY_TEMPLATE_PATH}"
        logger.error(message)
        raise HTTPException(status_code=503, detail=message)

    return template


@lru_cache(maxsize=1)
def _load_occupancy_artifacts():
    _ensure_artifact(OCCUPANCY_PREPROCESSOR_PATH)
    _ensure_artifact(OCCUPANCY_MODEL_PATH)

    try:
        import joblib
    except Exception as exc:
        message = f"Missing backend ML dependency while loading occupancy artifacts: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    try:
        setattr(sys.modules["__main__"], "MLBTransformer", MLBTransformer)
        preprocessor = joblib.load(OCCUPANCY_PREPROCESSOR_PATH)
        model = joblib.load(OCCUPANCY_MODEL_PATH)
    except Exception as exc:
        message = (
            "Unable to load occupancy artifacts "
            f"preprocessor={OCCUPANCY_PREPROCESSOR_PATH}, model={OCCUPANCY_MODEL_PATH}: {exc}"
        )
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    return preprocessor, model


def _set_if_present(feature_row: dict[str, Any], key: str, value: Any) -> None:
    if key in feature_row and value is not None:
        feature_row[key] = value


def _as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _build_feature_row(template: dict[str, Any], property_payload: PropertySettingsPayload, month_number: int) -> dict[str, Any]:
    feature_row = dict(template)
    property_data = property_payload.model_dump() if hasattr(property_payload, "model_dump") else property_payload.dict()

    direct_fields = {
        "accommodates": property_data.get("accommodates"),
        "bathrooms": property_data.get("bathrooms"),
        "bedrooms": property_data.get("bedrooms"),
        "beds": property_data.get("beds"),
        "minimum_nights": property_data.get("minimum_nights"),
        "price": property_data.get("nightly_price"),
    }

    for key, raw_value in direct_fields.items():
        number = _as_float(raw_value)
        if number is not None:
            _set_if_present(feature_row, key, number)

    city_value = CITY_TO_TRAINING_VALUE.get(property_payload.city or "", "roma")
    _set_if_present(feature_row, "city", city_value)
    _set_if_present(feature_row, "geo_cluster", f"{city_value}_0")

    property_type = property_payload.property_type if property_payload.property_type in SUPPORTED_PROPERTY_TYPES else "Other"
    _set_if_present(feature_row, "property_type", property_type)

    room_type = property_payload.room_type if property_payload.room_type in SUPPORTED_ROOM_TYPES else "Entire home/apt"
    _set_if_present(feature_row, "room_type", room_type)

    amenities = {amenity.strip() for amenity in property_payload.amenities if amenity and amenity.strip()}
    feature_row["amenities"] = sorted(amenities)
    amenity_feature_names = [feature for feature in feature_row if feature in KNOWN_AMENITY_FEATURES]
    for amenity in amenity_feature_names:
        feature_row[amenity] = 1.0 if amenity in amenities else 0.0
    _set_if_present(feature_row, "n_amenities", float(len(amenities)))
    if "Other" in feature_row:
        known_selected_amenities = amenities & KNOWN_AMENITY_FEATURES
        feature_row["Other"] = 1.0 if len(known_selected_amenities) < len(amenities) else feature_row["Other"]

    accommodates = max(_as_float(property_payload.accommodates) or 0.0, 1.0)
    beds = _as_float(property_payload.beds)
    bedrooms = _as_float(property_payload.bedrooms)
    bathrooms = _as_float(property_payload.bathrooms)

    if beds is not None:
        _set_if_present(feature_row, "beds_per_person", beds / accommodates)
    if bedrooms is not None:
        _set_if_present(feature_row, "bedrooms_per_person", bedrooms / accommodates)
    if bathrooms is not None:
        _set_if_present(feature_row, "bathrooms_per_person", bathrooms / accommodates)
    if beds is not None and bedrooms is not None:
        _set_if_present(feature_row, "beds_per_bedroom", beds / max(bedrooms, 1.0))

    if property_payload.has_reviews is not None:
        _set_if_present(feature_row, "has_reviews", 1.0 if property_payload.has_reviews else 0.0)
        if not property_payload.has_reviews:
            _set_if_present(feature_row, "reviews_per_month", 0.0)
            _set_if_present(feature_row, "review_span_days", 0.0)
            _set_if_present(feature_row, "avg_days_between_reviews", 0.0)
            _set_if_present(feature_row, "days_since_last_review", 0.0)

    review_frequency_days = _as_float(property_payload.review_frequency_days)
    if property_payload.has_reviews and review_frequency_days:
        _set_if_present(feature_row, "avg_days_between_reviews", review_frequency_days)
        _set_if_present(feature_row, "reviews_per_month", 30.0 / review_frequency_days)

    feature_row["month_sin"] = math.sin(2 * math.pi * month_number / 12)
    feature_row["month_cos"] = math.cos(2 * math.pi * month_number / 12)

    return feature_row


def _coerce_prediction(value: Any, month_label: str) -> float:
    try:
        prediction = float(value)
    except (TypeError, ValueError) as exc:
        message = f"Invalid non-numeric occupancy prediction for {month_label}: {value!r}"
        logger.error(message)
        raise HTTPException(status_code=500, detail=message) from exc

    if not math.isfinite(prediction):
        message = f"Invalid non-finite occupancy prediction for {month_label}: {prediction!r}"
        logger.error(message)
        raise HTTPException(status_code=500, detail=message)

    return prediction


def _predict_month(feature_row: dict[str, Any]) -> Any:
    try:
        import pandas as pd
    except Exception as exc:
        message = f"Missing backend ML dependency while building occupancy DataFrame: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    preprocessor, model = _load_occupancy_artifacts()

    try:
        columns = list(getattr(preprocessor, "feature_names_in_", feature_row.keys()))
        dataframe = pd.DataFrame([feature_row], columns=columns)
        transformed = preprocessor.transform(dataframe)
        prediction = model.predict(transformed)
    except Exception as exc:
        message = f"Unable to run occupancy inference: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=500, detail=message) from exc

    try:
        return prediction[0]
    except Exception as exc:  # pragma: no cover - malformed third-party model output
        message = f"Unexpected occupancy model output: {prediction!r}"
        logger.error(message)
        raise HTTPException(status_code=500, detail=message) from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "airml-backend"}


@app.get("/models/occupancy")
def occupancy_models() -> list[dict[str, Any]]:
    return [
        {
            "id": model["id"],
            "name": model["name"],
            "accuracy": model["accuracy"],
            "relativeError": model["relativeError"],
        }
        for model in OCCUPANCY_MODELS.values()
    ]


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
def predict_occupancy(payload: OccupancyPredictionRequest) -> dict[str, Any]:
    model_metadata = OCCUPANCY_MODELS.get(payload.model_id)
    if model_metadata is None:
        raise HTTPException(status_code=404, detail=f"Unsupported occupancy model_id: {payload.model_id}")

    template = _load_occupancy_template()
    monthly: dict[str, int] = {}

    for month_label, month_number, days_in_month in MONTHS:
        feature_row = _build_feature_row(template, payload.property, month_number)
        raw_prediction = _predict_month(feature_row)
        prediction = _coerce_prediction(raw_prediction, month_label)
        predicted_days = prediction * days_in_month if 0 <= prediction <= 1 else prediction
        monthly[month_label] = min(days_in_month, max(0, round(predicted_days)))

    return {
        "model": {
            "id": model_metadata["id"],
            "name": model_metadata["name"],
            "accuracy": model_metadata["accuracy"],
            "relativeError": model_metadata["relativeError"],
        },
        "monthly": monthly,
        "annual_days": sum(monthly.values()),
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
