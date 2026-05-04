# Determinare la presenza o meno di persone all'interno di un ufficio

**Programmazione di Applicazioni Data Intensive**  
Laurea in Ingegneria e Scienze Informatiche  
DISI - Università di Bologna, Cesena

Alessandro Lombardi

Citazioni

- Accurate occupancy detection of an office room from light, temperature, humidity and CO2 measurements using statistical learning models. L. M. Candanedo, V. Feldheim. Energy and Buildings. Volume 112, 15 January 2016, Pages 28-39.

## Parte 1 - Descrizione del problema e analisi esplorativa

Si deve realizzare un modello che utilizzando i dati registrati da alcuni sensori posti all'interno di un ufficio sia in grado di determinare la presenza o meno di persone al suo interno.

Vengono importate le librerie necessarie per scaricare i file, organizzare le strutture dati e disegnare i grafici.

```py 
%matplotlib inline
import os.path
import numpy as np
import pandas as pd
from pandas.compat import StringIO
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sb
```

### Caricamento dei dati e preprocessing

```py 
file_zip_url = "http://archive.ics.uci.edu/ml/machine-learning-databases/00357/occupancy_data.zip"
file_zip_name = "occupancy_data.zip"
file_training_set_name = "datatraining.txt"
file_validation_set_name = "datatest.txt"
file_test_set_name = "datatest2.txt"

if not os.path.exists(file_zip_name):
    from urllib.request import urlretrieve
    urlretrieve(file_zip_url, file_zip_name)
    from zipfile import ZipFile
    with ZipFile(file_zip_name) as f:
        f.extractall()

with open(file_training_set_name) as dataFile:
    data_raw = pd.read_csv(dataFile, sep=",")

data_raw.head()
```
Di seguito sono riportate le dimensioni in memoria, il numero di istanze non nulle e il tipo delle feature che compongono i dati raccolti nel dataset (training set) 

```py 
data_raw.info(memory_usage="deep")

Sono rinominate le feature `date` in `Date` e `HumidityRatio` in `Humidity_Ratio`

data = data_raw.rename(columns={"date" : "Date",
                                "HumidityRatio": "Humidity_Ratio"})
```
### Significato delle feature

