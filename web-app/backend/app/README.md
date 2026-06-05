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

1. Copy `occ_model_payload.json` as the default training-compatible row.
2. Overwrite only features the UI can provide reliably.
3. Keep training feature names unchanged.
4. Leave sentiment, topic, and distance fields at template defaults when the UI
   cannot recompute them.
5. Add `month_sin` and `month_cos` using the notebook convention:
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
