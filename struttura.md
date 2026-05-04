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
# eventuali librerie extra: xgboost, lightgbm, imbalanced-learn...
```

### 0.3 Caricamento Dataset

```python
# pd.read_csv() / API / download automatico
# df.head(), df.shape, df.info(memory_usage="deep")
```

---

## 1. Descrizione del Contesto

### 1.1 Obiettivo
- Cosa si vuole predire e perché è utile.
- Tipo di task: classificazione / regressione / recommendation.

### 1.2 Fonte e Struttura del Dataset
- Link alla fonte, data di raccolta, modalità di acquisizione.
- Numero di istanze e variabili.

### 1.3 Descrizione delle Variabili
- Tabella o lista con: nome, tipo (numerico/categorico), significato, unità di misura.
- Identificazione preliminare della variabile target.

### 1.4 Prima Scrematura

```python
# df.isnull().sum() — drop colonne con troppi null
# Drop identificatori e colonne non informative (es. ID, timestamp grezzi)
# df.duplicated().sum() — drop duplicati
```

---

## 2. Analisi Esplorativa dei Dati (EDA)

### 2.1 Statistiche Generali

```python
# df.describe() — media, std, min/max, quartili
# value_counts() su variabili categoriche
# Matrice di correlazione (numerico): df.corr()
```

### 2.2 Distribuzione della Variabile Target
- Grafico a torta / barplot
- **[CLASSIFICAZIONE]** Verifica sbilanciamento classi
- **[REGRESSIONE]** Istogramma distribuzione target

### 2.3 Distribuzione delle Feature
- Istogrammi per feature numeriche (subplot grid)
- Barplot per feature categoriche (top-N categorie)
- Boxplot per evidenziare outlier

### 2.4 Relazioni Feature–Target
- Scatter plot / scatter matrix
- Boxplot per classe (classificazione)
- `groupby` + barplot (es. media target per categoria)
- Heatmap correlazione

### 2.5 Commento dei Risultati EDA
- Osservazioni chiave: distribuzioni, outlier, correlazioni notevoli
- Feature che sembrano più promettenti
- Eventuali anomalie da gestire nella preparazione

---

## 3. Preparazione dei Dati

> Questa sezione contiene la pipeline **base** condivisa. Lo split, l'encoding finale e lo scaling vanno applicati **per-task** in §4 perché ciascun task ha un proprio target (e talvolta un proprio set di feature).

### 3.1 Feature Engineering (opzionale ma consigliato)
- Estrazione di nuove variabili (es. ora/giorno da timestamp, NLP su testo)
- Combinazione di feature esistenti

### 3.2 Selezione Feature e Target

```python
X = df.drop(columns=["target"])
y = df["target"]
```

### 3.3 Gestione Valori Nulli
- Strategia per colonna: imputation (media/mediana/moda) oppure drop righe.

### 3.4 Encoding Variabili Categoriche
- `pd.get_dummies()` / `OneHotEncoder`
- Attenzione al *dummy trap* se si usa regressione lineare con intercetta.

### 3.5 Train / Test Split

```python
# Regressione (4.1, 4.2):
train_test_split(X, y, test_size=0.2, random_state=42)

# Classificazione (4.3):
train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
```

- Verifica proporzioni classi in train e test (solo classificazione).

### 3.6 Bilanciamento Classi *[applicabile solo al task §4.3 NLP]*

Se sbilanciamento rilevante:
- Oversampling: `SMOTE`
- Undersampling: `RandomUnderSampler`
- Oppure `class_weight="balanced"` direttamente nei modelli.

### 3.7 Scaling *[se necessario]*
- `StandardScaler` / `MinMaxScaler` (fit su train, transform su test).

---

## 4. Addestramento e Valutazione dei Modelli

### 4.1 Task A — Price Prediction (Regressione)

#### 4.1.1 Setup comune ai task di regressione

Funzione helper per calcolare le metriche (MAE, RMSE, R²) — definita **una volta**, riutilizzata in 4.1 e 4.2 per non duplicare codice.

```python
def regression_metrics(name, model, X_test, y_test):
    y_pred = model.predict(X_test)
    ...
    return {"MAE": ..., "RMSE": ..., "R2": ...}