Riportiamo le informazioni sul dataset tratte dalla [fonte](http://archive.ics.uci.edu/ml/datasets/Occupancy+Detection+)

Dati di tipo categorico 
- **`Date`** timestamp della misurazione

- **`Temperature`** misura della temperatura misurata in gradi centigradi (C°)

- **`Humidity`** misura dell'umidità relativa in percentuale

- **`Light`** misura della luminosità in Lux (lx)

- **`CO2`** misura di CO2 nell'aria in parti per milione (ppm)

- **`Humidity_Ratio`** misura derivata dalla umidità e dalla temperatura in Kg di vapore acqueo in Kg di aria 

- **`Occupancy`** indica la presenza di persone nell'ufficio 
  - 1 = presenti (stato occupato) 0 = assenti (stato non occupato)

Con il metodo _describe_ è possibile avere una rappresentazione statistica delle feature numeriche, ottenendo media, deviazione standard e la distribuzione in termini di massimi, minimi e percentili.

La temperatura è abbastanza stabile intorno ai 20 gradi centigradi, il che ci fa supporre che le misure siano state fatte in un luogo protetto, dove non ci sono troppi sbalzi di temperatura e/o le misurazioni siano limitate ad una certa parte dell'anno. I valori della umidità sono invece più variegati, se si mantengono le medesime considerazioni sulla temaperatura, si può attribuire tale fenomeno ad una maggiore sensibilità alla presenza o meno di persone nell'ufficio. Come per la temperatura non è chiaro se la luce sia influenzata da fattori ambientali, come l'alternarsi fra giorno e notte, le ore di luce che variano durante l'anno oppure artificiali come l'uso di luci elettriche. Il valore minimo in Lux corrisponde al completo buio, il massimo ad una giornata abbastanza luminosa, la distribuzione è abbastanza binaria, facendo ipotizzare misurazioni frequenti anche durante la notte con valori costantemente pari a zero. I valori di anidride carbonica in parti per milione potrebbero essere influenzati dall'inquinamento atmosferico o dalla vegetazione nei pressi dell'ufficio. 

### Esplorazione singole feature

num_features = data.columns.size
data.describe()

Il dataset contiene circa tre quarti delle righe labeled come ufficio non occupato. Questo potrebbe essere un problema nella fase di modellazione e valutazione del modello. 

Viene creato un dizionario che associa al valore 0 il colore verde e indica lo stato "non occupato" dell'ufficio mentre al valore 1 il colore rosso che indica lo stato "occupato"

free_color = "#2ca02c" # green
occupied_color = "#d32829" # red

class_colors = [free_color, occupied_color]
class_colors_map = {0:free_color, 1:occupied_color}

print(data["Occupancy"].value_counts())
_ = data["Occupancy"].value_counts().plot.pie(colors=class_colors)

La feature `Date` contiene il timestamp della misurazione, per questioni di ottimizzazione e pre-processing la data viene convertita in *numpy.datetime*. La distribuzione è uniforme e continua ma piuttosto limitata in un periodo relativamente breve.

def cast_date_time_and_show(dataset):
    dataset["Date"] = pd.to_datetime(dataset["Date"], format="%Y-%m-%d %H:%M:%S")

    print(dataset["Date"].describe())
    #plt.plot(dataset["Date"])
    return dataset


data = cast_date_time_and_show(data)

Rappresentazione tramite boxplot dI `Temperature` e `Humidity`

fig, axes = plt.subplots(nrows=1, ncols=2, sharex=False, sharey=False, figsize=(20, 10))


axes[0].boxplot(data["Temperature"], showmeans=True)
axes[1].boxplot(data["Humidity"], showmeans=True)
   
axes[0].set_title("Temperature Boxplot")
axes[1].set_title("Humidity Boxplot")
axes[0].set_ylabel("C°")
axes[1].set_ylabel("%")

Distribuzioni delle altre feature con boxplot e istogrammi.

Nella distribuzione di `Light` vi sono alcuni **outliers** ma sono sempre all'interno di un ragionevole per l'unità di misura Lux. La distribuzione di `CO2` è particolare perchè presenta molti outliers, ma sono spalmati in modo uniforme. 

def plot_box_and_hist(column_name, dataset, symbol=""):
    fig, axes = plt.subplots(nrows=1, ncols=2, sharex=False, sharey=False, figsize=(20, 10))

    axes[0].boxplot(dataset["{}".format(column_name)], showmeans=True)
    axes[1].hist(dataset["{}".format(column_name)], bins=5)
   
    axes[0].set_title("{} Boxplot".format(column_name))
    axes[1].set_title("{} Bar".format(column_name))
    axes[0].set_ylabel(symbol)
    axes[1].set_ylabel(symbol)

plot_box_and_hist("Light", data, "lx")

plot_box_and_hist("CO2", data, "ppm")

plot_box_and_hist("Humidity_Ratio", data, "Kgwater-vapor/Kg-air")

E' evidente che al crescere del valore della feature `Light` il numero dei record labeled come "non occupato" è molto basso, mentre aumentando i livelli di `CO2` aumentano i record segnati come "occupato" e diminuiscono significativamente quelli che non lo sono. Si può ipotizzare che esista una soglia sulla quale poter binarizzare l'insieme dei valori per classificare i record.

_ = data.groupby([pd.cut(data["Light"], bins=5), "Occupancy"]).size().unstack("Occupancy").plot.bar(stacked=False, color=class_colors, figsize=(15,5))

_ = data.groupby([pd.cut(data["CO2"], bins=10), "Occupancy"]).size().unstack("Occupancy").plot.bar(stacked=False, color=class_colors, figsize=(15,5))

### Esplorazione relazioni fra feature

Si vuole dimostrare che cresce al crescere di umidità e temperatura cresce anche il valore contenuto in `Humidity_Ratio` che rappresenta la massa di acqua sulla massa d'aria.
Di seguito vengono riportati i valori classificati per colore sulla feature `Occupancy` della temperatura, che ricorda la tabella psicometrica, e dell'umidità.

fig, axes = plt.subplots(nrows=1, ncols=2, sharex=False, sharey=False, figsize=(20, 10))

sample = data.sample(2500)
axes[0].scatter(sample["Humidity"], sample["Humidity_Ratio"], c=sample["Occupancy"].map(class_colors_map), alpha=0.25)
axes[1].scatter(sample["Temperature"], sample["Humidity_Ratio"], c=sample["Occupancy"].map(class_colors_map), alpha=0.25)

axes[0].set_title("Humidity_Ratio over Humidity")
axes[1].set_title("Humidity_Ratio over Temperature")
axes[0].set_xlabel("%")
axes[0].set_ylabel("kgwater-vapor/kg-air")
axes[1].set_xlabel("C°")
axes[1].set_ylabel("kgwater-vapor/kg-air")


Di seguito viene riprodotta una semplificazione della tabella che lega temperatura e pressione con la massa dell'acqua per Kg di aria come questa riportata in questo sito https://www.engineeringtoolbox.com/water-vapor-air-d_854.html. Si conferma anche qui ciò che è stato ipotizzato precedentemente

fig = plt.figure(figsize=(10, 10))
ax = fig.add_subplot(111)
temperature_interval = pd.cut(data["Temperature"], bins=3)
humidity_interval = pd.cut(data["Humidity"], bins=3)

sb.heatmap(data.groupby([temperature_interval, humidity_interval]).mean().unstack("Temperature")["Humidity_Ratio"], annot=True)

plt.show()

Di seguito per completezza vengono mostrate su scatter plot tutte le combinazioni fra le feature continue e numeriche del dataset, classificate su `Occupancy` per colore. In molti grafici è possibile confermare la tesi fatta precedentemente sulla binarizzazione, infatti in seguito viene visualizzato nel dettaglio la feature `Light` in relazione con `Temperature` e `CO2` dove è palese l'addensarsi dei valori di `Occupancy` in zone abbastanza distinte fra loro, in base alla combinazione delle due feature.

sample = data.sample(2000)
_ = pd.plotting.scatter_matrix(sample.drop(["Occupancy"], axis=1), 
                               c=sample["Occupancy"].map(class_colors_map), 
                               alpha=0.25, 
                               figsize=(12,12), 
                               marker="o",
                               s=25,
                               hist_kwds={"bins": 20, "color": "lightgray"})

fig, axes = plt.subplots(nrows=1, ncols=2, sharex=False, sharey=False, figsize=(20, 10))

sample = data.sample(2500)
axes[0].scatter(sample["Light"], sample["CO2"], c=sample["Occupancy"].map(class_colors_map), alpha=0.25)
axes[1].scatter(sample["Light"], sample["Temperature"], c=sample["Occupancy"].map(class_colors_map), alpha=0.25)

axes[0].set_title("Light over CO2")
axes[1].set_title("Light over Temperature")
axes[0].set_xlabel("Lux")
axes[0].set_ylabel("ppm")
axes[1].set_xlabel("lx")
axes[1].set_ylabel("C°")


In seguito sono mostrate con scatter plot le distribuzioni di alcune misure nel tempo, classificate per colore. Le teorie precedenti riguardanti l'alternarsi fra giorno e notte sembrano essere in parte confermate. Non è scontato che l'orario di lavoro vada dalla mattina alla sera, nemmeno che lo stesso ufficio lo mantenga in futuro, ma nel breve periodo analizzato sembra che questa regola venga rispettata, in quanto non sembrano essere presenti record classificati come "occupato" all'infuori di certe fasce orarie. La feature `Light` distribuita durante le ore di una giornata, svela nuovamente che sotto una certa soglia è difficile che l'ufficio risulti occupato. Inoltre anche durante le ore diurne, quando l'ufficio non è occupato, i valori tendono ad alzarsi, facendo pensare a relazioni con l'ambiente esterno, anche se non è da escludere il semplice allontanamento del personale con l'uso costante della luce elettrica. I grafici per `Temperature` e `Humidity_Ratio` non sembrano avere soglie di binarizzazione molto visibili. La `CO2` invece cresce notevolmente quando classificata come occupata, il picco classificato come non occupato che ha durante le ore 13 potrebbe essere causato dalla pausa pranzo del personale, mentre quello delle ore 18 dall'inquinamento dell'ora di punta, anche se è totalmente assente in altri orari in cui il personale potrebbe uscire o entrare nell'ufficio.

fig = plt.figure(figsize=(20, 10))

plt.scatter(data["Date"].dt.hour, data["Light"], c=data["Occupancy"].map(class_colors_map), alpha=0.15)

fig = plt.figure(figsize=(20, 10))

plt.scatter(data["Date"].dt.hour, data["CO2"], c=data["Occupancy"].map(class_colors_map), alpha=0.15)

fig = plt.figure(figsize=(20, 10))

plt.scatter(data["Date"].dt.hour, data["Humidity_Ratio"], c=data["Occupancy"].map(class_colors_map), alpha=0.15)

fig = plt.figure(figsize=(20, 10))

plt.scatter(data["Date"].dt.hour, data["Temperature"], c=data["Occupancy"].map(class_colors_map), alpha=0.15)

## Parte 2 - Feature preprocessing

Inizialmente vengono importate le librerie e il validation set dal file zip precedentemente scaricato

from sklearn.model_selection import train_test_split
import datetime as dt
from sklearn.metrics import mean_squared_error
from sklearn.linear_model import Perceptron
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from scipy import stats

### Validation set

def import_dataset_and_preprocess_it(file_name):
    with open(file_validation_set_name) as dataFile:
        data_raw = pd.read_csv(dataFile, sep=",")

    return cast_date_time_and_show(data_raw.rename(columns={"date" : "Date",
                                   "HumidityRatio": "Humidity_Ratio"}))

data_val = import_dataset_and_preprocess_it(file_validation_set_name)

data_val.head()

Si può notare che i dati provenienti dal file del validation set rappresentano un insieme temporale molto vicino e in intersezione con quello di training, onde evitare che il modello sfrutti in qualche modo questa caratteristica poco naturale, uniamo i due gruppi, mescoliamo il contenuto ed estraiamo due nuovi set di training e validation, che saranno usati per addestrare modelli con il metodo di **hold-out**

dataset_joined = pd.concat([data_val, data])

print("Shape dei due dataset combinati = {}".format(dataset_joined.shape))

dataset_joined_unix = dataset_joined.copy()
dataset_joined_unix["Date"] = (dataset_joined_unix["Date"] - dt.datetime(1970,1,1)).dt.total_seconds()

X_pre_train, X_pre_val, y_pre_train, y_pre_val = train_test_split(
    dataset_joined_unix.drop(["Occupancy"], axis=1),
    dataset_joined_unix["Occupancy"],
    test_size=1/3, random_state=42
)

print("Training set:   \n{}\n".format(X_pre_train["Date"].describe()))
print("Validation set: \n{}".format(X_pre_val["Date"].describe()))

fit_and_eval fa il trainig  del modello e poi fa lo score (coefficiente di determinazione)

def get_coefficients(model, index, model_name="model"):
    return pd.Series(model.named_steps[model_name].coef_[0], index=index)
    
def fit_and_eval(model, X_train, y_train, X_val, y_val):
    model.fit(X_train, y_train)
    print("R-squared coefficient: {:.5}".format(model.score(X_val, y_val)))

### Standardizzazione, regolarizzazione e multicollinearità

Si esegue una prova utilizzando i dati suddivisi precedentemente per allenare un semplice modello di classificazione basato sull'algoritmo Perceptron.

model = Pipeline([
    ("model",  Perceptron(n_jobs=-1, random_state=42))
])
fit_and_eval(model, X_pre_train, y_pre_train, X_pre_val, y_pre_val)

Sono visualizzati i coefficienti del modello per comprendere quali siano le feature più importanti. In questo caso è evidente che le misurazioni della luce e delle tracce di CO2 giochino il ruolo più importante rispetto alle altre misurazioni nella predizione di nuovi dati. La data ha l'impatto più alto sulla predizione, questo potrebbe aver causato così poca accuratezza. E'possibile provare a **standardizzare** i valori per vedere se il modello può migliorare.

model_coeff = get_coefficients(model, X_pre_train.columns)
model_coeff

std_model = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  Perceptron())
])
fit_and_eval(std_model, X_pre_train, y_pre_train, X_pre_val, y_pre_val)

