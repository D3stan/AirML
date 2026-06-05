from __future__ import annotations

import json
import logging
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from app.core.config import (
    ARTIFACTS_DIR,
    GEO_CLUSTER_MODEL_PATTERN,
    LEGACY_GEO_CLUSTER_MODEL_PATH,
    OCCUPANCY_METADATA_PATH,
    OCCUPANCY_MODEL_PATH,
    OCCUPANCY_PREPROCESSOR_PATH,
    OCCUPANCY_TEMPLATE_PATH,
    PRICE_MODEL_PATH,
    PRICE_PREPROCESSOR_PATH,
    PRICE_TEMPLATE_PATH,
)
from app.ml.legacy import MLBTransformer


logger = logging.getLogger("airml-backend")


def missing_artifact_error(path: Path) -> HTTPException:
    message = f"Artifact mancante: {path}"
    logger.error(message)
    return HTTPException(status_code=503, detail=message)


def ensure_artifact(path: Path) -> None:
    if not path.exists():
        raise missing_artifact_error(path)


def _load_json_artifact(path: Path, label: str) -> dict[str, Any]:
    ensure_artifact(path)
    try:
        with path.open(encoding="utf-8") as payload_file:
            payload = json.load(payload_file)
    except Exception as exc:  # pragma: no cover - artifact locale corrotto
        message = f"Impossibile caricare {label} da {path}: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    if not isinstance(payload, dict):
        message = f"{label} deve essere un oggetto JSON: {path}"
        logger.error(message)
        raise HTTPException(status_code=503, detail=message)

    return payload


@lru_cache(maxsize=1)
def load_occupancy_template() -> dict[str, Any]:
    return _load_json_artifact(OCCUPANCY_TEMPLATE_PATH, "template occupancy")


@lru_cache(maxsize=1)
def load_price_template() -> dict[str, Any]:
    return _load_json_artifact(PRICE_TEMPLATE_PATH, "template price")


@lru_cache(maxsize=1)
def load_occupancy_metadata() -> dict[str, Any]:
    """Carica i metadata raw esportati dalla pipeline del notebook."""

    return _load_json_artifact(OCCUPANCY_METADATA_PATH, "metadata occupancy")


@lru_cache(maxsize=1)
def load_occupancy_artifacts():
    """Carica gli artifact occupancy una sola volta e li riusa nelle request."""

    ensure_artifact(OCCUPANCY_PREPROCESSOR_PATH)
    ensure_artifact(OCCUPANCY_MODEL_PATH)

    try:
        import joblib
    except Exception as exc:
        message = f"Dipendenza ML mancante durante il caricamento occupancy: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    try:
        setattr(sys.modules["__main__"], "MLBTransformer", MLBTransformer)
        preprocessor = joblib.load(OCCUPANCY_PREPROCESSOR_PATH)
        model = joblib.load(OCCUPANCY_MODEL_PATH)
    except Exception as exc:
        message = (
            "Impossibile caricare gli artifact occupancy "
            f"preprocessor={OCCUPANCY_PREPROCESSOR_PATH}, model={OCCUPANCY_MODEL_PATH}: {exc}"
        )
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    return preprocessor, model


@lru_cache(maxsize=1)
def load_price_artifacts():
    """Carica gli artifact price una sola volta e li riusa nelle request."""

    ensure_artifact(PRICE_PREPROCESSOR_PATH)
    ensure_artifact(PRICE_MODEL_PATH)

    try:
        import joblib
    except Exception as exc:
        message = f"Dipendenza ML mancante durante il caricamento price: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    try:
        setattr(sys.modules["__main__"], "MLBTransformer", MLBTransformer)
        preprocessor = joblib.load(PRICE_PREPROCESSOR_PATH)
        model = joblib.load(PRICE_MODEL_PATH)
    except Exception as exc:
        message = (
            "Impossibile caricare gli artifact price "
            f"preprocessor={PRICE_PREPROCESSOR_PATH}, model={PRICE_MODEL_PATH}: {exc}"
        )
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    return preprocessor, model


@lru_cache(maxsize=32)
def load_geo_cluster_model(city_id: str):
    """Carica il KMeans della citta' richiesta, con fallback legacy temporaneo."""

    city_key = city_id.strip().lower()
    city_path = ARTIFACTS_DIR / GEO_CLUSTER_MODEL_PATTERN.format(city_id=city_key)
    model_path = city_path if city_path.exists() else LEGACY_GEO_CLUSTER_MODEL_PATH
    ensure_artifact(model_path)

    if model_path == LEGACY_GEO_CLUSTER_MODEL_PATH and not city_path.exists():
        logger.warning("KMeans per citta' mancante (%s), uso fallback legacy %s", city_path, model_path)

    try:
        import joblib
    except Exception as exc:
        message = f"Dipendenza ML mancante durante il caricamento KMeans: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    try:
        return joblib.load(model_path)
    except Exception as exc:
        message = f"Impossibile caricare KMeans geografico da {model_path}: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc
