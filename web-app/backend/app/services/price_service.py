from __future__ import annotations

import json
import logging
import math
from typing import Any

from fastapi import HTTPException

from app.models.price import PRICE_MODELS
from app.schemas.price import PricePredictionRequest
from app.services.artifacts import load_occupancy_metadata, load_price_artifacts
from app.services.price_features import PriceFeaturePipeline


logger = logging.getLogger("airml-backend")


def _to_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, default=str)


def _feature_debug_view(feature_row: dict[str, Any]) -> dict[str, Any]:
    debug_keys = (
        "city",
        "neighbourhood",
        "property_type",
        "room_type",
        "instant_bookable",
        "amenities",
        "n_amenities",
        "accommodates",
        "bathrooms",
        "bedrooms",
        "beds",
        "availability_30",
        "availability_60",
        "availability_90",
        "minimum_nights",
        "beds_per_person",
        "bedrooms_per_person",
        "bathrooms_per_person",
        "beds_per_bedroom",
        "accommodates_squared",
        "distance_from_city_center",
        "distance_from_poi",
        "poi_density",
        "geo_cluster",
        "distance_from_geo_cluster",
        "inv_distance_poi",
        "inv_distance_city_center",
    )
    return {key: feature_row.get(key) for key in debug_keys if key in feature_row}


def list_price_models() -> list[dict[str, int | str]]:
    return [model.to_api() for model in PRICE_MODELS.values()]


def _coerce_prediction(value: Any) -> float:
    try:
        prediction = float(value)
    except (TypeError, ValueError) as exc:
        message = f"Predizione price non numerica: {value!r}"
        logger.error(message)
        raise HTTPException(status_code=500, detail=message) from exc

    if not math.isfinite(prediction):
        message = f"Predizione price non finita: {prediction!r}"
        logger.error(message)
        raise HTTPException(status_code=500, detail=message)

    return max(0.0, prediction)


def _predict_price_row(feature_row: dict[str, Any]) -> Any:
    try:
        import pandas as pd
    except Exception as exc:
        message = f"Dipendenza pandas mancante durante la costruzione del DataFrame price: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    preprocessor, model = load_price_artifacts()

    try:
        columns = list(getattr(preprocessor, "feature_names_in_", feature_row.keys()))
        dataframe = pd.DataFrame([feature_row], columns=columns)
        logger.info("Price dataframe columns passed to preprocessor: %s", list(dataframe.columns))
        transformed = preprocessor.transform(dataframe)
        prediction = model.predict(transformed)
    except Exception as exc:
        message = f"Impossibile eseguire inferenza price: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=500, detail=message) from exc

    try:
        return prediction[0]
    except Exception as exc:  # pragma: no cover - output malformato da libreria esterna
        message = f"Output inatteso dal modello price: {prediction!r}"
        logger.error(message)
        raise HTTPException(status_code=500, detail=message) from exc


def predict_price(payload: PricePredictionRequest) -> dict[str, Any]:
    model_metadata = PRICE_MODELS.get(payload.model_id)
    if model_metadata is None:
        raise HTTPException(status_code=404, detail=f"Unsupported price model_id: {payload.model_id}")

    property_json = payload.property.model_dump() if hasattr(payload.property, "model_dump") else payload.property.dict()
    logger.info("POST /predict-price received model_id=%s property=%s", payload.model_id, _to_json(property_json))

    preprocessor, _model = load_price_artifacts()
    metadata = load_occupancy_metadata()
    feature_pipeline = PriceFeaturePipeline(metadata, preprocessor)
    feature_row = feature_pipeline.build_feature_row(payload.property)
    logger.info("Price raw feature row: %s", _to_json(_feature_debug_view(feature_row)))

    raw_prediction = _predict_price_row(feature_row)
    prediction = _coerce_prediction(raw_prediction)
    rounded_prediction = round(prediction)
    spread = round(rounded_prediction * model_metadata.relative_error / 100)

    response = {
        "model": model_metadata.to_api(),
        "prediction": rounded_prediction,
        "lower": max(0, rounded_prediction - spread),
        "upper": rounded_prediction + spread,
        "relativeError": model_metadata.relative_error,
        "accuracy": model_metadata.accuracy,
        "currency": "EUR",
        "unit": "night",
    }
    logger.info("POST /predict-price response: %s", _to_json(response))
    return response