std_model_coeff = get_coefficients(std_model, X_pre_train.columns)
std_model_coeff

La standardizzazioen comporta un grande miglioramento dello score. Si può provare ad aggiungere una **penalizzazione di tipo L1** per scoprire se tutte le variabili sono realmente utili al modello, e confermare alcune relazioni fra variabili scoperte durante la fase esplorativa.

std_pen_model = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  Perceptron(penalty="l1", alpha=0.0001))
])
fit_and_eval(std_pen_model, X_pre_train, y_pre_train, X_pre_val, y_pre_val)

std_pen_model_coeff = get_coefficients(std_pen_model, X_pre_train.columns)
std_pen_model_coeff

Il modello perde un pò di accuratezza, il peso delle varie feature si allinea, `Light` si conferma la feature più decisiva, confermando l'andamento di alcuni grafici in fase esplorativa. Si nota inoltre la poca utilità di `Humidity` che già in fase esplorativa non aveva raccolto grande interesse. L'annullamento di `Humidity` chiarisce definitivamente la dipendenza che questa feature ha con altre variabili, risolvendo il problema di **multicollinearità** con la feature `Humidity_Ratio`. 

Di seguito si può notare quanto sia decisivo determinare il valore corretto per gli iperparametri, lo score può cambiare nettamente.

