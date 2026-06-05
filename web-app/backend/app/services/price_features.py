from __future__ import annotations

import math
from typing import Any

from app.schemas.property import PropertySettingsPayload
from app.services.geo_features import (
    as_float,
    city_from_settings,
    coordinates_from_settings,
    distance_features,
    predict_geo_cluster,
    safe_divide,
)


AMENITY_CLUSTERS: dict[str, list[str]] = {
    "n_kitchen": [
        "kitchen",
        "oven",
        "stove",
        "microwave",
        "fridge",
        "refrigerator",
        "dishwasher",
        "cooking",
        "freezer",
        "blender",
        "toaster",
        "baking sheet",
        "induction",
        "rice maker",
        "bread maker",
    ],
    "n_entertainment": [
        "tv",
        "netflix",
        "chromecast",
        "game console",
        "books",
        "board game",
        "sound system",
        "streaming",
        "amazon prime",
        "hdtv",
        "piano",
        "record player",
        "movie theater",
        "arcade",
    ],
    "n_climate": [
        "air conditioning",
        "heating",
        "central heating",
        "fan",
        "portable heater",
        "radiator",
        "central air",
        "portable fan",
        "fireplace",
        "window ac",
        "split type",
        "ductless",
    ],
    "n_essentials": ["essentials", "bed linens", "towels", "shampoo", "soap", "toilet paper", "hangers", "cleaning products"],
    "n_luxury": ["pool", "gym", "hot tub", "jacuzzi", "sauna", "rooftop", "doorman", "concierge", "terrace", "resort access", "exercise equipment"],
    "n_workspace": ["workspace", "dedicated workspace", "desk", "monitor", "office", "laptop friendly"],
    "n_wifi": ["wifi", "fast wifi", "ethernet", "internet"],
    "n_laundry": ["washer", "dryer", "iron", "ironing board", "laundry", "clothes rack", "drying rack", "laundromat"],
    "n_safety": ["smoke alarm", "carbon monoxide", "fire extinguisher", "first aid", "security camera", "window guard", "safe", "outlet covers", "fire pit"],
    "n_parking": ["parking", "garage", "bike", "bicycle", "ev charger", "carport", "driveway"],
    "n_outdoor": ["balcony", "patio", "backyard", "bbq", "grill", "outdoor dining", "outdoor furniture", "garden", "hammock", "sun lounger", "outdoor shower", "outdoor playground"],
    "n_family": ["crib", "high chair", "baby", "children", "toys", "changing table", "table corner guard", "fireplace guard"],
    "n_accessibility": ["elevator", "wheelchair", "accessible", "step-free", "wide entrance", "grab bar"],
    "n_self_checkin": ["self check-in", "lockbox", "keypad", "smart lock", "door code", "building staff"],
    "n_breakfast": ["breakfast", "cereal", "coffee maker", "espresso", "tea kettle"],
    "n_bathroom": ["hot water", "bidet", "shower gel", "conditioner", "bathtub", "body soap", "hot water kettle"],
    "n_dining": ["dishes and silverware", "dining table", "wine glasses", "coffee"],
    "n_bedroom": ["pillow", "blanket", "room-darkening", "mosquito net", "shade"],
    "n_policies": ["long term stays", "pets allowed", "smoking allowed", "host greets", "luggage dropoff", "cleaning available", "housekeeping"],
    "n_storage": ["clothing storage", "closet", "wardrobe", "dresser", "private entrance", "single level"],
}


def _categories_from_preprocessor(preprocessor: Any) -> dict[str, set[Any]]:
    cat_transformer = preprocessor.named_transformers_["cat"]
    cat_columns = list(preprocessor.transformers_[0][2])
    return {column: set(values) for column, values in zip(cat_columns, cat_transformer.categories_)}


def _amenity_classes_from_preprocessor(preprocessor: Any) -> set[str]:
    transformer = preprocessor.named_transformers_["amenities"]
    return {str(value) for value in transformer.mlb.classes_}


def _safe_inverse_distance(value: float | None) -> float:
    distance = value if value is not None and math.isfinite(value) else 0.0
    return 1.0 / (distance + 0.1)


def _availability_windows(property_payload: PropertySettingsPayload) -> dict[str, float]:
    if property_payload.has_availability is False:
        annual_availability = 0.0
    else:
        annual_availability = min(max(as_float(property_payload.availability_365) or 365.0, 0.0), 365.0)

    return {
        "availability_30": min(30.0, round(annual_availability * 30 / 365)),
        "availability_60": min(60.0, round(annual_availability * 60 / 365)),
        "availability_90": min(90.0, round(annual_availability * 90 / 365)),
    }


