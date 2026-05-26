# Struttura del Progetto

## 0. Setup e Caricamento Librerie

### 0.1 Struttura dei dati
- Dataset principale: `listings.csv` (dati strutturati su alloggi).
    `id,listing_url,scrape_id,last_scraped,source,name,description,neighborhood_overview,picture_url,host_id,host_url,host_name,host_since,host_location,host_about,host_response_time,host_response_rate,host_acceptance_rate,host_is_superhost,host_thumbnail_url,host_picture_url,host_neighbourhood,host_listings_count,host_total_listings_count,host_verifications,host_has_profile_pic,host_identity_verified,neighbourhood,neighbourhood_cleansed,neighbourhood_group_cleansed,latitude,longitude,property_type,room_type,accommodates,bathrooms,bathrooms_text,bedrooms,beds,amenities,price,minimum_nights,maximum_nights,minimum_minimum_nights,maximum_minimum_nights,minimum_maximum_nights,maximum_maximum_nights,minimum_nights_avg_ntm,maximum_nights_avg_ntm,calendar_updated,has_availability,availability_30,availability_60,availability_90,availability_365,calendar_last_scraped,number_of_reviews,number_of_reviews_ltm,number_of_reviews_l30d,availability_eoy,number_of_reviews_ly,estimated_occupancy_l365d,estimated_revenue_l365d,first_review,last_review,review_scores_rating,review_scores_accuracy,review_scores_cleanliness,review_scores_checkin,review_scores_communication,review_scores_location,review_scores_value,license,instant_bookable,calculated_host_listings_count,calculated_host_listings_count_entire_homes,calculated_host_listings_count_private_rooms,calculated_host_listings_count_shared_rooms,reviews_per_month`
    `23986,https://www.airbnb.com/rooms/23986,20250922033939,2025-09-24,city scrape,""" Characteristic Milanese flat""",I look forward to welcoming you in my flat; it is suitable for couples and groups of up to 4 people,,https://a0.muscache.com/pictures/623d63f8-56cf-4bd0-af95-fb50c5abf6af.jpg,95941,https://www.airbnb.com/users/show/95941,Jeremy,2010-03-19,"Milan, Italy","Hallo , I'm Jeremy Hayne I live in Milan and I'm a freelance translator and archaeologist. I look forward to hosting you in my comfortable Milan flat and am happy to answer any questions you have. ",N/A,N/A,0%,f,https://a0.muscache.com/im/users/95941/profile_pic/1299938878/original.jpg?aki_policy=profile_small,https://a0.muscache.com/im/users/95941/profile_pic/1299938878/original.jpg?aki_policy=profile_x_medium,Navigli,1,1,['email'],t,t,,NAVIGLI,,45.44806,9.17373,Entire rental unit,Entire home/apt,4,1.0,1 bath,1,1,"[""Paid parking off premises"", ""Dedicated workspace"", ""Iron"", ""Hair dryer"", ""Dishes and silverware"", ""TV"", ""Kitchen"", ""Washer"", ""Essentials"", ""Bed linens"", ""Long term stays allowed"", ""Extra pillows and blankets"", ""Hot water"", ""Hangers"", ""Fast wifi \u2013 92 Mbps"", ""Heating"", ""Cooking basics"", ""Indoor fireplace""]",$180.00,31,730,31,31,730,730,31.0,730.0,,t,28,57,87,362,2025-09-24,26,0,0,96,1,0,0,2012-04-24,2024-04-20,4.64,4.65,4.19,4.58,4.73,4.69,4.46,,f,1,1,0,0,0.16`
- Dataset secondario: `reviews.csv` (recensioni testuali).
    `listing_id,id,date,reviewer_id,reviewer_name,comments`
    `4828862,28455010,2015-03-23,13886887,Francesco,"Tutto perfetto, appartamento pulito e in ordine."`
- Dataset terziario: `calendar.csv` (disponibilità e prezzi giornalieri).
    `listing_id,date,available,price,adjusted_price,minimum_nights,maximum_nights`
    `4828862,2025-09-24,f,,,1,30`

### 0.2 Import

```python
# numpy, pandas, matplotlib, seaborn
# sklearn (models, metrics, preprocessing, model_selection)
# eventuali librerie extra: xgboost, vaderSentiment, scipy.sparse...
```

### 0.3 Caricamento Dataset

