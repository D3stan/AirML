from __future__ import annotations

import json
import logging
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from app.core.config import (
    OCCUPANCY_METADATA_PATH,
    OCCUPANCY_MODEL_PATH,
    OCCUPANCY_PREPROCESSOR_PATH,
    OCCUPANCY_TEMPLATE_PATH,
)
from app.ml.legacy import MLBTransformer


logger = logging.getLogger("airml-backend")


def missing_artifact_error(path: Path) -> HTTPException:
    message = f"Missing occupancy artifact: {path}"
    logger.error(message)
    return HTTPException(status_code=503, detail=message)


def ensure_artifact(path: Path) -> None:
    if not path.exists():
        raise missing_artifact_error(path)


@lru_cache(maxsize=1)
def load_occupancy_template() -> dict[str, Any]:
    ensure_artifact(OCCUPANCY_TEMPLATE_PATH)

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
def load_occupancy_metadata() -> dict[str, Any]:
    """Load the raw-feature metadata exported from the notebook pipeline."""

    ensure_artifact(OCCUPANCY_METADATA_PATH)

    try:
        with OCCUPANCY_METADATA_PATH.open(encoding="utf-8") as metadata_file:
            metadata = json.load(metadata_file)
    except Exception as exc:  # pragma: no cover - corrupt local artifact
        message = f"Unable to load occupancy metadata at {OCCUPANCY_METADATA_PATH}: {exc}"
        logger.exception(message)
        raise HTTPException(status_code=503, detail=message) from exc

    if not isinstance(metadata, dict):
        message = f"Occupancy metadata must be a JSON object: {OCCUPANCY_METADATA_PATH}"
        logger.error(message)
        raise HTTPException(status_code=503, detail=message)

    return metadata


@lru_cache(maxsize=1)
def load_occupancy_artifacts():
    """Load joblib artifacts once and reuse them across requests."""

    ensure_artifact(OCCUPANCY_PREPROCESSOR_PATH)
    ensure_artifact(OCCUPANCY_MODEL_PATH)

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
