from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import OCCUPANCY_MODEL_PATH


@dataclass(frozen=True)
class OccupancyModelMetadata:
    id: str
    name: str
    accuracy: int
    relative_error: int
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
        accuracy=82,
        relative_error=3,
        model_path=OCCUPANCY_MODEL_PATH,
    )
}
