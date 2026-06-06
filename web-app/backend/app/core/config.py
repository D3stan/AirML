from __future__ import annotations

from pathlib import Path


WEB_APP_DIR = Path(__file__).resolve().parents[3]
ARTIFACTS_DIR = WEB_APP_DIR / "artifacts"

OCCUPANCY_PREPROCESSOR_PATH = ARTIFACTS_DIR / "occ_model_preprocessor.joblib"
OCCUPANCY_MODEL_PATH = ARTIFACTS_DIR / "occ_model_xgboost.joblib"
OCCUPANCY_HIST_PREPROCESSOR_PATH = ARTIFACTS_DIR / "occ_model_preprocessor_hist.joblib"
OCCUPANCY_HIST_MODEL_PATH = ARTIFACTS_DIR / "occ_model_hist.joblib"
OCCUPANCY_TEMPLATE_PATH = ARTIFACTS_DIR / "occ_model_payload.json"
OCCUPANCY_METADATA_PATH = ARTIFACTS_DIR / "occ_feature_metadata.json"
PRICE_PREPROCESSOR_PATH = ARTIFACTS_DIR / "price_model_preprocessor.joblib"
PRICE_MODEL_PATH = ARTIFACTS_DIR / "price_model_logxgb.joblib"
PRICE_TEMPLATE_PATH = ARTIFACTS_DIR / "price_model_payload.json"
LEGACY_GEO_CLUSTER_MODEL_PATH = ARTIFACTS_DIR / "geo_cluster_kmeans.joblib"
GEO_CLUSTER_MODEL_PATTERN = "geo_cluster_kmeans_{city_id}.joblib"

CORS_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:4173",
    "http://localhost:4173",
]