```

#### 4.1.2 Modello 1 — Ridge Regression (baseline)
- Pipeline: `[StandardScaler → Ridge]`
- Fit su `X_train_price`, `y_train_price`
- `regression_metrics(...)`
- Plot: residui, predicted vs actual

#### 4.1.3 Modello 2 — LASSO
- Stessa struttura, focus su feature selection implicita.
- Coefficienti non-zero → barplot (feature importance).

#### 4.1.4 Modello 3 — Random Forest Regressor
- `n_estimators` fisso per ora.
- Feature importances → barplot.

#### 4.1.5 Modello 4 — XGBoost (oppure LightGBM)

```python
from xgboost import XGBRegressor
```

- Parametri di default come baseline.

#### 4.1.6 Confronto Price Prediction
- Tabella comparativa: Modello | MAE | RMSE | R² | Tempo fit
- Barplot comparativo R²

---

### 4.2 Task B — Occupancy Regression

> NOTA: stessa batteria di modelli di §4.1 → enfatizza il confronto cross-task alla fine.

- **4.2.1** Modello 1 — Ridge (baseline)
- **4.2.2** Modello 2 — LASSO
- **4.2.3** Modello 3 — Random Forest
- **4.2.4** Modello 4 — XGBoost (oppure LightGBM)

#### 4.2.5 Confronto Occupancy Regression
- Stessa tabella comparativa di §4.1.6.

#### 4.2.6 Confronto Cross-Task: Price vs Occupancy
- Quali feature sono importanti per entrambi? Quali divergono?
- Commento: R² di occupancy sarà probabilmente più basso — spiegare perché.

---

### 4.3 Task C — NLP Classification (Sentiment / Topic)

#### 4.3.1 Preprocessing testo
- Aggregazione recensioni per listing.
- TF-IDF vectorization (`TfidfVectorizer`).
- `X` = matrice TF-IDF, `y` = label (sentimento / categoria dominante).

#### 4.3.2 Modello 1 — Naive Bayes (`MultinomialNB`)
Baseline NLP.

#### 4.3.3 Modello 2 — Logistic Regression su TF-IDF

#### 4.3.4 Modello 3 — SVM (`LinearSVC`)

> *[opzionale]* Modello 4 — LDA / NMF topic modeling (unsupervised).

#### 4.3.5 Metriche classificazione
- Accuracy, F1-macro, Confusion Matrix.
- Se classi sbilanciate → Precision-Recall curve.

#### 4.3.6 Connessione con i task di regressione
- Aggiungi la colonna `category` / `sentiment_score` come nuova feature.
- Ri-addestra un modello di Price Prediction con questa feature aggiuntiva.
- Confronto R²: prima vs dopo — il NLP ha migliorato la regressione?

---

### 4.4 Task D — Recommendation System

#### 4.4.1 Costruzione matrice utente-listing
- `reviewer_id × listing_id` con rating (score recensione).
- Analisi sparsità della matrice.

#### 4.4.2 Approccio 1 — Content-Based Filtering
- Vettore listing: feature strutturali + TF-IDF NLP + zona.
- Similarità coseno tra listing.
- Dato un utente → media dei vettori dei listing recensiti positivamente.
- Top-N listing più simili non ancora visitati.

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
- Tabella: Approccio | RMSE | MAE (surprise metrics).
- Esempio qualitativo: per un utente campione, mostra top-5 raccomandazioni.

---

## 5. Ottimizzazione degli Iperparametri

### 5.1 Task A — Price Prediction

#### 5.1.1 Modello scelto per ottimizzazione: XGBoost
> Motivazione: scegliere il modello con le migliori performance baseline in §4.1.6 *e* il maggior numero di iperparametri impattanti.

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

#### 5.1.4 *[Facoltativo]* Nested Cross-Validation

```python
outer_cv = KFold(n_splits=5)
inner_cv = KFold(n_splits=3)
# cross_val_score con GridSearchCV come estimator interno
```

#### 5.1.5 Risultati: XGBoost ottimizzato vs baseline
- Tabella delta metriche: ΔMAE, ΔRMSE, ΔR².

---

### 5.2 Task B — Occupancy Regression
- Stesso schema di §5.1 — riusa la funzione di search.
- Modello scelto: *[stesso o diverso, motivare]*.
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
| Occupancy Regression  | …                      | R²                 | X.XX   |
| NLP Classification    | …                      | F1                 | X.XX   |
| Recommendation        | SVD ottimizzato        | RMSE               | X.XX   |

### 6.2 Cross-Task Insights
- Come il NLP ha migliorato la regressione?
- Feature più importanti in comune tra price e occupancy?

### 6.3 Limiti e Sviluppi Futuri
- Dataset limitato / bias nella raccolta dati.
- Feature aggiuntive che potrebbero migliorare il modello.
- Possibili approcci alternativi (deep learning, ensemble, ecc.).