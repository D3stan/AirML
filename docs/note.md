* valutare se usare variabili neighbourhood oppure longitudine e latitudine come variabile predittiva del prezzo
* per variabili come host\_since valurate se fissare la data di oggi a un giorno in particolare per evitare che quando rialleniamo cambino i giorni
* Ridge (baseline lineare) --> "Il modello lineare funziona, ma include tutto." --> LASSO (selezione + interpretazione) --> "Queste sono le variabili che contano davvero." --> Kernel Ridge (non-linearità) --> "Modelliamo relazioni non lineari, ma solo dove ha senso."
* capire se tradurre tutte le recensioni o fare un NLP multilingua (chiedere al prof)



- partiamo solo con i task A, B e D.
- task A -> Nico
- task B -> Tod
- task D -> Ale
- cecca si occupa di progettare la webapp

- scrematura fa una persona (nico, ale o tod)
- analisi esplorativa e feature engineering in 3 in parallelo (nico, ale, tod)
- chi fa task A e B prepara i dati dividendoli e facendo in parallelo, chi fa il task D prepara quegli che gli servono.
- tutto in parallelo, poi ci confrontiamo e vediamo se c'è bisogno di riallineare i dati o cose del genere






### 3. sklearn ha già lo strumento giusto
```python
from sklearn.preprocessing import MultiLabelBinarizer

mlb = MultiLabelBinarizer()
amenity_matrix = mlb.fit_transform(listings_df["amenities"])
amenity_df = pd.DataFrame(amenity_matrix, columns=mlb.classes_)
```
In due righe hai tutte le colonne booleane, pronte per il `ColumnTransformer`.

### 4. Strategia top-N che hai già in piano (§3.1)
Non serve espandere *tutte* le amenities (potrebbero essere 100+). Tieni solo quelle più frequenti:

```python
# Conta le amenities più comuni
from collections import Counter
all_amenities = [a for sub in listings_df["amenities"] for a in sub]
top_amenities = [a for a, _ in Counter(all_amenities).most_common(20)]

# Applica il binarizer solo sulle top-N
mlb = MultiLabelBinarizer(classes=top_amenities)
```

Così aggiungi ~20 colonne sparse invece di potenzialmente 150, e tieni `n_amenities` come feature aggregata per catturare il "lusso generale".