```python
COLS_TO_DROP = {
    # URL / immagini
    "picture_url", "host_thumbnail_url", "host_picture_url", "host_url",
    # Testuali / identificativi listing
    "name", "description", "neighborhood_overview",
    # Identificatori di scraping / metadati tecnici
    "scrape_id", "last_scraped", "source",
    # Identificatori personali / dati host
    "host_id", "host_name", "host_since", "host_location", "host_about",
    "host_neighbourhood", "host_listings_count", "host_total_listings_count",
    "host_verifications", "host_has_profile_pic", "host_identity_verified",
    # Metriche risposta host
    "host_response_time", "host_response_rate", "host_acceptance_rate", "host_is_superhost",
    # Location duplicate / non predittive
    "neighbourhood", "neighbourhood_group_cleansed",
    # Testo derivabile / calcolato
    "bathrooms_text", "first_review", "last_review",
    # Calcolati host (aggregati)
    "calculated_host_listings_count", "calculated_host_listings_count_entire_homes",
    "calculated_host_listings_count_private_rooms", "calculated_host_listings_count_shared_rooms",
}

listings_df = pd.read_csv(
    "listings.csv",
    usecols=lambda col: col not in COLS_TO_DROP
)
reviews_df  = pd.read_csv("reviews.csv")
# calendar.csv NON caricato (vedi §0.1).
# df.head(), df.shape, df.info(memory_usage="deep")
```

---

## 1. Descrizione del Contesto

### 1.1 Obiettivo
Due task predittivi sui dati Airbnb (Milano, scrape 2025-09-22), arricchiti da una pipeline di feature engineering basata sulle recensioni:
- **Task A — Regressione**: predire il `price` di un alloggio.
- **Task B — Regressione**: predire l'occupancy stimata annua (`estimated_occupancy_l365d`).
- **Task D — Review Intelligence Pipeline**: estrarre feature strutturate da 283 MB di testo recensioni (sentiment, topic modeling, aspetti, segnali temporali) e integrarle nei Task A e B.

### 1.2 Fonte e Struttura del Dataset
- **`listings.csv`** (~75 colonne, una riga per alloggio): anagrafica alloggio, host, location, prezzo, amenities, score recensioni aggregati, occupancy stimata.
- **`reviews.csv`** (6 colonne, una riga per recensione): testi liberi con `listing_id`, `reviewer_id`, `date`, `comments`.
- *`calendar.csv` escluso* (vedi §0.1).

### 1.3 Descrizione delle Variabili
Variabili-chiave di `listings.csv`:
- **Numeriche**: `price` (string `$180.00` → int), `accommodates`, `bathrooms`, `bedrooms`, `beds`, `minimum_nights`, `availability_{30,60,90,365}`, `number_of_reviews*`, `review_scores_*`, `reviews_per_month`, `estimated_occupancy_l365d`, `estimated_revenue_l365d`, `latitude`, `longitude`.
- **Categoriche**: `room_type`, `property_type`, `neighbourhood_cleansed`, `host_response_time`, `host_is_superhost`, `instant_bookable`, `has_availability`.
- **Liste / testuali**: `amenities` (boolean list), `description`, `host_about`, `name`, `neighborhood_overview`.
- **Identificatori da rimuovere**: `listing_url`, `scrape_id`, `host_id`, `host_url`, `picture_url`, `host_thumbnail_url`, `host_picture_url`, `host_name`, `reviewer_name`.
- **Target**: `price` (Task A), `estimated_occupancy_l365d` (Task B); Task D è una pipeline di feature engineering senza target proprio (vedi §4.3).

### 1.4 Prima Scrematura

```python
# Drop URL/immagini (vedi 1.3)
# Drop righe duplicate
# Drop righe con valori nulli di:
#   - price
#   - oppure con piu del 70% di valori nulli
#   - accommodates < 1
```

---

## 2. Analisi Esplorativa dei Dati (EDA)

### 2.1 Statistiche Generali

```python
# listings_df.describe() — media, std, min/max, quartili sulle numeriche
# value_counts() su room_type, property_type, neighbourhood_cleansed
# Matrice di correlazione tra: price, accommodates, beds, review_scores_*, availability_*
```

### 2.2 Distribuzione delle Variabili Target
- **Price (4.1)**: istogramma + log-transform (price è tipicamente skew-positivo).
- **Occupancy (4.2)**: istogramma di `estimated_occupancy_l365d`.

### 2.3 Distribuzione delle Feature
- Istogrammi delle variabili numeriche (subplot grid).
- Barplot top-N per `neighbourhood_cleansed`, `property_type`.
- Boxplot per evidenziare outlier su `price`, `minimum_nights`.