model_coeffs = []
i = 0

for alpha in np.logspace(-3, 0, 4):
    print("alpha {} :\n".format(alpha))
    model = Pipeline([("scaler", StandardScaler()), ("model",  Perceptron(penalty="l1", alpha=alpha))
    ])
    fit_and_eval(model, X_pre_train, y_pre_train, X_pre_val, y_pre_val)
    model_coeffs.append(get_coefficients(model, X_pre_train.columns))
    i += 1
    print("\n")

Per provare la dipendenza fra `Humidity` e `Humidity_Ratio` si usa la **Correlazione di Pearson**. Di seguito è presente un **heat map** di tutte le correlazioni fra le feature, che conferma l'altissima correlazione fra le due variabili. Meno accentuata è la correlazione fra `Humidity_Ratio` e `Temperature`, forse a causa della poca variazione di quest'ultima, mentre si possono notare altre sostanziali correlazioni fra `Temperature`, `CO2` e `Light` probabilmente per il fatto che tutti questi valori tendono a crescere con la presenza di persone nell'ufficio

pearson_correlation = X_pre_train.corr(method='pearson')

fig = plt.figure(figsize=(10, 10))
ax = fig.add_subplot(111)

sb.heatmap(pearson_correlation, annot=True)

plt.show()

Vengono di seguito mostrati su un grafico i valori dei coefficienti nelle varie regolarizzazioni con L1, le feature `Temperature`, `Humidity` e `Humidity_Ratio` tendono ad essere annullate in fretta per le dipendenze che hanno fra loro mentre altre come `Light` e `CO2` restano tendenzialmente molto significative

fig = plt.figure(figsize=(10, 5))

plt.plot(model_coeff, 's', alpha=0.75, ms=10, label="Perceptron")
plt.plot(std_model_coeff, '^', alpha=0.75, ms=10, label="Perceptron scaled")
plt.plot(model_coeffs[0], 'v', alpha=0.75, ms=10, label="Perceptron scaled l1 alpha = 0.001")
plt.plot(model_coeffs[1], 'o', alpha=0.75, ms=10, label="Perceptron scaled l1 alpha = 0.01")
plt.plot(model_coeffs[2], 'x', alpha=0.75, ms=10, label="Perceptron scaled l1 alpha = 0.1")
plt.hlines(0, -1, len(model_coeff))
plt.legend(ncol=2, loc=(0, 1.05))
plt.ylim(-15, 15)
plt.xlabel("Coefficients index")
_ = plt.xlabel("Coefficients magnitude")

Inizialmente può essere comodo utilizzare usare tutte le feature per scoprire con mezzi più analitici, come standardizzazione e penalizzazione, le feature meno utili o addirittura dannose per il modello, ma questo non deve offuscare il buon senso e il significato reale delle feature all'interno del modello. `Date`, precedentemente convertita in formato UNIX, contiene informazioni che nel dataset in possesso risultano ridondanti, come l'anno e il mese che è costante. Il timestamp inoltre ha una natura molto diversa dal resto delle feature, non è una misurazione scientifica assoluta, ma un dato influenzato da aspetti sociali ed esterni dal dataset e dall'ambito di studio. Ad esempio, si potrebbe supporre che se il modello fosse allenato su un dataset molto più ampio, contenente i dati di molti anni, potrebbe essere spinto ad associare ai periodi di festività l'assenza di persone nell'ufficio. Probabilmente non sarebbe completamente scorretto, ne irrimediabile con un allenamento e un giusto bilanciamento delle feature che tenga conto di questa situazione, ma è importante osservare queste caratteristiche.

