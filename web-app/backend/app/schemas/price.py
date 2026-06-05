from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.schemas.property import PropertySettingsPayload


class PricePredictionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model_id: str
    property: PropertySettingsPayload