### 2.4 Relazioni Feature–Target
- Scatter `accommodates` / `beds` / `bathrooms` vs `price`.
- Boxplot `price` per `room_type` e per `neighbourhood_cleansed`.
- Heatmap correlazione numeriche (focus su `price` e `estimated_occupancy_l365d`).
- Mappa neighbourhood colorata per prezzo (opzionale).

### 2.5 Commento dei Risultati EDA
- Osservazioni chiave: distribuzioni, outlier, correlazioni notevoli.
- Feature che sembrano più promettenti.
- Eventuali anomalie da gestire nella preparazione.

---

## 3. Preparazione Base dei Dati

> Questa sezione contiene la **pulizia condivisa** applicata a `listings.csv` (e join con `reviews.csv` per la Review Intelligence Pipeline). **Split, encoding e scaling sono per-task** e vivono dentro le rispettive sezioni di §4 — vedi la tabella in §3.3.

### 3.1 Feature Engineering — Strutturali
- Parsing tipi: `price` "$180.00" → int.
- Da `property_type` → enum (stessa cosa per altri `_type`?)
- Da `host_since` → `host_tenure_days` (giorni di esperienza host).
- Da `last_review` / `first_review` → `review_span_days`, `days_since_last_review`.
- Da `bathrooms_text` → `is_shared_bath` (booleano).
- Da `amenities` (lista) → `n_amenities` (conteggio totale) + cluster macro-categoria (vedi §3.2).
- Opzionale: Da `latitude`/`longitude` → distanza dal centro città (Duomo).

### 3.2 Feature Engineering — Amenity Clustering

> La colonna `amenities` contiene una lista JSON di stringhe free-text. Il one-hot encoding di tutti i valori unici produrrebbe **16.000+ colonne sparse** che degradano le performance e l'interpretabilità dei modelli. Raggruppiamo in **15 macro-categorie** tramite keyword matching.

```python
AMENITY_CLUSTERS = {
    # ── Cucina ──
    "has_full_kitchen":      ["kitchen", "oven", "stove", "microwave", "fridge",
                              "refrigerator", "dishwasher", "coffee", "cooking"],
    # ── Intrattenimento ──
    "has_entertainment":     ["tv", "netflix", "chromecast", "game console",
                              "books", "board game", "sound system", "streaming"],
    # ── Clima ──
    "has_climate_control":   ["air conditioning", "ac", "heating", "central heating",
                              "fan", "portable heater", "radiator"],
    # ── Essenziali ospite ──
    "has_essentials":        ["essentials", "bed linens", "towels", "shampoo",
                              "soap", "toilet paper", "hangers"],
    # ── Lusso / Premium ──
    "has_luxury":            ["pool", "gym", "hot tub", "jacuzzi", "sauna",
                              "rooftop", "doorman", "concierge", "garden", "terrace"],
    # ── Workspace ──
    "has_workspace":         ["workspace", "dedicated workspace", "desk", "monitor",
                              "office", "laptop friendly"],
    # ── Connettività ──
    "has_fast_wifi":         ["wifi", "fast wifi", "ethernet", "internet"],
    # ── Lavanderia ──
    "has_laundry":           ["washer", "dryer", "iron", "ironing board",
                              "laundry", "clothes rack"],
    # ── Sicurezza ──
    "has_safety":            ["smoke alarm", "carbon monoxide", "fire extinguisher",
                              "first aid", "lock", "security camera"],
    # ── Parcheggio e Trasporti ──
    "has_parking":           ["parking", "garage", "bike", "bicycle", "ev charger"],
    # ── Spazi esterni ──
    "has_outdoor_space":     ["balcony", "patio", "backyard", "bbq", "grill",
                              "outdoor dining", "garden"],
    # ── Bambini e Famiglie ──
    "has_family_friendly":   ["crib", "high chair", "baby", "children",
                              "baby bath", "baby monitor", "toys"],
    # ── Accessibilità ──
    "has_accessibility":     ["elevator", "wheelchair", "accessible", "step-free",
                              "wide entrance", "grab bar"],
    # ── Check-in ──
    "has_self_checkin":      ["self check-in", "lockbox", "keypad", "smart lock",
                              "door code"],
    # ── Colazione ──
    "has_breakfast":         ["breakfast", "cereal", "coffee maker", "espresso",
                              "tea kettle"],
}

import json

def parse_amenities(amenity_str):
    """Parsing della lista JSON di amenities."""
    try:
        return [a.lower().strip() for a in json.loads(amenity_str)]
    except (json.JSONDecodeError, TypeError):
        return []

def cluster_amenities(amenity_list, clusters):
    """Restituisce dict di flag booleani per ogni cluster."""
    text = " | ".join(amenity_list)
    return {
        cluster_name: int(any(kw in text for kw in keywords))
        for cluster_name, keywords in clusters.items()
    }

# Applicazione al dataframe
amenity_flags = listings_df["amenities"].apply(
    lambda x: pd.Series(cluster_amenities(parse_amenities(x), AMENITY_CLUSTERS))
)
listings_df = pd.concat([listings_df.drop(columns=["amenities"]), amenity_flags], axis=1)
```