Nel dataset:
- gli anni non cambiano e non dovrebbero influenzare
- i mesi non cambiano e non dovrebbero influenzare
- i giorni sono pochi e non dovrebbero influenzare
- le ore influenzano decisamente le altre misurazioni, è ben visibile il pattern della routine di un ufficio, gli orari di apertura e chiusura sono intuibili nel grafico temporale della feature `Light`
- i minuti e i secondi sono ripetuti ogni ora, sia in quelle dove è probabile che l'ufficio sia occupato che nelle altre, quindi è più difficile che siano determinanti nella classificazione

Ignorando la data si ha un notevole miglioramento con l'uso puro del Perceptron, ma un abbassamento in quello più complesso.

fit_and_eval(std_model, X_pre_train.drop(["Date"], axis=1), y_pre_train, X_pre_val.drop(["Date"], axis=1), y_pre_val)

fit_and_eval(std_pen_model, X_pre_train.drop(["Date"], axis=1), y_pre_train, X_pre_val.drop(["Date"], axis=1), y_pre_val)

Infine viene considerato solo:
- il giorno, completamente penalizzato con `Humidity`, ma ottiene lo score migliore.
- l'ora, penalizzato con `CO2`, secondo score migliore
- i minuti, completamente penalizzati con `Humidity`, ma si ottiene lo score peggiore
- i secondi, completamente penalizzati, terzo score migliore

dataset_joined_daily = dataset_joined.copy()
dataset_joined_hourly = dataset_joined.copy()
dataset_joined_minutely = dataset_joined.copy()
dataset_joined_secondly = dataset_joined.copy()

dataset_joined_daily["Date"] = (dataset_joined_daily["Date"].dt.day).astype("int64")
dataset_joined_hourly["Date"] = (dataset_joined_hourly["Date"].dt.hour).astype("int64")
dataset_joined_minutely["Date"] = (dataset_joined_minutely["Date"].dt.minute).astype("int64")
dataset_joined_secondly["Date"] = (dataset_joined_secondly["Date"].dt.second).astype("int64")

datasets = {"Day" : dataset_joined_daily, 
            "Hour" : dataset_joined_hourly, 
            "Minute" : dataset_joined_minutely, 
            "Second" : dataset_joined_secondly}

for name, value in datasets.items():
    X_train, X_val, y_train, y_val = train_test_split(
        value.drop(["Occupancy"], axis=1),
        value["Occupancy"],
        test_size=1/3, random_state=42
    )
    print(name + ": ")
    fit_and_eval(std_pen_model, X_train, y_train, X_val, y_val)
    print(get_coefficients(std_pen_model, X_train.columns))
    print("\n")

In generale non bisogna escludere che il modello generato possa venir usato in altri ambiti, dove non solo gli orari di lavoro potrebbero essere diversi, ma anche l'uso degli impianti di illuminazione, i valori di inquinamento atmosferico e le temperature. 

## Parte 3 - Modellazione 

Importiamo le librerie e l'ultimo file utilizzabile come test set. Anche in questo caso i dati forniti come test set sono un sottoinsime temporale del training come era avvenuto per quello di validation.

from sklearn.model_selection import KFold
from sklearn.model_selection import cross_val_score
from sklearn.model_selection import GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
import math
from sklearn.ensemble import RandomForestClassifier

Sono testati altri modelli di classificazione, sul dataset in cui `Date` viene trasformato da timestamp completo ad uno orario. Infine tramite **Grid Search** e **K-fold cross validation** sono generati 5 modelli differenti in grado di stimare gli iperparametri e permettere il calcolo dell'accuratezza dei modelli studiati.

models = {}
k_fold = KFold(n_splits=5, shuffle=True, random_state=42)

def print_k_cross_validation_scores(model, X, y, kf):
    scores = cross_val_score(model, X, y, cv=kf)
    print("            Scores: {}\n              Mean: {}\nStandard deviation: {}".format(scores, scores.mean(), scores.std()))

def grid_search_with_cross_validation(model, grid, kf, dataset, scoring=None):
    grid_search = GridSearchCV(model, grid, scoring=scoring, cv=kf, n_jobs=-1)

    X_train, X_val, y_train, y_val = train_test_split(
        dataset.drop(["Occupancy"], axis=1),
        dataset["Occupancy"],
        test_size=1/3, random_state=42
    )

    grid_search.fit(X_train, y_train)
    
    score = grid_search.score(X_val, y_val)

    print("Best cross validation score: {}\n".format(grid_search.best_score_))
    print("             Test set score: {}\n".format(score))
    print("                Best params: {}\n".format(grid_search.best_params_))
    print("             Best estimator: {}\n".format(grid_search.best_estimator_))
    return grid_search.best_estimator_, score
    #print(pd.DataFrame(grid_search.cv_results_))


### Perceptron

Viene controllato nuovamente il punteggio che otterrebbe ottimizzando gli iperparametri e facendo cross-fold validation. 

%%time

