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


def _as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _safe_divide(numerator: float | None, denominator: float | None) -> float:
    if numerator is None or denominator in (None, 0):
        return 0.0
    result = numerator / denominator
    return result if math.isfinite(result) else 0.0


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_m = 6371000
    lat1, lon1, lat2, lon2 = [math.radians(value) for value in (lat1, lon1, lat2, lon2)]
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return radius_m * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _distances_from_points(lat: float, lon: float, points: list[dict[str, Any]]) -> list[float]:
    return [_haversine(lat, lon, float(point["lat"]), float(point["lon"])) for point in points]


def _city_from_settings(metadata: dict[str, Any], value: str | None) -> dict[str, Any]:
    cities = metadata["cities"]
    normalized = (value or "").strip().lower()

    for city in cities:
        if normalized in {city["id"].lower(), city["label"].lower()}:
            return city

    return next(city for city in cities if city["id"] == "roma")


def _nearest_geo_cluster(metadata: dict[str, Any], city_id: str, lat: float, lon: float) -> tuple[str, float]:
    centers = metadata["geo_cluster_centers"].get(city_id) or [{"cluster": 0, "lat": lat, "lon": lon}]
    nearest = min(
        centers,
        key=lambda center: (lat - float(center["lat"])) ** 2 + (lon - float(center["lon"])) ** 2,
    )
    distance = math.sqrt((lat - float(nearest["lat"])) ** 2 + (lon - float(nearest["lon"])) ** 2)
    return f"{city_id}_{int(nearest['cluster'])}", distance


class OccupancyFeaturePipeline:
    """Build raw model features from frontend Settings.

    The React app sends user-facing settings, not a dataframe row from training.
    This pipeline mirrors the notebook preprocessing and creates the exact raw
    columns expected by `preprocessor.feature_names_in_`.
    """

    def __init__(self, metadata: dict[str, Any]) -> None:
        self.metadata = metadata
        self.feature_names = metadata["feature_names_in"]
        self.raw_defaults = metadata["raw_defaults"]
        self.categories = metadata["categories"]
        self.top_amenities = {amenity for amenity in metadata["top_amenities"] if amenity != "Other"}

    def build_feature_row(self, property_payload: PropertySettingsPayload, month_number: int) -> dict[str, Any]:
        row = {feature: self.raw_defaults.get(feature, 0.0) for feature in self.feature_names}
        property_data = property_payload.model_dump() if hasattr(property_payload, "model_dump") else property_payload.dict()

        city = _city_from_settings(self.metadata, property_payload.city)
        city_id = city["id"]
        lat = _as_float(property_payload.latitude) or float(city["latitude"])
        lon = _as_float(property_payload.longitude) or float(city["longitude"])

        row["city"] = city_id
        row["property_type"] = self._property_type(property_payload.property_type)
        row["room_type"] = self._room_type(property_payload.room_type)

        row["accommodates"] = max(_as_float(property_data.get("accommodates")) or row["accommodates"], 1.0)
        row["bathrooms"] = max(_as_float(property_data.get("bathrooms")) or row["bathrooms"], 0.0)
        row["bedrooms"] = max(_as_float(property_data.get("bedrooms")) or row["bedrooms"], 0.0)
        row["beds"] = max(_as_float(property_data.get("beds")) or row["beds"], 0.0)
        row["price"] = min(max(_as_float(property_data.get("nightly_price")) or row["price"], 5.0), 10000.0)
        row["minimum_nights"] = min(max(_as_float(property_data.get("minimum_nights")) or row["minimum_nights"], 1.0), 90.0)

        original_amenities = [amenity.strip() for amenity in property_payload.amenities if amenity and amenity.strip()]
        normalized_amenities = {
            amenity if amenity in self.top_amenities else "Other"
            for amenity in original_amenities
        }
        row["amenities"] = sorted(normalized_amenities) if normalized_amenities else ["Other"]
        row["n_amenities"] = float(len(original_amenities))

        row["beds_per_person"] = _safe_divide(row["beds"], row["accommodates"])
        row["bedrooms_per_person"] = _safe_divide(row["bedrooms"], row["accommodates"])
        row["bathrooms_per_person"] = _safe_divide(row["bathrooms"], row["accommodates"])
        row["beds_per_bedroom"] = _safe_divide(row["beds"], row["bedrooms"])

        city_center_distances = _distances_from_points(lat, lon, self.metadata["city_centers"].get(city_id, []))
        if city_center_distances:
            row["distance_from_city_center"] = min(city_center_distances)

        poi_distances = _distances_from_points(lat, lon, self.metadata["poi_by_city"].get(city_id, []))
        if poi_distances:
            row["distance_from_poi"] = min(poi_distances)
            row["poi_density"] = (
                sum(distance <= 250 for distance in poi_distances) * 0.25
                + sum(distance <= 500 for distance in poi_distances) * 0.25
                + sum(distance <= 1000 for distance in poi_distances) * 0.25
                + sum(distance <= 2000 for distance in poi_distances) * 0.15
                + sum(distance <= 5000 for distance in poi_distances) * 0.10
            )

        row["geo_cluster"], row["distance_from_geo_cluster"] = _nearest_geo_cluster(self.metadata, city_id, lat, lon)
        row["month_sin"] = math.sin(2 * math.pi * month_number / 12)
        row["month_cos"] = math.cos(2 * math.pi * month_number / 12)

        self._apply_review_settings(row, property_payload)
        return row

    def _property_type(self, value: str | None) -> str:
        property_types = set(self.categories["property_type"])
        return value if value in property_types else "Other"

    def _room_type(self, value: str | None) -> str:
        room_types = set(self.categories["room_type"])
        return value if value in room_types else "Entire home/apt"

    def _apply_review_settings(self, row: dict[str, Any], property_payload: PropertySettingsPayload) -> None:
        if property_payload.has_reviews is False:
            row["has_reviews"] = 0.0
            row["reviews_per_month"] = 0.0
            row["review_span_days"] = 0.0
            row["avg_days_between_reviews"] = 0.0
            row["days_since_last_review"] = 0.0
            return

        if property_payload.has_reviews is True:
            row["has_reviews"] = 1.0
            review_frequency_days = _as_float(property_payload.review_frequency_days)
            if review_frequency_days:
                row["avg_days_between_reviews"] = review_frequency_days
                row["reviews_per_month"] = 30.0 / review_frequency_days