**Output**: 15 nuove colonne booleane in sostituzione della colonna `amenities` raw. Si mantiene `n_amenities` (conteggio totale) come feature numerica aggiuntiva.

### 3.3 Gestione Valori Nulli
- Imputation per colonna: mediana per numeriche, moda per categoriche, sentinel `"Unknown"` per testuali.
- Drop righe con target nullo (per il task corrispondente).

### 3.4 Pipeline per-task — vista d'insieme

| Task | Sorgente                          | Target                          | Encoding                | Scaling      | Split                          |
|------|-----------------------------------|---------------------------------|-------------------------|--------------|--------------------------------|
| 4.1 (A) | `listings_enriched`            | `price`                         | OHE su categoriche      | StandardScaler | random 80/20                  |
| 4.2 (B) | `listings_enriched`            | `estimated_occupancy_l365d`     | OHE su categoriche      | StandardScaler | random 80/20                  |
| 4.3 (D) | `reviews.csv` ⨝ `listings.csv` | *nessun target — solo feature engineering* | TF-IDF, VADER, etc. | —          | —                              |

> Concettualmente: §3.1–§3.3 girano una volta sola sul dataframe pulito; poi ogni task in §4 si costruisce il proprio `(X, y)`, applica lo split appropriato e il preprocessing (encoding/scaling/vectorization) **dentro una `Pipeline` sklearn** per evitare leakage. Il Task D (§4.3) non ha split proprio perché è una pipeline di preprocessing, non un task predittivo.

---

## 4. Addestramento e Valutazione dei Modelli

### 4.1 Task A — Price Prediction (Regressione)

> **Input**: `listings_enriched` (strutturali + amenity cluster + feature derivate da recensioni), **escluse** `estimated_occupancy_l365d`, `estimated_revenue_l365d` e `peer_avg_price` (leakage).
> **Target**: `price` (float).
> **Split**: random 80/20, `random_state=42`.
> **Pipeline**: `[ColumnTransformer(OHE + StandardScaler) → Estimator]`.

#### 4.1.1 Setup metriche

Funzione helper riutilizzata in 4.1 e 4.2.

```python
def regression_metrics(name, model, X_test, y_test):
    y_pred = model.predict(X_test)
    ...
    return {"MAE": ..., "RMSE": ..., "R2": ...}
```

#### 4.1.2 Modello 1 — Ridge Regression (baseline)
- Pipeline: `[ColumnTransformer → Ridge]`
- `regression_metrics(...)`
- Plot: residui, predicted vs actual.

#### 4.1.3 Modello 2 — LASSO
- Stessa struttura, focus su feature selection implicita.
- Coefficienti non-zero → barplot (feature importance).

#### 4.1.4 Modello 3 — Kernel Ridge Regression
- Opzionale
- note

#### 4.1.5 Modello 4 — Random Forest Regressor
- Parametri di default. **Resta come baseline non-ottimizzato** (in §5 si ottimizza solo XGBoost).
- Feature importances → barplot.

#### 4.1.6 Modello 5 — XGBoost

```python
from xgboost import XGBRegressor
```

- Parametri di default come baseline. **Modello scelto per l'ottimizzazione in §5.**

#### 4.1.6 Confronto Price Prediction
- Tabella comparativa: Modello | MAE | RMSE | R² | Tempo fit.
- Barplot comparativo R².

#### 4.1.7 Ablation Study

Addestramento del **modello migliore** (XGBoost) in quattro configurazioni per quantificare il contributo marginale di ogni gruppo di feature NLP:

```python
feature_sets = {
    "structural_only":  structural_cols + amenity_cols,
    "+ sentiment":      structural_cols + amenity_cols + sentiment_cols,
    "+ topics":         structural_cols + amenity_cols + topic_cols,
    "+ all_review":     structural_cols + amenity_cols + all_review_cols,
}

results = {}
for name, cols in feature_sets.items():
    pipe = make_pipeline(ColumnTransformer(...), XGBRegressor(**best_params))
    scores = cross_val_score(pipe, X[cols], y, cv=5, scoring="neg_root_mean_squared_error")
    results[name] = -scores.mean()
```

