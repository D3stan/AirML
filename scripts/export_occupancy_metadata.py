from __future__ import annotations

import ast
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ARTIFACTS_DIR = ROOT / "web-app" / "artifacts"
NOTEBOOK_PATH = ROOT / "main.ipynb"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "occ_model_preprocessor.joblib"
OUTPUT_PATH = ARTIFACTS_DIR / "occ_feature_metadata.json"

SEED = 7112004
OCC_FEATURES = [
    "id",
    "city",
    "neighbourhood_cleansed",
    "latitude",
    "longitude",
    "property_type",
    "room_type",
    "accommodates",
    "bathrooms",
    "bedrooms",
    "beds",
    "amenities",
    "price",
    "minimum_nights",
    "review_scores_rating",
    "review_scores_cleanliness",
    "review_scores_checkin",
    "review_scores_communication",
    "review_scores_location",
    "review_scores_value",
    "reviews_per_month",
    "estimated_occupancy_l365d",
    "vader_compound_mean",
    "vader_compound_std",
    "review_length_mean",
    "asp_cleanliness_mean",
    "asp_location_mean",
    "asp_value_mean",
    "asp_host_quality_mean",
    "pct_positive",
    "pct_negative",
    "review_span_days",
    "avg_days_between_reviews",
    "days_since_last_review",
    "topic_0",
    "topic_1",
    "topic_2",
    "topic_3",
    "topic_4",
]
MONTH_RATE_COLUMNS = [f"occupancy_rate_{month:02d}" for month in range(1, 13)]


def load_notebook_geo_constants() -> tuple[dict, dict]:
    """Reuse city center and POI constants from the notebook without rewriting them twice."""

    notebook = json.loads(NOTEBOOK_PATH.read_text(encoding="utf-8"))
    namespace: dict[str, object] = {"np": np}

    for marker in ("city_centers =", "poi_by_city ="):
        source = next(
            (
                "".join(cell.get("source", []))
                for cell in notebook["cells"]
                if marker in "".join(cell.get("source", []))
            ),
            None,
        )
        if source is None:
            raise RuntimeError(f"Unable to find notebook cell containing {marker!r}")
        exec(source, namespace)

    return namespace["city_centers"], namespace["poi_by_city"]


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_m = 6371000
    lat1, lon1, lat2, lon2 = np.radians([lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return float(radius_m * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a)))


def distances_from_points(lat: float, lon: float, points: list[dict]) -> list[float]:
    return [haversine(lat, lon, point["lat"], point["lon"]) for point in points]


def safe_parse_amenities(value) -> list[str]:
    if isinstance(value, list):
        return value
    if pd.isna(value):
        return []
    try:
        parsed = ast.literal_eval(value)
    except (ValueError, SyntaxError):
        return []
    return parsed if isinstance(parsed, list) else []


def load_calendar_targets() -> pd.DataFrame:
    frames = []
    for calendar_path in sorted(DATA_DIR.glob("*/calendar.csv")):
        columns = pd.read_csv(calendar_path, nrows=0).columns
        keep_cols = ["listing_id", *[column for column in MONTH_RATE_COLUMNS if column in columns]]
        if len(keep_cols) <= 1:
            continue
        frame = pd.read_csv(calendar_path, usecols=keep_cols)
        frames.append(frame)

    if not frames:
        return pd.DataFrame(columns=["id", *MONTH_RATE_COLUMNS])

    calendars = pd.concat(frames, ignore_index=True)
    return calendars.groupby("listing_id", as_index=False).mean(numeric_only=True).rename(columns={"listing_id": "id"})


def create_geo_clusters(df: pd.DataFrame, n_clusters_per_city: int = 15, min_listings_for_clustering: int = 50):
    df = df.copy()
    df["geo_cluster"] = -1
    df["distance_from_geo_cluster"] = 0.0
    centers_by_city: dict[str, list[dict[str, float | int]]] = {}

    for city, group in df.groupby("city"):
        mask = df["city"] == city
        coords = group[["latitude", "longitude"]].to_numpy()

        if len(group) < min_listings_for_clustering:
            df.loc[mask, "geo_cluster"] = 0
            center = coords.mean(axis=0)
            centers = np.array([center])
            labels = np.zeros(len(group), dtype=int)
        else:
            kmeans = KMeans(n_clusters=n_clusters_per_city, random_state=SEED, n_init=10)
            labels = kmeans.fit_predict(coords)
            centers = kmeans.cluster_centers_
            df.loc[mask, "geo_cluster"] = labels

        distances = np.linalg.norm(coords - centers[labels], axis=1)
        df.loc[mask, "distance_from_geo_cluster"] = distances
        centers_by_city[city] = [
            {"cluster": int(index), "lat": float(center[0]), "lon": float(center[1])}
            for index, center in enumerate(centers)
        ]

    df["geo_cluster"] = df["city"] + "_" + df["geo_cluster"].astype(int).astype(str)
    return df, centers_by_city


