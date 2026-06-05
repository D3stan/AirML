from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReviewPayload(BaseModel):
    id: str | None = None
    text: str = ""


class PropertySettingsPayload(BaseModel):
    """JSON della pagina Settings inviato dal frontend.

    Il frontend invia impostazioni leggibili dall'utente, non una riga gia'
    pronta per il training. Le pipeline backend trasformano questi campi nelle
    feature raw richieste dai preprocessori salvati nel notebook.
    """

    model_config = ConfigDict(extra="ignore")

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
    availability_365: float | None = Field(default=None, ge=0, le=365)
    has_reviews: bool | None = None
    review_span_days: float | None = Field(default=None, ge=1)
    reviews: list[ReviewPayload] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def migrate_review_span_days(cls, data: Any) -> Any:
        """Migra il vecchio nome salvato nel browser al nuovo nome del modello."""

        if not isinstance(data, dict):
            return data

        if "review_span_days" not in data and "review_frequency_days" in data:
            return {**data, "review_span_days": data["review_frequency_days"]}

        return data