**Output**: barplot dell'RMSE per feature set, che mostra il **contributo marginale di ogni gruppo NLP** alla predizione del prezzo.

---

### 4.2 Task B — Occupancy Regression

> **Input**: stesse feature di §4.1 **escludendo** `price`, `estimated_revenue_l365d`, `availability_*`, `number_of_reviews*` (data leakage diretto sul target). **Incluso** `peer_avg_price` (nessun leakage poiché il target è l'occupancy, non il prezzo).
> **Target**: `estimated_occupancy_l365d`.
> **Split**: random 80/20.
> **Pipeline**: identica a §4.1.

- **4.2.1** Modello 1 — Ridge (baseline)
- **4.2.2** Modello 2 — LASSO
- **4.2.3** Modello 3 — Random Forest *(baseline non-ottimizzato)*
- **4.2.4** Modello 4 — XGBoost *(scelto per ottimizzazione in §5)*

#### 4.2.5 Confronto Occupancy Regression
- Stessa tabella comparativa di §4.1.6.

#### 4.2.6 Confronto Cross-Task: Price vs Occupancy
- Quali feature sono importanti per entrambi? Quali divergono?
- Commento: R² di occupancy sarà probabilmente più basso — spiegare perché.

#### 4.2.7 Ablation Study

Stessa struttura di §4.1.7. L'ablation study per l'occupancy include `peer_avg_price` come esperimento aggiuntivo (nessun leakage poiché il target è l'occupancy, non il prezzo).

---

### 4.3 Task D — Review Intelligence Pipeline

> **Obiettivo**: estrarre ogni possibile segnale strutturato da `reviews.csv` e aggregarlo per `listing_id` per creare `nlp_features_df` (~26-33 nuove colonne per listing).
>
> A differenza del piano V1, non ci limitiamo al puro NLP. Utilizziamo qualsiasi tecnica che estragga segnale predittivo utile dalle recensioni: NLP, segnali collaborativi, analisi temporale, metadati.

#### 4.3.1 Preprocessing testo (condiviso)

```python
import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def clean_text(text):
    """Pulizia base del testo per operazioni NLP."""
    text = str(text).lower()
    text = re.sub(r'[^a-záàéèíìóòúùñü\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

reviews_df["comments_clean"] = reviews_df["comments"].apply(clean_text)
```

**Gestione lingua — MULTILINGUE** (scelta progettuale):
- Le recensioni restano nella lingua originale. Nessuno step di traduzione.
- VADER sarà rumoroso su italiano/altre lingue ma cattura comunque parole connotate e cues di punteggiatura (`!!!`, emoji, maiuscole).
- TF-IDF gestisce nativamente il testo multilingue — stopwords italiane e inglesi rimosse.
- Si evita la dipendenza da `deep-translator`/`googletrans` e il costo computazionale su 283 MB di testo.

```python
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

# Stopwords italiane minimali a supplemento
ITALIAN_STOPS = {"il", "lo", "la", "le", "gli", "un", "una", "di", "da", "in",
                 "con", "su", "per", "tra", "fra", "che", "non", "è", "sono",
                 "molto", "tutto", "questa", "questo", "anche", "più", "ma"}
COMBINED_STOPS = list(ENGLISH_STOP_WORDS | ITALIAN_STOPS)
```

#### 4.3.2 Sentiment Analysis (VADER)

Sentiment per-review, poi aggregato per listing:

```python
analyzer = SentimentIntensityAnalyzer()

# Singolo passaggio — estrai tutti gli score in una volta
scores = reviews_df["comments_clean"].apply(
    lambda x: analyzer.polarity_scores(x)
)
reviews_df["vader_compound"] = scores.apply(lambda s: s["compound"])
reviews_df["vader_neg"]      = scores.apply(lambda s: s["neg"])

sentiment_agg = reviews_df.groupby("listing_id").agg(
    sentiment_mean=("vader_compound", "mean"),
    sentiment_std=("vader_compound", "std"),
    sentiment_min=("vader_compound", "min"),
    pct_negative=("vader_compound", lambda x: (x < -0.05).mean()),
    pct_positive=("vader_compound", lambda x: (x > 0.05).mean()),
).fillna(0)
```

**Feature**: 5 colonne 🟢 CORE

| Feature | Intuizione | Tier |
|---------|------------|------|
| `sentiment_mean` | Soddisfazione complessiva dal testo | 🟢 Core |
| `sentiment_std` | Consistenza — alta std = listing polarizzante | 🟢 Core |
| `sentiment_min` | Peggior recensione — eventi "deal breaker" | 🟢 Core |
| `pct_negative` | Proporzione esperienze negative | 🟢 Core |
| `pct_positive` | Proporzione esperienze positive | 🟢 Core |

#### 4.3.3 Topic Modeling (NMF)

Scoperta di topic latenti nell'insieme delle recensioni, poi rappresentazione di ogni listing come distribuzione sui topic:

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF

# Concatena tutte le recensioni per listing in un unico documento
listing_docs = reviews_df.groupby("listing_id")["comments_clean"].apply(
    lambda texts: " ".join(texts)
)

tfidf = TfidfVectorizer(max_features=5000, stop_words=COMBINED_STOPS,
                         ngram_range=(1, 2), min_df=5)
tfidf_matrix = tfidf.fit_transform(listing_docs)

N_TOPICS = 5  # range 3-5, ottimizzabile in §5.3
nmf = NMF(n_components=N_TOPICS, random_state=42, max_iter=300)
topic_matrix = nmf.fit_transform(tfidf_matrix)

topic_df = pd.DataFrame(
    topic_matrix,
    columns=[f"topic_{i}" for i in range(N_TOPICS)],
    index=listing_docs.index
)
```

**Feature**: 5 colonne (`topic_0` ... `topic_4`) 🟢 CORE

Dopo il fitting, stampa le top-15 parole per topic per verificare l'interpretabilità:
```python
for i, component in enumerate(nmf.components_):
    top_words = [tfidf.get_feature_names_out()[j] for j in component.argsort()[-15:]]
    print(f"Topic {i}: {', '.join(top_words)}")
```

Con 5 topic, cluster attesi: *location/trasporti*, *pulizia/comfort*, *comunicazione host*, *valore/prezzo*, *esperienza complessiva*.

> Si aggiunge `dominant_topic` (argmax) come **feature categorica** — i modelli ad albero possono fare split su di essa. +1 colonna. 🟢 CORE

#### 4.3.4 Aspect Extraction (lessico di dominio)

Scoring per-review basato su keyword specifiche del dominio, aggregato per listing:

```python
ASPECTS = {
    "cleanliness":  ["clean", "dirty", "spotless", "tidy", "dust", "stain",
                     "hygienic", "smell", "mold", "filthy", "immaculate"],
    "location":     ["location", "central", "metro", "station", "walk",
                     "close", "far", "noisy", "quiet", "neighborhood",
                     "convenient", "transport", "bus", "tram"],
    "value":        ["value", "price", "expensive", "cheap", "worth",
                     "overpriced", "bargain", "money", "affordable"],
    "comfort":      ["comfortable", "cozy", "spacious", "cramped", "bed",
                     "mattress", "pillow", "sleep", "noise", "thin walls"],
    "host_quality": ["host", "responsive", "helpful", "kind", "welcoming",
                     "rude", "communication", "attentive", "friendly",
                     "flexible", "accommodating"],
    "accuracy":     ["accurate", "photos", "description", "misleading",
                     "exactly", "as described", "different", "expectation"],
}

for aspect, keywords in ASPECTS.items():
    kw_set = set(keywords)
    reviews_df[f"asp_{aspect}"] = reviews_df["comments_clean"].apply(
        lambda text: sum(1 for w in text.split() if w in kw_set)
    )

# Media (non somma) — la somma correlerebbe con il conteggio recensioni, già presente come feature
aspect_agg = reviews_df.groupby("listing_id")[
    [f"asp_{a}" for a in ASPECTS]
].mean().fillna(0)
```

**Feature**: 6 colonne (media per aspetto) 🟢 CORE

#### 4.3.5 Analisi Temporale

Come sta cambiando la ricezione del listing nel tempo?

```python
reviews_df["date"] = pd.to_datetime(reviews_df["date"])

def compute_temporal_features(group):
    group = group.sort_values("date")
    n = len(group)
    if n < 2:
        return pd.Series({
            "review_span_days": 0,
            "avg_days_between_reviews": 0,
            "sentiment_trend": 0,
            "days_since_last_review": 9999,
            "review_acceleration": 0,
        })

    span = (group["date"].max() - group["date"].min()).days
    intervals = group["date"].diff().dt.days.dropna()

    # Trend del sentiment: pendenza regressione lineare di vader_compound nel tempo
    if n >= 3:
        ordinal_dates = (group["date"] - group["date"].min()).dt.days.values
        slope = np.polyfit(ordinal_dates, group["vader_compound"].values, 1)[0]
    else:
        slope = 0

    # Accelerazione: le recensioni arrivano più velocemente di recente?
    if len(intervals) >= 4:
        recent = intervals.iloc[-len(intervals)//2:].mean()
        old = intervals.iloc[:len(intervals)//2].mean()
        accel = (old - recent) / (old + 1e-9)  # positivo = in accelerazione
    else:
        accel = 0

    last_review_date = group["date"].max()
    days_since = (pd.Timestamp("2025-09-22") - last_review_date).days

    return pd.Series({
        "review_span_days": span,
        "avg_days_between_reviews": intervals.mean(),
        "sentiment_trend": slope,
        "days_since_last_review": days_since,
        "review_acceleration": accel,
    })

temporal_df = reviews_df.groupby("listing_id").apply(compute_temporal_features)
```

**Feature**: 5 colonne 🟢 CORE

| Feature | Intuizione | Tier |
|---------|------------|------|
| `review_span_days` | Da quanto tempo è attivo il listing | 🟢 Core |
| `avg_days_between_reviews` | Proxy della frequenza di prenotazione | 🟢 Core |
| `sentiment_trend` | La qualità sta migliorando o degradando? | 🟢 Core |
| `days_since_last_review` | Recency — listing stagnanti possono avere pricing diverso | 🟢 Core |
| `review_acceleration` | Sta guadagnando o perdendo slancio? | 🟢 Core |

#### 4.3.6 Metadati Recensioni

Feature semplici ma sorprendentemente predittive dalla struttura delle recensioni:

```python
metadata_df = reviews_df.assign(
    review_length=lambda df: df["comments"].str.len(),
    review_word_count=lambda df: df["comments"].str.split().str.len(),
).groupby("listing_id").agg(
    avg_review_length=("review_length", "mean"),
    avg_word_count=("review_word_count", "mean"),
    std_review_length=("review_length", "std"),
    max_review_length=("review_length", "max"),
).fillna(0)
```

**Feature**: 4 colonne 🟢 CORE

**Intuizione**: recensioni più lunghe spesso correlano con esperienze più forti (positive o negative). Recensioni molto brevi ("ok", "nice") indicano basso engagement.

#### 4.3.7 Assemblaggio Feature e Merge

```python
# ── Feature CORE (sempre incluse) ──
nlp_features_df = (
    sentiment_agg                  # 5 colonne   🟢
    .join(topic_df)                # 5 colonne   🟢  (+ 1 dominant_topic)
    .join(aspect_agg)              # 6 colonne   🟢
    .join(temporal_df)             # 5 colonne   🟢
    .join(metadata_df)             # 4 colonne   🟢
    .fillna(0)
)
# CORE atteso: ~26 colonne

# ── Feature OPZIONALI (aggiungere se l'ablation mostra beneficio) ──
# nlp_features_df = nlp_features_df.join(reviewer_signal)   # +3 col  🟡
# nlp_features_df = nlp_features_df.join(popularity)        # +3 col  🟡
# Per Task B solamente:
# nlp_features_df = nlp_features_df.join(peer_price_df)     # +1 col  🟡

# Merge con listings
listings_enriched = listings_df.merge(
    nlp_features_df, left_on="id", right_index=True, how="left"
).fillna(0)
```

#### Feature Budget Summary

| Gruppo | Tecnica | # Feature | Tier |
|--------|---------|-----------|------|
| Sentiment | VADER (rule-based NLP) | 5 | 🟢 Core |
| Topic | NMF topic modeling | 5 (+1 categorica) | 🟢 Core |
| Aspetti | Lessico di dominio | 6 | 🟢 Core |
| Temporale | Analisi serie temporali | 5 | 🟢 Core |
| Metadati recensioni | Statistiche base testo | 4 | 🟢 Core |
| **Subtotale Core** | | **~26** | |
| Segnali reviewer | Analisi collaborativa | 3 | 🟡 Optional |
| Popolarità | Aggregazione | 3 | 🟡 Optional |
| Co-visitation | Cosine similarity | 1 (solo Task B) | 🟡 Optional |
| **Subtotale Optional** | | **~7** | |
| **Totale max** | | **~33** | |

> **Budget feature**: ~26 feature core da recensioni + 15 cluster amenity + ~15 strutturali = **~56 feature** nella configurazione core. L'ablation study in §4.1.7 / §4.2.7 determinerà se le feature opzionali meritano l'inclusione.


---

## 5. Ottimizzazione degli Iperparametri

### 5.1 Task A — Price Prediction

#### 5.1.1 Modello scelto: XGBoost
> **Motivazione**: XGBoost è notoriamente uno dei modelli con migliori performance baseline su problemi tabellari di regressione, e i suoi iperparametri principali (`max_depth`, `learning_rate`, `n_estimators`, `subsample`, `reg_alpha/lambda`) hanno un impatto sostanziale e ben documentato sulle metriche, giustificando il costo della search rispetto a modelli con search space meno informativo.

#### 5.1.2 Search Space

```python
param_grid = {
    "model__n_estimators": [100, 300, 500],
    "model__max_depth": [3, 5, 7],
    "model__learning_rate": [0.01, 0.1, 0.3],
    "model__subsample": [0.8, 1.0],
}
```

#### 5.1.3 RandomizedSearchCV
- `cv=5`, `scoring="neg_root_mean_squared_error"`.
- Estrarre `best_params_`, `best_score_`.

#### 5.1.4 Nested Cross-Validation

```python
outer_cv = KFold(n_splits=5)
inner_cv = KFold(n_splits=3)
# cross_val_score con GridSearchCV come estimator interno
```

#### 5.1.5 Risultati: XGBoost ottimizzato vs baseline
- Tabella delta metriche: ΔMAE, ΔRMSE, ΔR².

---

### 5.2 Task B — Occupancy Regression
- Modello scelto: **XGBoost** (stessa motivazione di §5.1.1).
- Stesso schema di §5.1 — riusa la funzione di search.
- Confronto best model occupancy vs best model price (gli iperparametri ottimali divergono?).

---

### 5.3 Task D — NMF Topic Modeling

#### 5.3.1 Ottimizzazione NMF (wrapper-based feature selection)

Ottimizzazione degli iperparametri del topic modeling NMF per massimizzare l'R² downstream sui task di regressione:

```python
from sklearn.model_selection import ParameterGrid

param_grid = {
    "n_topics": [3, 4, 5],           # range ristretto per stabilità
    "max_features": [3000, 5000],
    "ngram_range": [(1, 1), (1, 2)],
}

# Per ogni combinazione: fit NMF, ricostruisci feature, addestra XGBoost su Task A,
# misura R² su held-out set. Scegli la config NMF che massimizza l'R² downstream.
best_r2 = -np.inf
for params in ParameterGrid(param_grid):
    tfidf = TfidfVectorizer(max_features=params["max_features"],
                            stop_words=COMBINED_STOPS,
                            ngram_range=params["ngram_range"])
    nmf = NMF(n_components=params["n_topics"], random_state=42)
    # ... ricostruisci feature, addestra, valuta
    if r2 > best_r2:
        best_r2 = r2
        best_nmf_params = params
```

> Si tratta di una forma di **wrapper-based feature selection** — ottimizzazione dello stadio di estrazione feature per massimizzare le performance del modello downstream.

---

## 6. Conclusioni

### 6.1 Tabella Riassuntiva Finale

| Task | Modello migliore | Metrica | Baseline | + Reviews | Δ |
|------|-----------------|---------|----------|-----------|---|
| Price Prediction | XGBoost ottimizzato | RMSE | X.XX | X.XX | -X.XX |
| Price Prediction | XGBoost ottimizzato | R² | X.XX | X.XX | +X.XX |
| Occupancy Regression | XGBoost ottimizzato | RMSE | X.XX | X.XX | -X.XX |
| Occupancy Regression | XGBoost ottimizzato | R² | X.XX | X.XX | +X.XX |

### 6.2 Cross-Task Insights
- Quale **gruppo di feature NLP** ha avuto il maggiore impatto marginale? (ablation study)
- Quali **feature NLP** compaiono nella top-20 feature importances di XGBoost?
- Il `sentiment_trend` (miglioramento vs degradazione) influenza price e occupancy in modo diverso?
- I cluster di amenity si comportano come atteso? (es. `has_luxury` → prezzo più alto)

### 6.3 Limiti e Sviluppi Futuri
- `calendar.csv` corrotto → impossibile analisi temporale fine dei prezzi.
- VADER su testo multilingue è rumoroso → futuro: transformer multilingue (XLM-R).
- Topic modeling bag-of-words → futuro: BERTopic per topic contestuali.
- `peer_avg_price` è una feature potente ma ha problemi di cold-start per listing senza recensioni.
- Possibile estensione: previsione serie temporali dell'occupancy con `calendar.csv` (se disponibile).
