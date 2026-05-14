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
# eventuali librerie extra: xgboost, imbalanced-learn, surprise, langdetect...
```

### 0.3 Caricamento Dataset

```python
COLS_TO_DROP = {
    "listing_url", "scrape_id", "host_url", "picture_url",
    "host_thumbnail_url", "host_picture_url",
    # aggiungi qui le altre URL/identificatori
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
Quattro task predittivi sui dati Airbnb (Milano, scrape 2025-09-22):
- **Task A — Regressione**: predire il `price` di un alloggio.
- **Task B — Regressione**: predire l'occupancy stimata annua (`estimated_occupancy_l365d`).
- **Task C — Classificazione (NLP)**: classificare il sentiment delle recensioni.
- **Task D — Recommendation**: suggerire alloggi a un utente.

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
- **Target**: `price` (Task A), `estimated_occupancy_l365d` (Task B); per Task C/D vedi §4.3 e §4.4.

### 1.4 Prima Scrematura

```python
# Drop URL/immagini (vedi 1.3)
# Drop righe duplicate
# Drop righe con valori nulli di:
#   - price
#   - oppure con piu del 70% di valori nulli
#   - accommodates
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
- **Sentiment label (4.3)**: barplot del `review_scores_rating`.

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

> Questa sezione contiene la **pulizia condivisa** applicata a `listings.csv` (e join con `reviews.csv` per i task NLP/recommendation). **Split, encoding e scaling sono per-task** e vivono dentro le rispettive sezioni di §4 — vedi la tabella in §3.3.

### 3.1 Feature Engineering
- Parsing tipi: `price` "$180.00" → int.
- Da `property_type` → enum (stessa cosa per altri `_type`?)
- Da `host_since` → `host_tenure_days` (giorni di esperienza host).
- Da `last_review` / `first_review` → `review_span_days`, `days_since_last_review`.
- Da `bathrooms_text` → `is_shared_bath` (booleano).
- Da `amenities` (lista) → `n_amenities`, flag binari per amenities top-N (`wifi`, `kitchen`, `washer`, ...).
- Opzionale: Da `latitude`/`longitude` → distanza dal centro città (Duomo).

### 3.2 Gestione Valori Nulli
- Imputation per colonna: mediana per numeriche, moda per categoriche, sentinel `"Unknown"` per testuali.
- Drop righe con target nullo (per il task corrispondente).

### 3.3 Pipeline per-task — vista d'insieme

| Task | Sorgente                          | Target                          | Encoding                | Scaling      | Split                          |
|------|-----------------------------------|---------------------------------|-------------------------|--------------|--------------------------------|
| 4.1  | `listings.csv`                    | `price`                         | OHE su categoriche      | StandardScaler | random 80/20                  |
| 4.2  | `listings.csv`                    | `estimated_occupancy_l365d`     | OHE su categoriche      | StandardScaler | random 80/20                  |
| 4.3  | `reviews.csv` ⨝ `listings.csv`    | sentiment label (da `review_scores_rating`) | TF-IDF su `comments` | —          | **stratified** 80/20           |
| 4.4  | `reviews.csv` × `listings.csv`    | rating derivato (vedi §4.4.1)   | —                       | —            | `surprise.model_selection`     |

> Concettualmente: §3.1 e §3.2 girano una volta sola sul dataframe pulito; poi ogni task in §4 si costruisce il proprio `(X, y)`, applica lo split appropriato e il preprocessing (encoding/scaling/vectorization) **dentro una `Pipeline` sklearn** per evitare leakage.

### 3.4 Traduzione testi
- in una sola lingua (italiano o inglese)
- oppure mantenere multilingua e lasciare che il modello NLP impari da tutte (con eventuale indicatore di lingua come feature)

---

## 4. Addestramento e Valutazione dei Modelli

### 4.1 Task A — Price Prediction (Regressione)

> **Input**: feature numeriche + categoriche di `listings.csv`, **escluse** `estimated_occupancy_l365d`, `estimated_revenue_l365d` (leakage indiretto).
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

---

### 4.2 Task B — Occupancy Regression

> **Input**: stesse feature di §4.1 **escludendo** `price`, `estimated_revenue_l365d`, `availability_*`, `number_of_reviews*` (data leakage diretto sul target).
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

---

### 4.3 Task C — NLP Classification (Sentiment)

> **Input**: campo `comments` di `reviews.csv`.
> **Target**: label di sentiment derivata dal `review_scores_rating` del listing associato (join `reviews.listing_id` ⨝ `listings.id`):
>  - `≥ 4.6` → **positivo**
>  - `3.5 – 4.6` → **neutro**
>  - `< 3.5` → **negativo**
>
> **Split**: 80/20 **stratificato** sulla label.
> **Pipeline**: `[TfidfVectorizer → Classifier]`.

#### 4.3.1 Preprocessing testo
- Join `reviews.csv` ⨝ `listings.csv[["id", "review_scores_rating"]]` su `listing_id`.
- Eventuale filtro lingua (`langdetect`) — i commenti sono multilingua.
- Lowercase, rimozione punteggiatura, stopwords (italiano + inglese).
- TF-IDF: `max_features ≈ 10k`, `ngram_range=(1, 2)`.

#### 4.3.2 Modello 1 — Naive Bayes (`MultinomialNB`)
Baseline NLP.

#### 4.3.3 Modello 2 — Logistic Regression su TF-IDF

#### 4.3.4 Modello 3 — SVM (`LinearSVC`)

> *[opzionale]* Modello 4 — LDA / NMF topic modeling (unsupervised).

#### 4.3.5 Bilanciamento classi *(specifico di questo task)*
La label di sentiment è quasi certamente sbilanciata (i rating Airbnb si concentrano ≥4.5). Strategie:
- `class_weight="balanced"` su `LogisticRegression` / `LinearSVC`.
- Eventualmente `SMOTE` su rappresentazione TF-IDF (attenzione al costo memoria su matrici sparse).

#### 4.3.6 Metriche classificazione
- Accuracy, **F1-macro** (più robusto su classi sbilanciate), Confusion Matrix.
- Precision-Recall curve per classe minoritaria.

#### 4.3.7 Connessione con i task di regressione
- Aggrega per `listing_id` la `sentiment_score` predetta (% recensioni positive).
- Aggiungi `sentiment_score` come feature in §4.1 / §4.2 e ri-addestra.
- Confronto R²: prima vs dopo — il NLP ha migliorato la regressione?

---

### 4.4 Task D — Recommendation System

#### 4.4.1 Costruzione matrice utente-listing
`reviews.csv` **non contiene un rating numerico esplicito**. Tre alternative per derivarlo:
- **Opzione A**: usa lo `sentiment_score` predetto dal modello §4.3 sul singolo `comments` come rating 1-5.
- **Opzione B (preferita)**: usa `review_scores_rating` del listing come rating uniforme per ogni reviewer di quel listing (rumoroso ma immediato).
- **Opzione C**: rating implicito 0/1 (presenza di recensione) → solo Content-Based.

Risultato: matrice `reviewer_id × listing_id` con il rating derivato. Analisi sparsità.

#### 4.4.2 Approccio 1 — Content-Based Filtering
- Vettore listing: feature strutturali OHE + TF-IDF della `description` + zona.
- Similarità coseno tra listing.
- Per un utente → media dei vettori dei listing recensiti positivamente → top-N più simili non ancora visitati.

#### 4.4.3 Approccio 2 — Collaborative Filtering (User-Based / Item-Based)

```python
from surprise import KNNBasic, KNNWithMeans
```

- Train/test split con `surprise.model_selection`.
- Metrica: RMSE sul rating predetto.

#### 4.4.4 Approccio 3 — SVD (Matrix Factorization)

```python
from surprise import SVD
```

- Confronto con KNN-based.

#### 4.4.5 Confronto Recommendation
- Tabella: Approccio | RMSE | MAE.
- Esempio qualitativo: per un utente campione, mostra top-5 raccomandazioni.

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

### 5.3 Task C — NLP Classification

#### 5.3.1 Ottimizzazione TF-IDF + Classificatore (Pipeline)

```python
param_grid = {
    "tfidf__max_features": [5000, 10000, 20000],
    "tfidf__ngram_range": [(1, 1), (1, 2)],
    "clf__C": [0.1, 1, 10],            # per LogReg / SVM
}
# GridSearchCV su Pipeline([TfidfVectorizer, LinearSVC])
```

---

### 5.4 Task D — Recommendation (SVD)

#### 5.4.1 GridSearch con `surprise`

```python
from surprise.model_selection import GridSearchCV as SurpriseGridSearch

param_grid = {
    "n_factors": [50, 100],
    "lr_all": [0.002, 0.005],
    "reg_all": [0.02, 0.1],
}
# Metrica ottimizzata: RMSE
```

#### 5.4.2 Best SVD vs baseline KNN
- Tabella comparativa finale.

---

## 6. Conclusioni

### 6.1 Tabella Riassuntiva Finale (tutti i task)

| Task                  | Modello migliore       | Metrica principale | Valore |
|-----------------------|------------------------|--------------------|--------|
| Price Prediction      | XGBoost ottimizzato    | RMSE               | X.XX   |
| Occupancy Regression  | XGBoost ottimizzato    | R²                 | X.XX   |
| NLP Classification    | …                      | F1-macro           | X.XX   |
| Recommendation        | SVD ottimizzato        | RMSE               | X.XX   |

### 6.2 Cross-Task Insights
- Come il `sentiment_score` da §4.3 ha migliorato la regressione?
- Feature più importanti in comune tra price e occupancy?
- Il rating derivato in §4.4 (Opzione A vs B) cambia significativamente l'output del recommender?

### 6.3 Limiti e Sviluppi Futuri
- `calendar.csv` corrotto → impossibile analisi temporale fine dei prezzi.
- `reviews.csv` senza rating numerico → ratings derivati introducono rumore.
- Possibili approcci alternativi: deep learning (BERT per NLP), LightGBM, ensemble stacking.
