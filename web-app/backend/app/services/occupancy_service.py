from __future__ import annotations

import logging
import math
from typing import Any

from fastapi import HTTPException

from app.models.occupancy import OCCUPANCY_MODELS
from app.schemas.occupancy import OccupancyPredictionRequest
from app.services.artifacts import load_occupancy_artifacts, load_occupancy_metadata
from app.services.occupancy_features import MONTHS, OccupancyFeaturePipeline


logger = logging.getLogger("airml-backend")


def list_occupancy_models() -> list[dict[str, int | str]]:
    return [model.to_api() for model in OCCUPANCY_MODELS.values()]


def settings_options() -> dict[str, Any]:
    metadata = load_occupancy_metadata()
    amenities = [amenity for amenity in metadata["top_amenities"] if amenity != "Other"]

    return {
        "cities": metadata["cities"],
        "neighbourhoodsByCity": metadata["neighbourhoods_by_city"],
        "propertyTypes": metadata["top_property_types"],
        "roomTypes": metadata["room_types"],
        "amenities": amenities,
    }


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

    preprocessor, model = load_occupancy_artifacts()

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


def predict_occupancy(payload: OccupancyPredictionRequest) -> dict[str, Any]:
    model_metadata = OCCUPANCY_MODELS.get(payload.model_id)
    if model_metadata is None:
        raise HTTPException(status_code=404, detail=f"Unsupported occupancy model_id: {payload.model_id}")

    metadata = load_occupancy_metadata()
    feature_pipeline = OccupancyFeaturePipeline(metadata)
    monthly: dict[str, int] = {}

    for month_label, month_number, days_in_month in MONTHS:
        feature_row = feature_pipeline.build_feature_row(payload.property, month_number)
        raw_prediction = _predict_month(feature_row)
        prediction = _coerce_prediction(raw_prediction, month_label)

        # The current artifact predicts monthly occupancy_rate in [0, 1].
        # If a future model returns days directly, values outside [0, 1] are
        # treated as days and still clamped to the month length.
        predicted_days = prediction * days_in_month if 0 <= prediction <= 1 else prediction
        monthly[month_label] = min(days_in_month, max(0, round(predicted_days)))

    return {
        "model": model_metadata.to_api(),
        "monthly": monthly,
        "annual_days": sum(monthly.values()),
    }
