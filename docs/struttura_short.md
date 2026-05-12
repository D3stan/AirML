# Struttura minimale

## 0. Setup
- Import librerie
- Caricamento dataset

## 1. Descrizione del Contesto
- Obiettivo del modello
- Fonte e struttura del dataset
- Descrizione delle variabili
- Prima scrematura (drop colonne non informative / troppi null)

## 2. EDA – Analisi Esplorativa
- `df.describe()`, value counts, correlazioni
- Grafici: torta (target), istogrammi, boxplot, scatter/heatmap
- Commento risultati
- Eventuale drop di outlier/dati non utilizzabili

## 3. Preparazione dei Dati
- Selezione target + feature predittive
- Gestione valori nulli
- One-hot encoding variabili categoriche
- Train/test split (+ eventuale over/under-sampling)

## 4. Addestramento e Valutazione Modelli
- Modello 1: [es. Logistic Regression / Linear Regression]
- Modello 2: [es. Decision Tree / Ridge]
- Metriche: accuracy/F1/precision/recall (classificazione) oppure MSE/R²/errore relativo (regressione)
- Analisi modello: coefficienti o nodi iniziali albero
- Feature importance

## 5. Ottimizzazione Iperparametri
- GridSearchCV / RandomizedSearchCV su modello scelto
- Cross-validation
- Confronto best model vs baseline

## 6. Conclusioni
- Modello migliore e motivazione
- Limiti e possibili sviluppi