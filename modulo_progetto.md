# Architettura Modulare del Progetto AirML

> **Obiettivo:** permettere a 4 studenti di lavorare in parallelo su task indipendenti, con la garanzia che se uno studente abbandona il progetto i rimanenti 3 possano consegnare semplicemente escludendo il modulo mancante.

---

## 1. Filosofia: Shared Contract, Independent Modules

Il progetto si articola in **4 moduli indipendenti** (Task A, B, C, D) costruiti sopra un **unico strato condiviso** di preparazione dati.

- **Nessun modulo dipende da un altro modulo per funzionare.**
- Le integrazioni cross-task (es. sentiment score nelle regressioni) sono **opzionali e dinamiche**: se il file di output di un modulo non esiste, il modulo consumatore procede senza quella feature.
- Ogni modulo e' autocontenuto: ha il proprio split, la propria pipeline sklearn, le proprie metriche, il proprio export.

---

## 2. Strato Condiviso: `shared_prep.ipynb`

### 2.1 Responsabilita'
Questo notebook e' l'**unico punto di contatto con i dati grezzi**. Tutti gli studenti lo eseguono una volta sola all'inizio.

### 2.2 Input
- `listings.csv`
- `reviews.csv`
- `calendar.csv` *(escluso come da struttura.md)*

### 2.3 Output (data contract)
| File | Schema chiave | Righe | Note |
|------|--------------|-------|------|
| `listings_clean.parquet` | tutte le colonne pulite dello §1–§3.2 | ~N | tipi corretti, null imputati, URL/ID rimossi |
| `reviews_clean.parquet` | `listing_id, id, date, reviewer_id, comments` | ~M | `comments` lowercased, lingua opzionale |

### 2.4 Regole del contratto
1. **Schema frozen:** nessuno studente puo' aggiungere/rimuovere colonne da questi file. Se serve una feature nuova, la si calcola **dentro il proprio modulo**.
2. **Indici stabili:** `listings_clean` ha indice ordinato; `reviews_clean` ha indice ordinato.
3. **Random state fisso:** tutti gli split successivi partono dal medesimo `random_state=42` per coerenza nelle conclusioni.

---

## 3. Moduli Indipendenti

### 3.1 Task A — Price Prediction (`task_a_price.ipynb`)

**Proprietario:** Studente 1  
**Scope:** Regressione del prezzo di un alloggio.

| Aspetto | Dettaglio |
|---------|-----------|
| **Input** | `listings_clean.parquet` |
| **Target** | `price` (float) |
| **Leakage guard** | Esclude: `estimated_occupancy_l365d`, `estimated_revenue_l365d` |
| **Pipeline** | `ColumnTransformer(OHE + StandardScaler) -> Estimator` |
| **Split** | `train_test_split(..., test_size=0.2, random_state=42)` |
| **Modelli** | Ridge (baseline), LASSO, Random Forest, XGBoost |
| **Ottimizzazione** | RandomizedSearchCV + Nested CV su XGBoost (§5.1) |
| **Output** | `models/price_model.pkl`, `metrics/price_metrics.json` |

**Bridge opzionale (BONUS):** se esiste `outputs/comment_sentiments.csv`, merge su `listing_id` e aggiungi `sentiment_score` come feature. Altrimenti procedi senza.

---

### 3.2 Task B — Occupancy Regression (`task_b_occupancy.ipynb`)

**Proprietario:** Studente 2  
**Scope:** Regressione dell'occupazione stimata annua.

| Aspetto | Dettaglio |
|---------|-----------|
| **Input** | `listings_clean.parquet` |
| **Target** | `estimated_occupancy_l365d` |
| **Leakage guard** | Esclude: `price`, `estimated_revenue_l365d`, `availability_*`, `number_of_reviews*` |
| **Pipeline** | Identica a Task A |
| **Split** | `train_test_split(..., test_size=0.2, random_state=42)` |
| **Modelli** | Ridge (baseline), LASSO, Random Forest, XGBoost |
| **Ottimizzazione** | RandomizedSearchCV + Nested CV su XGBoost (§5.2) |
| **Output** | `models/occupancy_model.pkl`, `metrics/occupancy_metrics.json` |

