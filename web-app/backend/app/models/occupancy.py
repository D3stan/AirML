from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import (
    OCCUPANCY_HIST_MODEL_PATH,
    OCCUPANCY_HIST_PREPROCESSOR_PATH,
    OCCUPANCY_MODEL_PATH,
    OCCUPANCY_PREPROCESSOR_PATH,
)


@dataclass(frozen=True)
class OccupancyModelMetadata:
    id: str
    name: str
    accuracy: int
    relative_error: int
    preprocessor_path: Path
    model_path: Path

    def to_api(self) -> dict[str, int | str]:
        return {
            "id": self.id,
            "name": self.name,
            "accuracy": self.accuracy,
            "relativeError": self.relative_error,
        }


OCCUPANCY_MODELS = {
    "xgboost": OccupancyModelMetadata(
        id="xgboost",
        name="XGBoost",
        accuracy=53,
        relative_error=15,
        preprocessor_path=OCCUPANCY_PREPROCESSOR_PATH,
        model_path=OCCUPANCY_MODEL_PATH,
    ),
    "hist": OccupancyModelMetadata(
        id="hist",
        name="Hist",
        accuracy=35,
        relative_error=10,
        preprocessor_path=OCCUPANCY_HIST_PREPROCESSOR_PATH,
        model_path=OCCUPANCY_HIST_MODEL_PATH,
    ),
}
