# AirML Web App

Questa cartella contiene la web app locale di AirML:

- `backend/`: API FastAPI con modelli reali esportati dal notebook.
- `frontend/`: SPA React + Vite + Tailwind.
- `artifacts/`: preprocessori, modelli XGBoost e KMeans geografici.

Per usare l'app in locale devi avviare backend e frontend in due terminali separati.

## Prerequisiti

- Python 3.10 o superiore
- Node.js 20 o superiore
- npm

Controllo rapido:

```bash
python --version
node --version
npm --version
```

## 1. Avvia il backend FastAPI

Apri un terminale dalla root del progetto:

```bash
cd web-app/backend
python -m pip install fastapi uvicorn pydantic pandas scikit-learn xgboost joblib httpx pytest
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

URL utili:

```text
Swagger / API docs:
http://127.0.0.1:8000/docs

Health check:
http://127.0.0.1:8000/health
```

Endpoint principali:

```text
GET  /models/price
POST /predict-price
GET  /models/occupancy
POST /predict-occupancy
GET  /settings/options
```

## 2. Avvia il frontend React/Vite

Apri un secondo terminale dalla root del progetto:

```bash
cd web-app/frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Apri:

```text
http://127.0.0.1:5173/dashboard
```

Rotte principali:

```text
/dashboard
/settings
```

La porta `8000` e' solo backend. La SPA gira sulla porta `5173`.

## 3. Flusso dati prima dell'inferenza

La pagina Settings salva una property user-facing:

```json
{
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
  "availability_365": 365,
  "instant_bookable": true,
  "has_reviews": true,
  "review_span_days": 1500
}
```

Quando premi Run Simulation:

1. Il frontend chiama `POST /predict-price` con `{ model_id: "logxgb", property }`.
2. Il backend valida con Pydantic.
3. La pipeline price ricostruisce le 66 feature raw del notebook:
   - `city`, `property_type`, `room_type`, `instant_bookable`;
   - `neighbourhood = city_neighbourhood`;
   - amenities top e macro-categorie;
   - availability 30/60/90 derivate da `availability_365`;
   - ratio strutturali e `accommodates_squared`;
   - distanze da centro e POI;
   - `geo_cluster` con KMeans;
   - inverse distances;
   - feature NLP/topic non ricostruibili a `0`.
4. La riga passa in `price_model_preprocessor.joblib`.
5. Il modello `price_model_logxgb.joblib` restituisce il prezzo a notte.
6. Il frontend chiama `POST /predict-occupancy` con la stessa property.
7. La pipeline occupancy parte dai default in `occ_feature_metadata.json`, sovrascrive i campi disponibili e crea una riga per ciascun mese.
8. Ogni riga passa in `occ_model_preprocessor.joblib` e poi in `occ_model_xgboost.joblib`.
9. Il frontend calcola:

```text
annual_revenue = price_prediction * annual_days
```

`GET /settings/options` invia al frontend le opzioni compatibili con i modelli. Le amenities sono l'unione tra quelle principali di occupancy e quelle conosciute dal preprocessor price.

## 4. Nome corretto review

Il campo corretto e':

```text
review_span_days
```

Rappresenta da quanti giorni l'host/listing ha uno storico attivo. Il vecchio nome `review_frequency_days` viene migrato automaticamente dal localStorage, ma non deve piu' essere usato nei nuovi payload.

## 5. KMeans geografici

Il backend cerca KMeans separati per citta':

```text
web-app/artifacts/geo_cluster_kmeans_{city_id}.joblib
```

Sono presenti placeholder per:

```text
bergamo, bologna, firenze, milano, napoli, puglia, roma, sicilia, trentino, venezia
```

Per ora sono copie dell'artifact legacy. Quando vengono riesportati i KMeans corretti dal notebook, sostituisci i file mantenendo lo stesso nome.

## 6. Build frontend

Per verificare che il frontend compili:

```bash
cd web-app/frontend
npm run build
```

Per vedere la build prodotta:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

Apri:

```text
http://127.0.0.1:4173
```

## 7. Test backend

Se sono presenti test backend:

```bash
cd web-app/backend
python -m pytest tests -p no:cacheprovider
```

Smoke manuale utile da Swagger:

```text
POST http://127.0.0.1:8000/predict-price
POST http://127.0.0.1:8000/predict-occupancy
```

## 8. Problemi comuni

### La SPA si vede senza CSS

Apri il frontend da Vite:

```text
http://127.0.0.1:5173/dashboard
```

Non usare la porta `8000` per la SPA.

### La porta 5173 e' gia' occupata

Chiudi il vecchio dev server con `Ctrl + C`.

Su Windows/Git Bash puoi anche usare:

```bash
taskkill //F //IM node.exe
```

Poi rilancia:

```bash
cd web-app/frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

### Warning sklearn sugli artifact

Se vedi warning tipo artifact salvato con sklearn `1.8.0` e caricato con `1.9.0`, l'inferenza puo' comunque funzionare. Per eliminarli, usa la stessa versione sklearn usata durante l'export dal notebook.
