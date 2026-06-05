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


class OccupancyFeaturePipeline:
    """Costruisce le feature raw occupancy partendo dalla pagina Settings.

    React invia impostazioni utente, non una riga del dataframe di training.
    Questa pipeline riproduce le trasformazioni del notebook e crea le colonne
    raw richieste da `preprocessor.feature_names_in_`.
    """

    def __init__(self, metadata: dict[str, Any]) -> None:
        self.metadata = metadata
        self.feature_names = metadata["feature_names_in"]
        self.raw_defaults = metadata["raw_defaults"]
        self.categories = metadata["categories"]
        self.top_amenities = {amenity for amenity in metadata["top_amenities"] if amenity != "Other"}

    def build_feature_row(self, property_payload: PropertySettingsPayload, month_number: int) -> dict[str, Any]:
        # 1. Si parte dalle mediane/default di training per ogni colonna raw.
        # Il frontend non conosce le feature NLP/topic, quindi le lasciamo ai
        # default salvati invece di mandare valori mancanti al modello.
        row = {feature: self.raw_defaults.get(feature, 0.0) for feature in self.feature_names}
        property_data = property_payload.model_dump() if hasattr(property_payload, "model_dump") else property_payload.dict()

        # 2. La label della UI viene convertita nell'id citta' usato nel training.
        city = city_from_settings(self.metadata, property_payload.city)
        city_id = city["id"]

        # 3. Coordinate dalla UI, con fallback alle coordinate medie della citta'.
        lat, lon = coordinates_from_settings(city, property_payload.latitude, property_payload.longitude)

        # 4. Le categoriche devono usare le etichette viste dal training.
        row["city"] = city_id
        row["property_type"] = self._property_type(property_payload.property_type)
        row["room_type"] = self._room_type(property_payload.room_type)

        # 5. Numerici diretti da Settings, clampati solo per evitare input impossibili.
        row["accommodates"] = max(as_float(property_data.get("accommodates")) or row["accommodates"], 1.0)
        row["bathrooms"] = max(as_float(property_data.get("bathrooms")) or row["bathrooms"], 0.0)
        row["bedrooms"] = max(as_float(property_data.get("bedrooms")) or row["bedrooms"], 0.0)
        row["beds"] = max(as_float(property_data.get("beds")) or row["beds"], 0.0)
        row["price"] = min(max(as_float(property_data.get("nightly_price")) or row["price"], 5.0), 10000.0)
        row["minimum_nights"] = min(max(as_float(property_data.get("minimum_nights")) or row["minimum_nights"], 1.0), 90.0)

        # 6. Le amenities sono multi-label: top amenities del notebook, resto in Other.
        original_amenities = [amenity.strip() for amenity in property_payload.amenities if amenity and amenity.strip()]
        normalized_amenities = {
            amenity if amenity in self.top_amenities else "Other"
            for amenity in original_amenities
        }
        row["amenities"] = sorted(normalized_amenities) if normalized_amenities else ["Other"]
        row["n_amenities"] = float(len(original_amenities))

        # 7. Ratio del notebook, con divisioni invalide riportate a 0.0.
        row["beds_per_person"] = safe_divide(row["beds"], row["accommodates"])
        row["bedrooms_per_person"] = safe_divide(row["bedrooms"], row["accommodates"])
        row["bathrooms_per_person"] = safe_divide(row["bathrooms"], row["accommodates"])
        row["beds_per_bedroom"] = safe_divide(row["beds"], row["bedrooms"])

        # 8. Feature geografiche da notebook: centro, POI, densita' e KMeans.
        row.update(distance_features(self.metadata, city_id, lat, lon))
        cluster, cluster_distance = predict_geo_cluster(city_id, lat, lon)
        row["geo_cluster"] = f"{city_id}_{cluster}"
        row["distance_from_geo_cluster"] = cluster_distance

        # 9. Encoding ciclico dei mesi: il notebook usa mesi 1..12.
        row["month_sin"] = math.sin(2 * math.pi * month_number / 12)
        row["month_cos"] = math.cos(2 * math.pi * month_number / 12)

        # 10. Le review manuali non bastano per rigenerare topic/NLP: i campi
        # non osservabili restano ai default, mentre review_span_days e' diretto.
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
            review_span_days = as_float(property_payload.review_span_days)
            if review_span_days:
                row["review_span_days"] = review_span_days
