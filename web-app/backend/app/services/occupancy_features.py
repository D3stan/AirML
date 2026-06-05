from __future__ import annotations

import math
from typing import Any

from app.schemas.occupancy import PropertySettingsPayload


MONTHS: tuple[tuple[str, int, int], ...] = (
    ("Jan", 1, 31),
    ("Feb", 2, 28),
    ("Mar", 3, 31),
    ("Apr", 4, 30),
    ("May", 5, 31),
    ("Jun", 6, 30),
    ("Jul", 7, 31),
    ("Aug", 8, 31),
    ("Sep", 9, 30),
    ("Oct", 10, 31),
    ("Nov", 11, 30),
    ("Dec", 12, 31),
)

KNOWN_AMENITY_FEATURES = {
    "Air conditioning",
    "Bed linens",
    "Bidet",
    "Carbon monoxide alarm",
    "Cooking basics",
    "Dining table",
    "Dishes and silverware",
    "Essentials",
    "Fire extinguisher",
    "Freezer",
    "Hair dryer",
    "Hangers",
    "Heating",
    "Hot water",
    "Iron",
    "Kitchen",
    "Other",
    "Refrigerator",
    "Shampoo",
    "TV",
    "Wifi",
}

CITY_TO_TRAINING_VALUE = {
    "Bologna": "bologna",
    "Florence": "firenze",
    "Milan": "milano",
    "Naples": "napoli",
    "Rome": "roma",
    "Venice": "venezia",
}

SUPPORTED_ROOM_TYPES = {"Entire home/apt", "Hotel room", "Private room", "Shared room"}
SUPPORTED_PROPERTY_TYPES = {
    "Entire condo",
    "Entire home",
    "Entire loft",
    "Entire rental unit",
    "Entire serviced apartment",
    "Entire townhouse",
    "Entire vacation home",
    "Entire villa",
    "Other",
    "Private room in bed and breakfast",
    "Private room in condo",
    "Private room in home",
    "Private room in rental unit",
    "Room in hotel",
    "Tiny home",
    "Trullo",
}


def _set_if_present(feature_row: dict[str, Any], key: str, value: Any) -> None:
    if key in feature_row and value is not None:
        feature_row[key] = value


def _as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def build_occupancy_feature_row(
    template: dict[str, Any],
    property_payload: PropertySettingsPayload,
    month_number: int,
) -> dict[str, Any]:
    """Translate frontend settings into one model-ready feature row.

    The model was trained on a dataframe with exact feature names. We therefore:
    1. start from `occ_model_payload.json`, which contains default values for
       every training feature;
    2. overwrite only values we can derive reliably from Settings;
    3. leave review sentiment, topic and distance features at their template
       defaults when the UI does not provide enough raw data to recompute them.
    """

    feature_row = dict(template)
    property_data = property_payload.model_dump() if hasattr(property_payload, "model_dump") else property_payload.dict()

    direct_fields = {
        "accommodates": property_data.get("accommodates"),
        "bathrooms": property_data.get("bathrooms"),
        "bedrooms": property_data.get("bedrooms"),
        "beds": property_data.get("beds"),
        "minimum_nights": property_data.get("minimum_nights"),
        # Frontend calls this nightly_price; training feature is named price.
        "price": property_data.get("nightly_price"),
    }

    for key, raw_value in direct_fields.items():
        number = _as_float(raw_value)
        if number is not None:
            _set_if_present(feature_row, key, number)

    city_value = CITY_TO_TRAINING_VALUE.get(property_payload.city or "", "roma")
    _set_if_present(feature_row, "city", city_value)
    _set_if_present(feature_row, "geo_cluster", f"{city_value}_0")

    property_type = property_payload.property_type if property_payload.property_type in SUPPORTED_PROPERTY_TYPES else "Other"
    _set_if_present(feature_row, "property_type", property_type)

    room_type = property_payload.room_type if property_payload.room_type in SUPPORTED_ROOM_TYPES else "Entire home/apt"
    _set_if_present(feature_row, "room_type", room_type)

    amenities = {amenity.strip() for amenity in property_payload.amenities if amenity and amenity.strip()}
    # The preprocessor expects the raw multi-label `amenities` column. Some
    # template files also include one-hot amenity columns, so we keep both forms
    # consistent without renaming the training features.
    feature_row["amenities"] = sorted(amenities)
    amenity_feature_names = [feature for feature in feature_row if feature in KNOWN_AMENITY_FEATURES]
    for amenity in amenity_feature_names:
        feature_row[amenity] = 1.0 if amenity in amenities else 0.0
    _set_if_present(feature_row, "n_amenities", float(len(amenities)))
    if "Other" in feature_row:
        known_selected_amenities = amenities & KNOWN_AMENITY_FEATURES
        feature_row["Other"] = 1.0 if len(known_selected_amenities) < len(amenities) else feature_row["Other"]

    accommodates = max(_as_float(property_payload.accommodates) or 0.0, 1.0)
    beds = _as_float(property_payload.beds)
    bedrooms = _as_float(property_payload.bedrooms)
    bathrooms = _as_float(property_payload.bathrooms)

    if beds is not None:
        _set_if_present(feature_row, "beds_per_person", beds / accommodates)
    if bedrooms is not None:
        _set_if_present(feature_row, "bedrooms_per_person", bedrooms / accommodates)
    if bathrooms is not None:
        _set_if_present(feature_row, "bathrooms_per_person", bathrooms / accommodates)
    if beds is not None and bedrooms is not None:
        _set_if_present(feature_row, "beds_per_bedroom", beds / max(bedrooms, 1.0))

    if property_payload.has_reviews is not None:
        _set_if_present(feature_row, "has_reviews", 1.0 if property_payload.has_reviews else 0.0)
        if not property_payload.has_reviews:
            _set_if_present(feature_row, "reviews_per_month", 0.0)
            _set_if_present(feature_row, "review_span_days", 0.0)
            _set_if_present(feature_row, "avg_days_between_reviews", 0.0)
            _set_if_present(feature_row, "days_since_last_review", 0.0)

    review_frequency_days = _as_float(property_payload.review_frequency_days)
    if property_payload.has_reviews and review_frequency_days:
        _set_if_present(feature_row, "avg_days_between_reviews", review_frequency_days)
        _set_if_present(feature_row, "reviews_per_month", 30.0 / review_frequency_days)

    # Training used months 1..12:
    # month_sin = sin(2*pi*month/12), month_cos = cos(2*pi*month/12).
    feature_row["month_sin"] = math.sin(2 * math.pi * month_number / 12)
    feature_row["month_cos"] = math.cos(2 * math.pi * month_number / 12)

    return feature_row