per_model = Pipeline([
    ("scaler", StandardScaler()),
    ("per", Perceptron(n_jobs=-1, random_state=42))
])

#print(per_model.get_params())

per_grid = {
    "scaler": [None, StandardScaler()],
    "per__penalty": ["l2", "l1", "elasticnet"],
    "per__alpha": np.logspace(-3, 3, 7),
    "per__fit_intercept": [False, True]
}

per_model, score = grid_search_with_cross_validation(per_model, per_grid, k_fold, dataset_joined_hourly)
models["Perceptron"] = {"Model": per_model, "Score": score}


### Logistic Regression

Metodo per ottenere un piano di separazione non ottimale ma lineare. Si può decidere:
- Standardizzazione i dati sottraendo la media e scalando con la varianza
- Metodo di penalizzazione/regolarizzazione
- il valore di C, ovvero dell'inverso dell'intensità di regolarizzazione
- Aggiungere o meno la intercetta alla funzione

%%time

log_model = Pipeline([
    ("scaler", StandardScaler()),
    ("lr", LogisticRegression(solver='liblinear', random_state=42))
])

#print(log_model.get_params())

log_grid = {
    "scaler": [None, StandardScaler()],
    "lr__penalty": ["l2", "l1"],
    "lr__C": np.logspace(-4, 2, 7),
    "lr__fit_intercept": [False, True]
}

log_model, score = grid_search_with_cross_validation(log_model, log_grid, k_fold, dataset_joined_hourly)
models["Logistic Regression"] = {"Model" : log_model, "Score": score}

### SVM

Support Vector Machine, è un algoritmo di classificazione che trasforma lo spazio dei dati in modo che le classi diventino separabili linearmente, determinando l'iperpiano di separazione ottimale.
- Il parametro C consente di controllare l'overfitting, aumentando tale valore il margine si restringe riducendo il numero di errori di training e causando overfitting. 
- Inoltre vi è la possibilità di specificare il tipo di kernel da utilizzare.
- Il parametro gamma, ovvero il coefficiente del kernel basato su **radial basis function** è impostato al valore standard è 1 / (n_features * X.var()).

%%time

svm_model = Pipeline([
    ("scaler", StandardScaler()),
    ("svc", SVC(random_state=42))
])

#print(svm_model.get_params())

svm_grid = [
  {'svc__C': np.logspace(3, 5, 3), 'svc__kernel': ['linear']},
  {'svc__C': np.logspace(3, 5, 3), 'svc__gamma': ['scale'], 'svc__kernel': ['rbf']},
]

svm_model, score= grid_search_with_cross_validation(svm_model, svm_grid, k_fold, dataset_joined_hourly)
models["Support Vector Machine"] = {"Model": svm_model, "Score": score}

### K Neighbors Classifier

Un algoritmo concettualmente semplice che sceglie la classe da attribuire ad un determinato punto, dello spazio generato dalla feature del problema, che presenta più entità, fra le k che sono state scelte in base ad un determinato sistema di misurazione della distanza. Viene fatto il tuning sulla base di:
- Standardizzazione
- Numero dei vicini da considerare
- Metrica adottata

%%time

knc_model = Pipeline([
    ("scaler", StandardScaler()),
    ("knc", KNeighborsClassifier(n_jobs=-1))
])

#print(svm_model.get_params())

knc_grid = {"scaler": [None, StandardScaler()],
            'knc__n_neighbors': range(1, 10, 1),
            'knc__weights': ['uniform', 'distance']}

knc_model, score = grid_search_with_cross_validation(knc_model, knc_grid, k_fold, dataset_joined_hourly)
models["K-Neighbor"] = {"Model": knc_model, "Score" : score}

### Decision Tree

Modello creato deducendo semplici regole di decisione dai dati delle varie feature in input. E' un metodo concettualmente semplice e non richiede grande preparazione dei dati ma in certe situazioni potrebbe non avere grandi performance in termini di capacità di apprendimento e adattamento a nuovi dati. Vengono regolate:
- il numero minimo di record necessario ad eseguire uno split di un nodo interno
- il numero minimo di record per considerare una foglia valida 
- la profondità dell'albero
- il numero massimo di feature da considerare

%%time

tree_model = Pipeline([
    ("scaler", StandardScaler()),
    ("tree", DecisionTreeClassifier(random_state=42))
])

#print(tree_model.get_params())

tree_grid = {"scaler": [None, StandardScaler()],
             'tree__min_samples_split': range(2, 4, 1),
             'tree__min_samples_leaf': range(1, 4, 1), 
             'tree__max_depth': [None] + [i for i in range(2, 7)],
             'tree__max_features': range(2, num_features, 1)}

tree_model, score = grid_search_with_cross_validation(tree_model, tree_grid, k_fold, dataset_joined_daily)
models["Decision Tree"] = {"Model": tree_model, "Score" : score}

### Random Forest

E' un metodo di ensemble learning, che fa uso di un insieme di alberi decisionali che indipendentemente svolgono il loro algoritmo di classificazione, il risultato finale viene poi democraticamente scelto fra le varie predizioni ottenute dali estimatori. Questa tecnica generalmente tende a diminuire il tipico overfitting dei singoli alberi decisionali.

%%time

forest_model = Pipeline([
    ("scaler", StandardScaler()),
    ("forest", RandomForestClassifier(n_jobs=-1, random_state=42))
])