def _neighbourhood_value(city_id: str, property_payload: PropertySettingsPayload, metadata: dict[str, Any]) -> str:
    neighbourhood = (property_payload.neighbourhood_cleansed or "").strip()
    if not neighbourhood:
        neighbourhoods = metadata["neighbourhoods_by_city"].get(city_id, [])
        neighbourhood = neighbourhoods[0] if neighbourhoods else "Other"
    if neighbourhood.startswith(f"{city_id}_"):
        return neighbourhood
    return f"{city_id}_{neighbourhood}"


class PriceFeaturePipeline:
    """Costruisce le 66 feature raw richieste dal preprocessor price."""

    def __init__(self, metadata: dict[str, Any], preprocessor: Any) -> None:
        self.metadata = metadata
        self.feature_names = list(preprocessor.feature_names_in_)
        self.categories = _categories_from_preprocessor(preprocessor)
        self.amenity_classes = _amenity_classes_from_preprocessor(preprocessor)

    def build_feature_row(self, property_payload: PropertySettingsPayload) -> dict[str, Any]:
        row: dict[str, Any] = {feature: 0.0 for feature in self.feature_names}
        property_data = property_payload.model_dump() if hasattr(property_payload, "model_dump") else property_payload.dict()

        city = city_from_settings(self.metadata, property_payload.city)
        city_id = city["id"]
        lat, lon = coordinates_from_settings(city, property_payload.latitude, property_payload.longitude)

        row["city"] = self._category("city", city_id, "roma")
        row["neighbourhood"] = _neighbourhood_value(city_id, property_payload, self.metadata)
        row["property_type"] = self._category("property_type", property_payload.property_type, "Other")
        row["room_type"] = self._category("room_type", property_payload.room_type, "Entire home/apt")
        row["instant_bookable"] = "t" if property_payload.instant_bookable else "f"

        row["accommodates"] = max(as_float(property_data.get("accommodates")) or 1.0, 1.0)
        row["bathrooms"] = max(as_float(property_data.get("bathrooms")) or 0.0, 0.0)
        row["bedrooms"] = max(as_float(property_data.get("bedrooms")) or 0.0, 0.0)
        row["beds"] = max(as_float(property_data.get("beds")) or 0.0, 0.0)
        row["minimum_nights"] = max(as_float(property_data.get("minimum_nights")) or 1.0, 1.0)

        row.update(_availability_windows(property_payload))
        self._apply_amenities(row, property_payload.amenities)
        self._apply_ratio_features(row)

        row["accommodates_squared"] = row["accommodates"] ** 2
        self._apply_geo_features(row, city_id, lat, lon)
        self._sanitize_numeric_features(row)
        return row

    def _category(self, column: str, value: str | None, fallback: str) -> str:
        allowed = self.categories.get(column, set())
        if value in allowed:
            return str(value)
        return fallback if fallback in allowed else str(next(iter(allowed)))

    def _apply_amenities(self, row: dict[str, Any], amenities: list[str]) -> None:
        original_amenities = [amenity.strip() for amenity in amenities if amenity and amenity.strip()]
        collapsed_amenities = {
            amenity if amenity in self.amenity_classes else "Other"
            for amenity in original_amenities
        }
        row["amenities"] = sorted(collapsed_amenities) if collapsed_amenities else ["Other"]
        row["n_amenities"] = float(len(original_amenities))

        for cluster_name in AMENITY_CLUSTERS:
            if cluster_name in row:
                row[cluster_name] = 0.0

        for amenity in original_amenities:
            lowered = amenity.lower()
            for cluster_name, keywords in AMENITY_CLUSTERS.items():
                if cluster_name in row and any(keyword in lowered for keyword in keywords):
                    row[cluster_name] += 1.0

    def _apply_ratio_features(self, row: dict[str, Any]) -> None:
        row["beds_per_person"] = safe_divide(row["beds"], row["accommodates"])
        row["bedrooms_per_person"] = safe_divide(row["bedrooms"], row["accommodates"])
        row["bathrooms_per_person"] = safe_divide(row["bathrooms"], row["accommodates"])
        row["beds_per_bedroom"] = safe_divide(row["beds"], row["bedrooms"])

    def _apply_geo_features(self, row: dict[str, Any], city_id: str, lat: float, lon: float) -> None:
        row.update(distance_features(self.metadata, city_id, lat, lon))
        cluster, cluster_distance = predict_geo_cluster(city_id, lat, lon)
        row["geo_cluster"] = cluster
        row["distance_from_geo_cluster"] = cluster_distance
        row["inv_distance_poi"] = _safe_inverse_distance(as_float(row.get("distance_from_poi")))
        row["inv_distance_city_center"] = _safe_inverse_distance(as_float(row.get("distance_from_city_center")))

    def _sanitize_numeric_features(self, row: dict[str, Any]) -> None:
        for key, value in list(row.items()):
            if isinstance(value, (int, float)) and not math.isfinite(float(value)):
                row[key] = 0.0
