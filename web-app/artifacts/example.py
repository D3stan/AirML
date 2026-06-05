import pandas as pd
import joblib
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import MultiLabelBinarizer

# 1. È OBBLIGATORIO ridefinire la classe custom esattamente come nel notebook, 
# altrimenti joblib.load() andrà in errore non trovandola.
class MLBTransformer(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.mlb = MultiLabelBinarizer(sparse_output=False)

    def fit(self, X, y=None):
        self.mlb.fit(X)
        return self

    def transform(self, X):
        return self.mlb.transform(X)

    def get_feature_names_out(self, input_features=None):
        return np.array([c for c in self.mlb.classes_])

# 2. Caricamento in memoria (da fare all'avvio dell'app per non rallentare le richieste)
preprocessor = joblib.load('./web-app/artifacts/occ_model_preprocessor.joblib')
modello = joblib.load('./web-app/artifacts/occ_model_xgboost.joblib')

# 3. La tua funzione finale
def trasforma_e_predici(dati_raw: dict) -> float:
    """
    Riceve un dizionario con dati raw (stringhe, array di amenities, ecc.),
    lo converte nell'array atteso da XGBoost ed esegue la predizione.
    """
    
    # Crea un DataFrame con una singola riga dal payload in input
    df_input = pd.DataFrame([dati_raw])
    
    # IL MAGICO TRANSFORMER: converte 'city' in int, espande le 'amenities' in 0/1 
    # e lascia intatti i valori numerici come 'price'
    X_trasformato = preprocessor.transform(df_input)
    
    # Esegue la previsione sull'array di float generato
    previsione = modello.predict(X_trasformato)
    
    # Ritorna il valore predetto (estraendolo dall'array)
    return float(previsione[0])

# --- ESEMPIO DI UTILIZZO ---
# Questo è l'oggetto "grezzo" che potresti ricevere dal frontend
payload_dal_frontend = {
    "city": "roma",
    "property_type": "Entire rental unit",
    "room_type": "Entire home/apt",
    "amenities": ["Wifi", "Kitchen", "Air conditioning", "Pool"],
    "accommodates": 4,
    "bathrooms": 1.0,
    "bedrooms": 2.0,
    "beds": 2.0,
    "price": 120.0,
    "minimum_nights": 2,
    "reviews_per_month": 1.5,
    "vader_compound_mean": 0.85,
    "days_since_last_review": 10,
    "has_reviews": 1,
    "review_length_mean": 250.0,
    "pct_positive": 0.9,
    "pct_negative": 0.0,
    "review_span_days": 300,
    "avg_days_between_reviews": 15,
    "distance_from_city_center": 2500,
    "distance_from_poi": 500,
    "poi_density": 3.5,
    "beds_per_person": 0.5,
    "bedrooms_per_person": 0.5,
    "bathrooms_per_person": 0.25,
    "beds_per_bedroom": 1.0,
    # ... Inserisci qui tutte le altre variabili raw richieste dal preprocessor ...
    # Le variabili categoriche (città, ecc) verranno codificate automaticamente.
}

# predizione = trasforma_e_predici(payload_dal_frontend)
# print(f"Occupancy prevista: {predizione}")