#print(forest_model.get_params())

forest_grid = {"scaler": [None, StandardScaler()],
             'forest__n_estimators': range(5, 10),
             'forest__min_samples_split': range(2, 5), 
             'forest__max_depth': [None] + [i for i in range(1, 3)],
             'forest__max_features': [int(math.sqrt(num_features)), num_features - 1]}

forest_model, score = grid_search_with_cross_validation(forest_model, forest_grid, k_fold, dataset_joined_hourly)
models["Random Forest"] = {"Model": forest_model, "Score" : score}

Riepilogo dll'accuratezza ottenuta

for name, model in models.items():
    print(name + ":\n\t\t\t\t{}".format(model["Score"]))

## Parte 4 - Valutazione dei modelli di classificazione

Spesso l'accuratezza non è una buona stima della capacità predittiva di un modello di classificazione, in particolare nei casi in cui il dataset è sbilanciato, perchè contiene maggiori record appartenenti ad una classe. In questo caso se si costruisse un modello che predica sempre la stanza coma "non occupata", esso avrebbe una accuratezza di circa il 75% nel predirla non occupata. 

X_train, X_val, y_train, y_val = train_test_split(
    dataset_joined_hourly.drop(["Occupancy"], axis=1),
    dataset_joined_hourly["Occupancy"],
    test_size=1/3, random_state=42)

y_val.value_counts(normalize=True)

from sklearn.metrics import confusion_matrix
from sklearn.metrics import precision_score, recall_score, f1_score

### Precision, Recall e F1-Score

Si costruisce una **matrice di confusione** per ciascun modello creato in precedenza, calcolando la **precisione**, la **recall** e la **F1-score**.
Il Perceptron ottiene nuovamente lo score peggiore, Logistic Regression e SVM hanno all'incirca la medesima performance in F1-Score, ma la precisione della prima è nettamente peggiore. Anche K-Neighbor e Random Forest ottengono all'incirca il medesimo risultato. Il Decision Tree ottiene un risultato superiore al Perceptron, ma la recall peggiore.

def calculate_precision_recall_f1(name, X, y) :
    model = models[name]
    y_pred = model["Model"].predict(X)
    
    model["Precision"] = precision_score(y, y_pred, pos_label=1)
    model["Recall"] = recall_score(y, y_pred)
    model["F1_Score"] = f1_score(y, y_pred, average="macro")
    
    print("{}:\n\n \
    Confusion matrix:\n{}\n\n \
           Precision: {}\n \
              Recall: {}\n \
    F1 Score (macro): {}\n\n\n".format(name, 
                                 pd.DataFrame(confusion_matrix(y, y_pred), index=classes, columns=classes), 
                                 model["Precision"], 
                                 model["Recall"], 
                                 model["F1_Score"]))

classes = ["Free", "Occupied"]

for name, model in models.items():
    calculate_precision_recall_f1(name, X_val, y_val)

### Confronto modelli con intervallo di confidenza

Si verifica con **confidenza** al 95% se la F1-Score dei modelli è statisticamente significativa una dall'altra. I modelli basati su K-Neighbor e Random Forest ottengono risultati praticamente uguali infatti, l'intervallo non garantisce che la K-Neighbor sia migliore della Random Forest, stessa cosa accade fra Logistic Regression e SVM. 

Si denotano quindi due coppie di modelli in sretta competizione fra loro e un modello che si trova a livello di performance sotto entrambe: 
- Random Forest e K-Neighbor (score 0.99..)
- SVM e Logistic Regression (score 0.98..)
- Decision Tree (score 0.97..)

def difference_between_two_models(error1, error2, confidence):
    z_half_alfa = stats.norm.ppf(confidence)
    variance = (((1 - error1) * error1) / len(y_val)) + (((1 - error2) * error2) / len(y_val))
    d_minus = abs(error1 - error2) - z_half_alfa * (pow(variance, 0.5))
    d_plus = abs(error1 - error2) + z_half_alfa * (pow(variance, 0.5))
    print("Valore minimo: {}\nValore massimo: {}\n".format(d_minus, d_plus))

svm_error = 1 - models["Support Vector Machine"]["F1_Score"]
lre_error = 1 - models["Logistic Regression"]["F1_Score"]
knc_error = 1 - models["K-Neighbor"]["F1_Score"]
tree_error = 1 - models["Decision Tree"]["F1_Score"]
forest_error = 1 - models["Random Forest"]["F1_Score"]

print("Support Vector Machine vs Logistic Regression, intervallo di confidenza:")
difference_between_two_models(svm_error, lre_error, 0.95)

print("Support Vector Machine vs K-Neighbor, intervallo di confidenza:")
difference_between_two_models(svm_error, knc_error, 0.95)

print("Decision Tree vs Support Vector Machine, intervallo di confidenza:")
difference_between_two_models(tree_error, svm_error, 0.95)

print("Decision Tree vs K-Neighbor, intervallo di confidenza:")
difference_between_two_models(tree_error, knc_error, 0.95)

print("Decision Tree vs Random Forest, intervallo di confidenza:")
difference_between_two_models(tree_error, forest_error, 0.95)

print("Random Forest vs K-Neighbor, intervallo di confidenza:")
difference_between_two_models(forest_error, knc_error, 0.95)