**Bridge opzionale (BONUS):** stesso meccanismo di Task A per `sentiment_score`.

---

### 3.3 Task C — NLP Sentiment Classification (`task_c_sentiment.ipynb`)

**Proprietario:** Studente 3  
**Scope:** Classificazione del sentiment delle recensioni.

| Aspetto | Dettaglio |
|---------|-----------|
| **Input** | `reviews_clean.parquet` + `listings_clean[["id", "review_scores_rating"]]` |
| **Target** | Label derivata: `>=4.6` positivo, `3.5–4.6` neutro, `<3.5` negativo |
| **Preprocessing** | Lowercase, rimozione punteggiatura, stopwords (it+en), TF-IDF |
| **Pipeline** | `TfidfVectorizer -> Classifier` |
| **Split** | Stratificato 80/20 (`StratifiedShuffleSplit`, `random_state=42`) |
| **Modelli** | MultinomialNB, LogisticRegression, LinearSVC |
| **Ottimizzazione** | GridSearchCV su TF-IDF params + `C` (§5.3) |
| **Output** | `models/sentiment_model.pkl`, `outputs/comment_sentiments.csv` |

**Note:**
- Il bilanciamento classi usa `class_weight="balanced"`.
- `comment_sentiments.csv` contiene: `listing_id, comment_id, predicted_sentiment, sentiment_score`.

---

### 3.4 Task D — Recommendation System (`task_d_recommendation.ipynb`)

**Proprietario:** Studente 4  
**Scope:** Sistema di raccomandazione di alloggi.

| Aspetto | Dettaglio |
|---------|-----------|
| **Input** | `reviews_clean.parquet` + `listings_clean.parquet` |
| **Rating derivato** | Opzione B (preferita): `review_scores_rating` del listing per ogni reviewer |
| **Approcci** | Content-Based (cosine sim), KNN Collaborative, SVD Matrix Factorization |
| **Split** | `surprise.model_selection` train/test |
| **Metriche** | RMSE, MAE |
| **Ottimizzazione** | GridSearch su SVD (`n_factors`, `lr_all`, `reg_all`) (§5.4) |
| **Output** | `models/recommender_svd.pkl`, `metrics/rec_metrics.json`, `outputs/sample_recommendations.json` |

**Bridge opzionale (BONUS):** se esiste `outputs/comment_sentiments.csv`, Opzione A (sentiment-as-rating) e' disponibile per confronto. Altrimenti usa Opzione B senza problemi.

---

## 4. Integrazioni Cross-Task (Opzionali)

### 4.1 Pattern di integrazione

Ogni bridge segue questo pattern Python:

```python
import os

BRIDGE_SENTIMENT = os.path.exists("outputs/comment_sentiments.csv")

if BRIDGE_SENTIMENT:
    sentiment = pd.read_csv("outputs/comment_sentiments.csv")
    # aggrega per listing_id
    sentiment_agg = sentiment.groupby("listing_id")["sentiment_score"].mean().reset_index()
    df = df.merge(sentiment_agg, on="listing_id", how="left")
    df["sentiment_score"] = df["sentiment_score"].fillna(0.5)
    print("[BRIDGE] Sentiment score integrato.")
else:
    print("[BRIDGE] Sentiment score non disponibile, procedo senza.")
```

### 4.2 Tabella delle integrazioni

| Da | A | File ponte | Fallback se assente |
|----|---|------------|---------------------|
| Task C | Task A | `outputs/comment_sentiments.csv` | Nessuna feature aggiuntiva |
| Task C | Task B | `outputs/comment_sentiments.csv` | Nessuna feature aggiuntiva |
| Task C | Task D | `outputs/comment_sentiments.csv` | Usa Opzione B (`review_scores_rating`) |

---

## 5. Scenari di Dropout

### 5.1 Studente 3 (NLP) abbandona
- **Task A e B:** funzionano perfettamente. Il codice di bridge salta l'aggiunta di `sentiment_score`.
- **Task D:** funziona perfettamente. Il rating derivato usa `review_scores_rating` (Opzione B).
- **Cosa cambia nelle conclusioni:** nel §6.2 si scrive "*Sentiment score non disponibile per mancanza di risorse NLP*".

