# Backend AirML: flusso dati occupancy

Questo backend FastAPI e' diviso per responsabilita':

- `main.py`: crea l'app FastAPI, configura CORS e logging, monta i router.
- `routers/`: contiene solo endpoint HTTP.
- `schemas/`: valida i JSON del frontend con Pydantic.
- `services/`: contiene logica applicativa, caricamento artifact, feature pipeline e inferenza.
- `models/`: contiene registry statico dei modelli e metadata UI.
- `core/`: contiene configurazione e path.
- `ml/`: contiene classi di compatibilita' necessarie per caricare joblib legacy.

## JSON che arriva dal frontend

Il frontend chiama `POST /predict-occupancy` con un payload di questo tipo:

```json
{
  "model_id": "xgboost",
  "property": {
    "city": "Rome",
    "neighbourhood_cleansed": "Trastevere",
    "latitude": 41.900488,
    "longitude": 12.526131,
    "property_type": "Entire rental unit",
    "room_type": "Entire home/apt",
    "amenities": ["Wifi", "Kitchen", "Air conditioning"],
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

`schemas/occupancy.py` valida questo JSON. Il punto importante e' che questo non e' ancora un dataframe per il modello: sono dati user-facing della pagina Settings.

## Sequenza completa

1. `routers/occupancy.py` riceve la request e la passa a `predict_occupancy`.

2. Pydantic valida:
   - `model_id` obbligatorio;
   - `property` con tipi e range minimi;
   - campi extra ignorati, cosi' il frontend puo' inviare anche dati non usati dal modello.

3. `services/occupancy_service.py` controlla che `model_id` esista nel registry. Per ora il modello occupancy reale e' solo `xgboost`.

4. Il backend carica una sola volta, con cache, gli artifact:
   - `web-app/artifacts/occ_model_preprocessor.joblib`;
   - `web-app/artifacts/occ_model_xgboost.joblib`;
   - `web-app/artifacts/occ_feature_metadata.json`.

5. `OccupancyFeaturePipeline` costruisce una feature row raw compatibile col training:
   - parte dai default/mediane salvati in `occ_feature_metadata.json`;
   - sovrascrive solo i campi che il frontend puo' fornire in modo affidabile;
   - mantiene i nomi feature esattamente uguali a `preprocessor.feature_names_in_`.

6. Le categorie vengono normalizzate:
   - `city` frontend viene convertita nella chiave training, per esempio `Rome -> roma`;
   - `property_type` fuori dalle categorie note diventa `Other`;
   - `room_type` fuori lista diventa `Entire home/apt`;
   - amenities fuori dalla top list training diventano `Other`.

7. I numerici vengono interpretati:
   - `nightly_price` diventa la feature raw `price`;
   - guests, bathrooms, bedrooms, beds e minimum nights vengono clampati solo per evitare input impossibili;
   - `n_amenities` conta le amenities originali selezionate dall'utente.

8. Le feature derivate vengono ricalcolate come nel notebook:
   - `beds_per_person`;
   - `bedrooms_per_person`;
   - `bathrooms_per_person`;
   - `beds_per_bedroom`;
   - divisioni mancanti o impossibili diventano `0.0`, non `NaN`.

9. Le feature geografiche vengono ricostruite dai metadata training:
   - distanza dal city center;
   - distanza dal POI piu' vicino;
   - densita' pesata dei POI;
   - cluster geografico piu' vicino tra i centri salvati;
   - distanza dal cluster geografico.

10. Le feature review vengono gestite cosi':
    - se `has_reviews=false`, i campi review principali vengono neutralizzati;
    - se `has_reviews=true`, `review_frequency_days` viene usato per stimare `reviews_per_month` e `avg_days_between_reviews`;
    - feature NLP/topic che il frontend non puo' ricostruire restano ai default/mediane training.

11. Per ogni mese il backend ricostruisce una nuova row:
    - mesi sempre `Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec`;
    - encoding con mesi `1..12`;
    - `month_sin = sin(2*pi*month/12)`;
    - `month_cos = cos(2*pi*month/12)`.

12. `services/occupancy_service.py` crea:

```python
pandas.DataFrame([feature_row], columns=preprocessor.feature_names_in_)
```

Poi esegue:

```python
transformed = preprocessor.transform(dataframe)
prediction = model.predict(transformed)
```

13. L'output del modello viene validato:
    - se non e' numerico, errore esplicito;
    - se e' `NaN` o infinito, errore esplicito;
    - se e' tra `0` e `1`, viene interpretato come occupancy rate e convertito in giorni del mese;
    - altrimenti viene interpretato come giorni;
    - il valore finale viene arrotondato e clampato tra `0` e `days_in_month`.

14. `annual_days` e' la somma dei 12 valori mensili finali.

15. La risposta torna al frontend:

```json
{
  "model": { "id": "xgboost", "name": "XGBoost", "accuracy": 82, "relativeError": 3 },
  "monthly": { "Jan": 18, "Feb": 16, "Mar": 20 },
  "annual_days": 249
}
```

Il backend non calcola `annual_revenue`. Lo calcola il frontend con:

```text
annual_revenue = price_prediction * annual_days
```

## Log di debug

Quando parte `POST /predict-occupancy`, il backend logga:

- JSON property ricevuto dal frontend;
- colonne del DataFrame passate al preprocessor;
- feature row campione per gennaio con i campi piu' importanti;
- output grezzo del modello mese per mese;
- conversione in giorni prima di round/clamp;
- giorni finali dopo round/clamp;
- JSON finale di risposta.

Nel browser il frontend logga:

- dati Settings salvati in `localStorage`;
- payload JSON inviato a `POST /predict-occupancy`;
- risposta JSON ricevuta dal backend;
- risposte di `GET /models/occupancy` e `GET /settings/options`.

## Dove cercare se le predizioni sembrano sbagliate

- Se city, property type o room type sono errati, controlla `occupancy_features.py` nei blocchi categoria.
- Se le amenities sembrano perse, controlla la lista `top_amenities` in `occ_feature_metadata.json`.
- Se la predizione cambia troppo con lat/lon, controlla distanza da centro, POI e geo cluster nei log.
- Se tutti i mesi sono simili, controlla `month_sin` e `month_cos` nella feature row.
- Se il modello restituisce valori strani, controlla `raw_model_output` nei log mensili.

`occ_model_payload.json` resta solo un artifact legacy/debug. Non viene usato come template raw per la pipeline corrente, perche' non rappresenta correttamente i dati user-facing che arrivano dal frontend.