Riepilogo F1-Score

for name, model in models.items():
    print(name + ":\n\t\t\t\t{}".format(model["F1_Score"]))

I modelli che apparentemente sembrano essere i migliori in base allo score ottenuto durante il tuning degli iper parametri in grid search con cross validation e F1-score sono:
- K-Neighbor
- Random Forest
- Support Vector Machine

## Parte 5 - Analisi del modello migliore

from sklearn.dummy import DummyClassifier

### Confronto con modello casuale

Viene creato un modello casuale

random = DummyClassifier(strategy="uniform", random_state=42)
random.fit(X_train, y_train)

random_score = random.score(X_val, y_val)
models["Dummy"] = {"Model" : random, "Score": random_score}
random_score

Ovviamente tutti i modelli scelti precedentemente sono statisticamente migliori di uno casuale, di seguito sono riportati gli intervalli di confidenza

calculate_precision_recall_f1("Dummy", X_val, y_val)

difference_between_two_models(1 - models["Support Vector Machine"]["F1_Score"], 1 - models["Dummy"]["F1_Score"], 0.99)

difference_between_two_models(1 - models["Random Forest"]["F1_Score"], 1 - models["Dummy"]["F1_Score"], 0.99)

difference_between_two_models(1 - models["K-Neighbor"]["F1_Score"], 1 - models["Dummy"]["F1_Score"], 0.99)


### Precision Recall Curve

Escludendo SVM che ottiene il punteggio peggiore fra i tre e da un punto di vista computazionale è il più oneroso e richiede molto più tempo per l'addestramento bisogna scegliere il modello migliore fra K-Neighbor e Random Forest. 

Non essendo chiaro il motivo per il quale si vuole determinare la presenza o meno di persone di un ufficio è difficile scegliere il migliore, se il sistema dovesse essere usato per gestire questioni di sicurezza, a supporto di un sistema di sorveglianza, potrebbe essere meglio una maggiore recall. Se fosse a supporto nella coordinazione del personale nell'evacuazione dall'edificio in caso di incendio sarebbe meglio una maggiore precisione per ottimizzare la tempestività dei soccorsi.

Non essendo noto il campo di applicazione che avrà il modello addestrato e non potendo quindi decidere una soglia minima di precision o recall, si deve procede analizzando tutte le possibili soglie e trade-off fra precision e recall utilizzando una **precision-recall curve**, che è consideata migliore della **ROC** per i problemi sbilanciati sul numero di istanze di una classe rispetto all'altra.

from sklearn.metrics import precision_recall_curve

fig = plt.figure(figsize=(15, 8))

red_patch = mpatches.Patch(color='red', label='Random Forest')
blue_patch = mpatches.Patch(color='blue', label='K-Neighbor')
plt.legend(handles=[red_patch, blue_patch])

#predict_proba ritorna la probabilità per ciascun record che appartenga alla classe 1 (colonna 1) o 0 (colonna 0)
#print("Media probabilità classe 1: {}".format(models["Random Forest"]["Model"].predict_proba(X_val)[:, 1].mean()))

#valori
#print(np.unique(models["Random Forest"]["Model"].predict_proba(X_val)[:, 1]))

precision_rf, recall_rf, tresholds_rf = precision_recall_curve(y_val, 
    models["Random Forest"]["Model"].predict_proba(X_val)[:, 1])

_ = plt.plot(precision_rf, recall_rf, color="red")

precision_knn, recall_knn, tresholds_knn = precision_recall_curve(y_val, 
    models["K-Neighbor"]["Model"].predict_proba(X_val)[:, 1])

_ = plt.plot(precision_knn, recall_knn, color="blue")
_ = plt.xlabel("Precision")
_ = plt.ylabel("Recall")

Maggiore è l'area sotto la curva migliore è il modello, è evidente che non esistono sostanziali differenze fra i Random Forest e K-Neighbor, la precisione rimane alta anche con valori molto elevati di recall, si può notare che che la Random Forest si avvicina di più all'angolo in alto a destra e ottiene visivamente l'area maggiore sotto la curva.

A seguito di queste considerazioni, è stato scelto il modello basato su Random Forest

### Test finale

Viene importata una piccola parte del dataset per fare una finale valutazione utilizzando dei dati che il modello non ha mai utilizzato per addestrarsi ne fare il tuning degli iperparametri. I dati seppur nuovi, rappresentano sempre un insieme temporale che si trova in buona parte in intersezione con quelli usati precedentemente.

data_test = import_dataset_and_preprocess_it(file_test_set_name)

data_test.head()

data_test["Date"] = (data_test["Date"].dt.hour).astype("int64")

X = data_test.drop(["Occupancy"], axis=1)
y = data_test["Occupancy"]

I punteggi ottentuti con Random Forest sul test set confermano che il modello non è in overfit, in quanto gli score sono migliori dei precedenti ottenuti in fase di training e tuning degli iperparametri.

y_pred = models["Random Forest"]["Model"].predict(X)

print("Accuracy  {}".format(models["Random Forest"]["Model"].score(X, y)))
print("Precision {} ".format(precision_score(y, y_pred, pos_label=1)))
print("Recall    {} ".format(recall_score(y, y_pred)))
print("F1-Score  {} ".format(f1_score(y, y_pred, average="macro")))