# Backend AirML: flusso dati price e occupancy

Questo backend FastAPI riceve dati user-facing dalla pagina Settings e li trasforma nelle feature raw usate dai preprocessori salvati nel notebook `main.ipynb`.

## Struttura

- `main.py`: crea FastAPI, CORS, logging e monta i router.
- `routers/`: espone endpoint HTTP.
- `schemas/`: valida i JSON con Pydantic.
- `services/`: carica artifact, costruisce feature raw ed esegue inferenza.
- `models/`: contiene registry statici dei modelli disponibili.
- `core/`: contiene path e configurazione.
- `ml/`: contiene classi legacy necessarie per aprire i joblib esportati dal notebook.

## Payload frontend

Il frontend invia dati della UI, non dataframe gia' trasformati:

```json
{
  "model_id": "logxgb",
  "property": {
    "city": "Rome",
    "neighbourhood_cleansed": "Trastevere",
    "latitude": 41.9028,
    "longitude": 12.4964,
    "property_type": "Entire rental unit",
    "room_type": "Entire home/apt",
    "amenities": ["Wifi", "Kitchen", "Air conditioning"],
    "accommodates": 4,
    "bathrooms": 1,
    "bedrooms": 2,
    "beds": 2,
    "nightly_price": 120,
    "minimum_nights": 2,
    "maximum_nights": 365,
    "instant_bookable": true,
    "has_availability": true,
    "availability_365": 365,
    "has_reviews": true,
    "review_span_days": 1500
  }
}
```

`schemas/property.py` valida la property comune a price e occupancy. Per compatibilita' migra anche il vecchio `review_frequency_days` in `review_span_days`, ma il nome corretto del modello e' `review_span_days`.

## Price

Endpoint:

- `GET /models/price`
- `POST /predict-price`

Flusso:

1. `routers/price.py` riceve `PricePredictionRequest`.
2. `services/price_service.py` controlla `model_id`. Il modello reale e' `logxgb`.
3. `services/artifacts.py` carica con cache:
   - `price_model_preprocessor.joblib`;
   - `price_model_logxgb.joblib`;
   - KMeans geografico per citta'.
4. `PriceFeaturePipeline` crea le 66 feature raw viste da `price_model_preprocessor.feature_names_in_`.
5. Le feature categoriche vengono normalizzate come nel notebook:
   - `city` diventa l'id di training (`Rome -> roma`);
   - `neighbourhood` diventa `city_neighbourhood`;
   - `property_type`, `room_type`, `instant_bookable` usano le categorie del preprocessor;
   - amenities non viste dal modello diventano `Other`.
6. Le macro-categorie amenities vengono contate con le keyword del notebook (`n_kitchen`, `n_luxury`, `n_wifi`, ecc.).
7. `availability_30`, `availability_60`, `availability_90` sono derivate da `availability_365`; se `has_availability=false` diventano 0.
8. Vengono ricalcolate le feature strutturali:
   - `beds_per_person`;
   - `bedrooms_per_person`;
   - `bathrooms_per_person`;
   - `beds_per_bedroom`;
   - `accommodates_squared`.
9. Vengono ricalcolate le feature geografiche:
   - distanza dal centro citta';
   - distanza dal POI piu' vicino;
   - `poi_density`;
   - `geo_cluster` con `KMeans.predict([[latitude, longitude]])`;
   - `distance_from_geo_cluster`;
   - inverse distances.
10. Le feature NLP/topic/review che la UI non puo' ricostruire restano a `0.0`.
11. Il backend crea:

```python
pandas.DataFrame([feature_row], columns=preprocessor.feature_names_in_)
```

12. Esegue:

```python
transformed = preprocessor.transform(dataframe)
prediction = model.predict(transformed)
```

`price_model_logxgb.joblib` e' un `TransformedTargetRegressor`, quindi restituisce gia' il prezzo nella scala originale.

Risposta:

```json
{
  "model": { "id": "logxgb", "name": "XGBoost Log", "accuracy": 75, "relativeError": 25 },
  "prediction": 174,
  "lower": 130,
  "upper": 218,
  "relativeError": 25,
  "accuracy": 75,
  "currency": "EUR",
  "unit": "night"
}
```

## Occupancy

Endpoint:

- `GET /models/occupancy`
- `GET /settings/options`
- `POST /predict-occupancy`

Flusso:

1. `routers/occupancy.py` riceve `OccupancyPredictionRequest`.
2. `services/occupancy_service.py` controlla `model_id`. Il modello reale e' `xgboost`.
3. Gli artifact caricati con cache sono:
   - `occ_model_preprocessor.joblib`;
   - `occ_model_xgboost.joblib`;
   - `occ_feature_metadata.json`;
   - KMeans geografico per citta'.
4. `GET /settings/options` espone citta', quartieri, property type, room type e amenities; le amenities sono l'unione tra top occupancy e classi amenities del preprocessor price.
5. `OccupancyFeaturePipeline` parte da `raw_defaults` in `occ_feature_metadata.json`, cosi' le feature NLP/topic non ricostruibili restano coerenti con il training.
6. La property UI sovrascrive solo le feature affidabili:
   - citta', property type, room type;
   - amenities top 20 piu' `Other`;
   - ospiti, bagni, camere, letti;
   - `nightly_price -> price`;
   - `minimum_nights`;
   - `review_span_days`.
7. Le feature ratio e geografiche vengono ricostruite come nel notebook.
8. `geo_cluster` viene calcolato con KMeans per citta' e salvato come label occupancy `city_cluster`, ad esempio `roma_3`.
9. Per ogni mese viene creata una riga diversa con:

```text
month_sin = sin(2*pi*month/12)
month_cos = cos(2*pi*month/12)
```

10. Ogni riga passa nel preprocessor e poi nel modello XGBoost occupancy.
11. Se il modello restituisce un valore in `[0, 1]`, viene interpretato come occupancy rate mensile e convertito in giorni; altrimenti viene interpretato come giorni diretti.
12. I giorni vengono arrotondati e clampati alla durata del mese.

Risposta:

```json
{
  "model": { "id": "xgboost", "name": "XGBoost", "accuracy": 82, "relativeError": 3 },
  "monthly": { "Jan": 3, "Feb": 2, "Mar": 2 },
  "annual_days": 57
}
```

Il backend non calcola `annual_revenue`: il frontend fa `price_prediction * annual_days`.

## KMeans geografici

Il loader cerca prima:

```text
web-app/artifacts/geo_cluster_kmeans_{city_id}.joblib
```

Sono predisposti file per tutte le citta' in `occ_feature_metadata.json`:

```text
bergamo, bologna, firenze, milano, napoli, puglia, roma, sicilia, trentino, venezia
```

Per ora questi file sono placeholder copiati dal KMeans legacy. Quando verranno esportati i KMeans corretti per citta', basta sostituire i singoli file mantenendo lo stesso nome.

## Log

Il backend logga:

- payload property ricevuto;
- colonne DataFrame passate al preprocessor;
- feature row raw sintetica;
- output modello;
- risposta finale.

Il frontend logga:

- request e response di `POST /predict-price`;
- request e response di `POST /predict-occupancy`;
- response di `GET /models/price`, `GET /models/occupancy`, `GET /settings/options`;
- dati Settings salvati in localStorage.

## Note sugli artifact JSON

`price_model_payload.json` e `occ_model_payload.json` sono esempi/debug esportati dal notebook dopo trasformazioni intermedie. Non rappresentano il payload che arriva dal frontend e non sono usati come template principale di inferenza.