def build_metadata() -> dict:
    sys.path.insert(0, str((ROOT / "web-app" / "backend").resolve()))
    from app.ml.legacy import MLBTransformer

    setattr(sys.modules["__main__"], "MLBTransformer", MLBTransformer)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    feature_names_in = list(preprocessor.feature_names_in_)
    city_centers, poi_by_city = load_notebook_geo_constants()

    available_columns = pd.read_csv(DATA_DIR / "listings_full.csv", nrows=0).columns
    usecols = [column for column in OCC_FEATURES if column in available_columns]
    listings = pd.read_csv(DATA_DIR / "listings_full.csv", usecols=usecols)
    listings = listings.rename(columns={"neighbourhood_cleansed": "neighbourhood"})

    dedup_cols = [column for column in listings.columns if column != "amenities"]
    listings = listings.drop_duplicates(subset=dedup_cols).reset_index(drop=True)
    listings = listings.dropna(subset=["estimated_occupancy_l365d"]).reset_index(drop=True)

    listings["price"] = (
        listings["price"].astype(str).str.replace("$", "", regex=False).str.replace(",", "", regex=False)
    )
    listings["price"] = pd.to_numeric(listings["price"], errors="coerce").clip(upper=10000, lower=5)
    listings = listings.dropna(subset=["bedrooms", "beds"])
    listings["bathrooms"] = listings["bathrooms"].fillna(0)
    listings = listings[
        (listings["bathrooms"] < 20) & (listings["bedrooms"] < 22) & (listings["beds"] < 35)
    ].reset_index(drop=True)

    listings["has_reviews"] = (listings["reviews_per_month"].fillna(0) > 0).astype(int)
    nlp_and_review_cols = [
        column
        for column in usecols
        if "review" in column or "vader" in column or "asp_" in column or "topic_" in column or "pct_" in column or "days" in column
    ]
    for column in nlp_and_review_cols:
        if column in listings.columns:
            listings[column] = listings[column].fillna(listings[column].median())

    if "minimum_nights" in listings.columns:
        listings["minimum_nights"] = listings["minimum_nights"].fillna(listings["minimum_nights"].median()).clip(upper=90)

    listings["amenities"] = listings["amenities"].apply(safe_parse_amenities)
    listings["n_amenities"] = listings["amenities"].apply(len)

    top_amenities = listings["amenities"].explode().value_counts().head(20).index.tolist()
    listings["amenities"] = listings["amenities"].apply(
        lambda values: list({value if value in top_amenities else "Other" for value in values})
    )

    top_property_types = listings["property_type"].value_counts().head(15).index.tolist()
    listings["property_type"] = listings["property_type"].where(listings["property_type"].isin(top_property_types), "Other")

    listings["beds_per_person"] = listings["beds"] / listings["accommodates"]
    listings["bedrooms_per_person"] = listings["bedrooms"] / listings["accommodates"]
    listings["bathrooms_per_person"] = listings["bathrooms"] / listings["accommodates"]
    listings["beds_per_bedroom"] = listings["beds"] / listings["bedrooms"]
    ratio_cols = ["beds_per_person", "bedrooms_per_person", "bathrooms_per_person", "beds_per_bedroom"]
    listings[ratio_cols] = listings[ratio_cols].replace([np.inf, -np.inf], np.nan).fillna(0)

    listings["distance_from_city_center"] = listings.apply(
        lambda row: min(distances_from_points(row["latitude"], row["longitude"], city_centers.get(row["city"], []))),
        axis=1,
    )
    poi_distances = listings.apply(
        lambda row: distances_from_points(row["latitude"], row["longitude"], poi_by_city.get(row["city"], [])),
        axis=1,
    )
    listings["distance_from_poi"] = poi_distances.apply(lambda values: min(values) if values else np.nan)
    listings["poi_density"] = (
        poi_distances.apply(lambda values: sum(1 for value in values if value <= 250)) * 0.25
        + poi_distances.apply(lambda values: sum(1 for value in values if value <= 500)) * 0.25
        + poi_distances.apply(lambda values: sum(1 for value in values if value <= 1000)) * 0.25
        + poi_distances.apply(lambda values: sum(1 for value in values if value <= 2000)) * 0.15
        + poi_distances.apply(lambda values: sum(1 for value in values if value <= 5000)) * 0.10
    )

    calendars = load_calendar_targets()
    listings = listings.merge(calendars, on="id", how="left")
    for column in MONTH_RATE_COLUMNS:
        if column in listings.columns:
            listings[column] = listings[column].fillna(listings[column].median())

    target_cols = [column for column in MONTH_RATE_COLUMNS if column in listings.columns]
    feature_cols = [column for column in listings.columns if column not in target_cols and column != "estimated_occupancy_l365d"]
    long_df = pd.melt(
        listings,
        id_vars=feature_cols,
        value_vars=target_cols,
        var_name="month",
        value_name="occupancy_rate",
    )
    long_df["month"] = long_df["month"].str.extract(r"(\d+)").astype(int)
    long_df["month_sin"] = np.sin(2 * np.pi * long_df["month"] / 12)
    long_df["month_cos"] = np.cos(2 * np.pi * long_df["month"] / 12)
    long_df = long_df.drop(columns=["month"])
    long_df = long_df.dropna(subset=["occupancy_rate"]).reset_index(drop=True)

    filtered = long_df[
        (long_df["minimum_nights"] <= 30)
        & ~((long_df["has_reviews"] == 0) & (long_df["occupancy_rate"] == 0))
        & ~((long_df["occupancy_rate"] >= 0.95) & (long_df["reviews_per_month"] <= 0.05))
    ].copy()
    filtered = filtered.drop_duplicates(subset=["id", "month_sin", "month_cos"]).reset_index(drop=True)
    counts = filtered["id"].value_counts()
    filtered = filtered[~filtered["id"].isin(counts[counts > 12].index)].copy()
    occ_std = filtered.groupby("id")["occupancy_rate"].std()
    filtered = filtered[filtered["id"].isin(occ_std[occ_std <= 0.4].index)].copy()
    zombie_ids = filtered.groupby("id")["occupancy_rate"].apply(lambda values: (values == 1.0).all())
    filtered = filtered[~filtered["id"].isin(zombie_ids[zombie_ids].index)].copy()
    filtered = filtered[~((filtered["vader_compound_mean"] <= -0.5) & (filtered["occupancy_rate"] >= 0.95))].copy()
    zombie_ratio = filtered.groupby("id")["occupancy_rate"].apply(lambda values: (values == 1.0).mean())
    filtered = filtered[
        ~((filtered["vader_compound_mean"] <= -0.4) & (filtered["occupancy_rate"] >= 0.90))
        & ~((filtered["vader_compound_mean"] >= 0.8) & (filtered["reviews_per_month"] >= 2.0) & (filtered["occupancy_rate"] <= 0.05))
        & ~filtered["id"].isin(zombie_ratio[zombie_ratio >= 0.80].index)
    ].copy()
    filtered = filtered[
        ~((filtered["occupancy_rate"] >= 0.90) & ((filtered["days_since_last_review"] > 180) | (filtered["reviews_per_month"] < 0.5)))
    ].copy()
    filtered = filtered[filtered["occupancy_rate"] < 0.96].copy()
    filtered, geo_cluster_centers = create_geo_clusters(filtered, n_clusters_per_city=15)

    raw_defaults: dict[str, object] = {}
    for column in feature_names_in:
        if column == "amenities":
            raw_defaults[column] = ["Other"]
        elif column in filtered.columns:
            series = filtered[column].dropna()
            if series.empty:
                raw_defaults[column] = 0.0
            elif pd.api.types.is_numeric_dtype(series):
                raw_defaults[column] = float(series.median())
            else:
                raw_defaults[column] = series.mode().iloc[0]

    city_labels = {
        "bergamo": "Bergamo",
        "bologna": "Bologna",
        "firenze": "Florence",
        "milano": "Milan",
        "napoli": "Naples",
        "puglia": "Puglia",
        "roma": "Rome",
        "sicilia": "Sicily",
        "trentino": "Trentino",
        "venezia": "Venice",
    }
    cities = [
        {
            "id": city,
            "label": city_labels.get(city, city.title()),
            "latitude": float(city_centers[city][0]["lat"]),
            "longitude": float(city_centers[city][0]["lon"]),
        }
        for city in sorted(filtered["city"].dropna().unique().tolist())
        if city in city_centers
    ]
    neighbourhoods_by_city = {
        city: group["neighbourhood"].dropna().value_counts().head(20).index.tolist()
        for city, group in filtered.groupby("city")
        if "neighbourhood" in group.columns
    }

    categories = {}
    for name, transformer, columns in preprocessor.transformers_:
        if name == "cat":
            categories.update({column: [str(value) for value in values] for column, values in zip(columns, transformer.categories_)})
        elif name == "amenities":
            categories["amenities"] = [str(value) for value in transformer.mlb.classes_]

    return {
        "version": 1,
        "source": "main.ipynb occupancy preprocessing",
        "feature_names_in": feature_names_in,
        "raw_defaults": raw_defaults,
        "categories": categories,
        "top_amenities": categories.get("amenities", top_amenities),
        "top_property_types": categories.get("property_type", [*top_property_types, "Other"]),
        "room_types": categories.get("room_type", sorted(filtered["room_type"].dropna().unique().tolist())),
        "cities": cities,
        "neighbourhoods_by_city": neighbourhoods_by_city,
        "city_centers": city_centers,
        "poi_by_city": poi_by_city,
        "geo_cluster_centers": geo_cluster_centers,
    }


def main() -> None:
    metadata = build_metadata()
    OUTPUT_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
