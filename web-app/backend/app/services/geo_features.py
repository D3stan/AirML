from __future__ import annotations

import math
from typing import Any

from app.services.artifacts import load_geo_cluster_model


def as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def safe_divide(numerator: float | None, denominator: float | None) -> float:
    if numerator is None or denominator in (None, 0):
        return 0.0
    result = numerator / denominator
    return result if math.isfinite(result) else 0.0


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_m = 6371000
    lat1, lon1, lat2, lon2 = [math.radians(value) for value in (lat1, lon1, lat2, lon2)]
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return radius_m * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def distances_from_points(lat: float, lon: float, points: list[dict[str, Any]]) -> list[float]:
    return [haversine(lat, lon, float(point["lat"]), float(point["lon"])) for point in points]


def city_from_settings(metadata: dict[str, Any], value: str | None) -> dict[str, Any]:
    cities = metadata["cities"]
    normalized = (value or "").strip().lower()

    for city in cities:
        if normalized in {city["id"].lower(), city["label"].lower()}:
            return city

    return next(city for city in cities if city["id"] == "roma")


def coordinates_from_settings(city: dict[str, Any], latitude: Any, longitude: Any) -> tuple[float, float]:
    lat = as_float(latitude) or float(city["latitude"])
    lon = as_float(longitude) or float(city["longitude"])
    return lat, lon


def distance_features(metadata: dict[str, Any], city_id: str, lat: float, lon: float) -> dict[str, float]:
    result: dict[str, float] = {}

    city_center_distances = distances_from_points(lat, lon, metadata["city_centers"].get(city_id, []))
    if city_center_distances:
        result["distance_from_city_center"] = min(city_center_distances)

    poi_distances = distances_from_points(lat, lon, metadata["poi_by_city"].get(city_id, []))
    if poi_distances:
        result["distance_from_poi"] = min(poi_distances)
        result["poi_density"] = (
            sum(distance <= 250 for distance in poi_distances) * 0.25
            + sum(distance <= 500 for distance in poi_distances) * 0.25
            + sum(distance <= 1000 for distance in poi_distances) * 0.25
            + sum(distance <= 2000 for distance in poi_distances) * 0.15
            + sum(distance <= 5000 for distance in poi_distances) * 0.10
        )

    return result


def predict_geo_cluster(city_id: str, lat: float, lon: float) -> tuple[int, float]:
    """Calcola il cluster geografico con il KMeans salvato per la citta'."""

    try:
        import numpy as np
    except Exception:
        cluster_model = load_geo_cluster_model(city_id)
        cluster = int(cluster_model.predict([[lat, lon]])[0])
        centers = getattr(cluster_model, "cluster_centers_", None)
        if centers is None:
            return cluster, 0.0
        center = centers[cluster]
        return cluster, math.sqrt((lat - float(center[0])) ** 2 + (lon - float(center[1])) ** 2)

    cluster_model = load_geo_cluster_model(city_id)
    coords = np.array([[lat, lon]], dtype=float)
    cluster = int(cluster_model.predict(coords)[0])
    centers = getattr(cluster_model, "cluster_centers_", None)
    if centers is None:
        return cluster, 0.0
    distance = float(np.linalg.norm(coords[0] - centers[cluster]))
    return cluster, distance