### 5.2 Studente 1 (Price) abbandona
- **Task B, C, D:** nessuna dipendenza diretta. Procedono normalmente.
- **Cosa cambia:** nel §6.1 la riga "Price Prediction" risulta vuota o con "N/D".

### 5.3 Studente 4 (Recommendation) abbandona
- **Task A, B, C:** nessuna dipendenza diretta. Procedono normalmente.
- **Cosa cambia:** nel §6.1 la riga "Recommendation" risulta vuota.

### 5.4 Studente 2 (Occupancy) abbandona
- Analogo allo 5.2.

---

## 6. Assembly Finale (`main.ipynb`)

Il notebook di consegna assembla i pezzi. Struttura:

```
main.ipynb
  ├── %run shared_prep.ipynb
  ├── %run task_a_price.ipynb      # opzionale
  ├── %run task_b_occupancy.ipynb  # opzionale
  ├── %run task_c_sentiment.ipynb  # opzionale
  ├── %run task_d_recommendation.ipynb  # opzionale
  └── Conclusioni (tabella §6.1 aggregata dai metrics/*.json)
```

### 6.1 Regole di merge
1. Ogni `task_*.ipynb` esporta le proprie metriche in JSON.
2. `main.ipynb` legge i JSON esistenti e costruisce la tabella finale dinamicamente.
3. Se un file JSON manca, la cella corrispondente mostra "Modulo non consegnato".

---

## 7. Convenzioni di Codice

### 7.1 Struttura di ogni modulo
Ogni `task_*.ipynb` DEVE contenere queste sezioni in ordine:

1. **Header** — Titolo, autore, descrizione
2. **Setup** — Import locali (niente reload di `listings.csv`!)
3. **Load Shared Data** — `pd.read_parquet("listings_clean.parquet")`
4. **Task-Specific Prep** — Feature engineering locale, split
5. **Modeling** — Pipeline, training, valutazione
6. **Hyperparameter Optimization** — Grid/Randomized search
7. **Export** — Salva modello e metriche
8. **Bridge Check** — Carica output di altri moduli se disponibili (opzionale)

### 7.2 Paths
```
.
├── data/
│   ├── listings.csv
│   ├── reviews.csv
│   └── calendar.csv
├── outputs/
│   ├── listings_clean.parquet
│   ├── reviews_clean.parquet
│   └── comment_sentiments.csv     # da Task C
├── models/
│   ├── price_model.pkl
│   ├── occupancy_model.pkl
│   ├── sentiment_model.pkl
│   └── recommender_svd.pkl
├── metrics/
│   ├── price_metrics.json
│   ├── occupancy_metrics.json
│   ├── sentiment_metrics.json
│   └── rec_metrics.json
├── shared_prep.ipynb
├── task_a_price.ipynb
├── task_b_occupancy.ipynb
├── task_c_sentiment.ipynb
├── task_d_recommendation.ipynb
└── main.ipynb
```

### 7.3 Random State
Tutti gli split usano `random_state=42` per garantire che le metriche siano confrontabili.

---

## 8. Timeline Suggerita (4 settimane)

| Settimana | Milestone | Chi |
|-----------|-----------|-----|
| 1 | Contratto dati, `shared_prep.ipynb` completo | Tutti |
| 2 | Modelli baseline (Ridge/NB/KNN) funzionanti | Ogni studente sul proprio task |
| 3 | Ottimizzazione iperparametri + bridge opzionali | Ogni studente sul proprio task |
| 4 | Merge in `main.ipynb`, conclusioni, revisione | Tutti |

---

## 9. Checklist Pre-Consegna

- [ ] `shared_prep.ipynb` esegue senza errori e genera i due `.parquet`
- [ ] Ogni `task_*.ipynb` esegue in isolamento (senza dipendere da altri task)
- [ ] Ogni modulo esporta il proprio JSON metriche
- [ ] `main.ipynb` assembla la tabella §6.1 correttamente
- [ ] Test di dropout: rinominare `comment_sentiments.csv`, verificare che Task A/B/D ancora girino
