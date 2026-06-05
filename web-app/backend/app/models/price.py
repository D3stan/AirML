from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import PRICE_MODEL_PATH


@dataclass(frozen=True)
class PriceModelMetadata:
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


PRICE_MODELS = {
    "logxgb": PriceModelMetadata(
        id="logxgb",
        name="XGBoost Log",
        accuracy=75,
        relative_error=25,
        model_path=PRICE_MODEL_PATH,
    )
}
