# Backend Structure

The FastAPI backend is split by responsibility:

- `main.py`: creates the FastAPI app, configures CORS, and mounts routers.
- `routers/`: HTTP endpoints only.
- `schemas/`: Pydantic request models for frontend JSON validation.
- `services/`: application logic, artifact loading, feature building, and inference.
- `models/`: static model registry and UI metadata.
- `core/`: paths and app configuration.
- `ml/`: compatibility classes needed to load legacy joblib artifacts.

## Occupancy Data Flow

The frontend sends this shape to `POST /predict-occupancy`:

```json
{
  "model_id": "xgboost",
  "property": {
    "city": "Rome",
    "property_type": "Entire rental unit",
    "room_type": "Entire home/apt",
    "amenities": ["Wifi", "Kitchen"],
    "accommodates": 4,
    "bathrooms": 1,
    "bedrooms": 2,
    "beds": 2,
    "nightly_price": 120,
    "minimum_nights": 2,
    "has_reviews": true,
    "review_frequency_days": 15
  }
}
```

`schemas/occupancy.py` validates this as user-facing Settings data. It is not
the final ML feature vector.

`services/occupancy_features.py` converts Settings into a model feature row:

1. Load raw defaults and training metadata from `occ_feature_metadata.json`.
2. Overwrite only features the UI can provide reliably.
3. Keep training feature names unchanged.
4. Recompute ratios, distance-to-center, distance-to-POI, POI density, geo
   cluster, and distance from geo cluster with the notebook formulas.
5. Leave sentiment and topic fields at training medians when the UI cannot
   recompute them.
6. Add `month_sin` and `month_cos` using the notebook convention:
   `sin(2*pi*month/12)` and `cos(2*pi*month/12)` for months `1..12`.

The preprocessor expects a pandas DataFrame with the original training columns,
including raw `amenities`. The service runs 12 predictions, one per month,
converts occupancy rates to days when needed, clamps each result to the month
length, and returns:

```json
{
  "model": { "id": "xgboost", "name": "XGBoost", "accuracy": 82, "relativeError": 3 },
  "monthly": { "Jan": 2, "Feb": 1 },
  "annual_days": 36
}
```

The backend intentionally does not calculate `annual_revenue`; the frontend owns
that because it combines occupancy with the separate price prediction.

`occ_model_payload.json` is kept only as a legacy/debug artifact. It was saved
from already transformed feature names and must not be used as a raw dataframe
template.

Regenerate `occ_feature_metadata.json` from the repository root with:

```bash
python scripts/export_occupancy_metadata.py
```
