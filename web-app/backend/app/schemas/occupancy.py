from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ReviewPayload(BaseModel):
    id: str | None = None
    text: str = ""


class PropertySettingsPayload(BaseModel):
    """Settings JSON sent by the React Settings page.

    The frontend sends the user-facing property settings, not a training-ready
    feature vector. The backend decides which fields can safely overwrite the
    artifact template and ignores anything that is not useful for the occupancy
    model.
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
    has_reviews: bool | None = None
    review_frequency_days: float | None = Field(default=None, ge=1)
    reviews: list[ReviewPayload] = Field(default_factory=list)


class OccupancyPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model_id: str
    property: PropertySettingsPayload
