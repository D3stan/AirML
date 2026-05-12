

# Previsione punteggio dei vini in base alle caratteristiche
# 
# Progetto di Programmazione di Applicazioni Data Intensive 
# a.a. 2018/19
# 
# **Realizzato da:**
# Samuele Burattini
# 
# samuele.burattini@studio.unibo.it
# 

# ## Caricamento Librerie
# 
# Per prima cosa carichiamo le librerie per effettuare operazioni sui dati
#   - _NumPy_ per creare e operare su array a N dimensioni
#   - _pandas_ per caricare e manipolare dati tabulari
#   - _matplotlib_ per creare grafici
#   
# Importiamo le librerie usando i loro alias convenzionali e abilitando l'inserimento dei grafici direttamente nel notebook
# 

# In[1]:


import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

get_ipython().run_line_magic('matplotlib', 'inline')


# Per gli altri componenti li importeremo man mano quando necessario.

# ## Caricamento dei dati
# Carichiamo ora il dataset con le recensioni, punteggi e prezzi dei vini ottenuto da [Kaggle](https://www.kaggle.com/zynicide/wine-reviews#winemag-data-130k-v2.csv).
# 
# Il dataset è stato ricavato scaricando le recensioni di circa 130000 vini postate sul sito [WineEnthusiast ](https://www.winemag.com/?s=&drink_type=wine) e inserendo le informazioni ricavate in formato csv. La rilevazione è stata effettuata nel 2017.
# ### Significato delle colonne
# Le feature presenti nel Dataset sono: 
# 
# - `country`: paese in cui è stato prodotto il vino
# - `description`: descrizione in linguaggio naturale del vino scritta da un sommelier del sito
# - `designation`: designazione che viene attribuita al vino, è molto specifica e spesso identifica vini della stessa zona o con caratteristiche simili
# - `price`: prezzo a bottiglia in dollari
# - `province`: zona di produzione del vino è un'indicazione geografica più precisa rispetto allo stato (es. country:USA, province:California)
# - `region_1`: una indicazione geografica ancora più specifica della zona di produzione che è ristretta all'interno della regione
# - `region_2`: opzionale, spesso ridonda l'informazione indicata da region_1
# - `taster_name`: il nome del sommelier che ha scritto la recensione
# - `taster_twitter_handle`: l'alias twitter del sommelier che ha scritto la recensione
# - `title`: titolo della recensione, contiene il nome del vino spesso compreso di anno di produzione
# - `winery`: casa produttrice del vino
# 
# La variabile che tenteremo di predirre è:
# - `points`: punteggio che è stato assegnato al vino da degli esperti, il punteggio è intero, in scala da 0 a 100, anche se sul sito vengono pubblicati solo vini con almeno 80 punti

# In[2]:


import os.path
file = "./wine-reviews/winemag-data-130k-v2.csv";
if not os.path.exists(file):
    print("Missing dataset, retrieve it from kaggle");

wine = pd.read_csv(file, index_col=0);


# In[3]:


wine.info(verbose=False, memory_usage="deep");


# In[4]:


wine.head(1)


# Osserviamo che sono presenti 13 features e la maggior parte sono di tipo object.
# Il dataset così caricato occupa molto spazio in memoria quindi lo ricarichiamo questa volta specificando quali dati gestire come categorici in particolare il paese di provenienza, le province, regioni e le varietà.

# In[5]:


categorical = ["country", "province", "region_1", "region_2", "taster_name", 
               "taster_twitter_handle", "variety", "winery"];
wine = pd.read_csv(file, index_col=0, dtype={x:"category" for x in categorical});
wine.info(verbose=False, memory_usage="deep");


# Vediamo come lo spazio in memoria sia ora circa la metà di prima.
# 
# Alcune feature non sono rilevanti per il nostro problema, possiamo quindi rimuovere le colonne dal dataframe per risparmiare ulteriormente spazio.
# 

# In[6]:


wine.drop(columns=["taster_name", "taster_twitter_handle"], inplace=True);
wine.head(1)


# ## Analisi generale dei dati
# Visualizziamo alcune statistiche per prendere coscienza dei dati che dovremo analizzare e delle caratteristiche del dominio applicativo.
# 
# Vediamo come prima cosa quanto variano i dati in nostro possesso:

# In[7]:


for x in ["country", "designation", "province", "variety", "winery"]:
    print(x+":  \t"+ str(wine[x].nunique()));


# Il dataframe contiene quindi informazioni su vini provenienti da 43 paesi e appartenenti a 707 varietà diverse.

# In[8]:


def plot_bar(feature, n, title):
    wine[feature].value_counts()[:n].plot.bar(figsize=(15, 4))
    plt.axes().set_title(title);
    plt.show()


# In[9]:


plot_bar("country", 20, "Paesi più frequenti")


# Vediamo una netta dominanza di vini prodotti in USA, a seguire Francia, Italia e Spagna. Gli altri paesi sono rappresentati in maniera nettamente inferiore.

# In[10]:


plot_bar("variety", 50, "Varietà più frequenti")


# Ora osserviamo le varietà di vino che sono più rappresentate, abbiamo in questo caso una distribuzione un po' più omogenea tra i diversi tipi di vino anche se sono comunque molti ad essere presenti meno di mille volte.
# 
# Vediamo infine come si distribuiscono i punteggi:

# In[11]:


wine["points"].value_counts().sort_index().plot.bar(figsize=(15, 4));


# La distribuzione dei punteggi è gaussiana, con la maggior parte dei vini che cade tra gli 84 e i 94 punti.
# 
# Vediamo alcune statistiche sui prezzi usando il metodo describe di pandas.

# In[12]:


wine["price"].describe()


# Vediamo quindi come il prezzo medio sia relativamente basso anche se il prezzo massimo è di oltre 3000 dollari a bottiglia. La deviazione standard è infatti molto alta.

# ## Preparazione dei dati
# 
# Prepariamo ora i dati caricati ad essere elaborati dal modello, selezioniamo le feature che possono essere più interessanti e gestiamo i valori nulli.
# 
# Nel campo *title* è incluso l'anno di produzione del vino.
# Dal momento che potrebbe essere un dato rilevante lo estraiamo dal testo e sostituiamo la colonna con la nuova colonna *production_year*

# In[13]:


#First remove winery name from title then parse year
#NV wines (non vintage) have no year
import re
titles = wine["title"]
production_year = [];
for i in wine.index : 
    s = wine['title'][i].replace(wine['winery'][i],"");
    if(" NV " in s):
        production_year.append(None);
    else:
        toadd = re.search(r"(\d{4})", s);
        if toadd != None :
             production_year.append(int(toadd.group(1)));
        else:
             production_year.append(None);
wine["production_year"]=production_year;
wine.drop(columns=["title"],inplace=True);


# Vediamo ora quanti valori nulli abbiamo nel dataframe per le varie colonne.

# In[14]:


wine.shape[0]-wine.count()


# Il campo *production_year* ricavato ha molti valori vuoti. Dal momento che il valore non è deducibile da altri parametri è meglio eliminare le righe che non hanno un anno di produzione. Poi castiamo a int dal momento che non ci sono più valori nulli.

# In[15]:


wine.dropna(subset=['production_year'], inplace=True);

wine["production_year"] = wine["production_year"].astype('int32');


# Il campo *price* ha dei valori vuoti ma, dal momento che la deviazione standard è molto alta, non avrebbe senso stimarlo con la media generica dei valori.
# 
# Valutiamo quindi se è possibile riempire i valori osservando se esiste una correlazione con altri parametri ad esempio il punteggio.
# 
# Calcoliamo quindi le medie dei prezzi per ogni punteggio assegnato e visualizziamo il risultato graficamente.

# In[16]:


#sapendo che i punteggi sono interi tra 80 e 100
avg_prices = {};
for i in range(80,101):
    avg_prices[i] = wine[wine["points"]== i]["price"].mean()

avg_prices = pd.Series(avg_prices);


# In[17]:


plt.xlabel("points");
plt.ylabel("price");
plt.scatter(avg_prices.index, avg_prices)


# Il grafico mostra che esiste una correlazione tra la media dei prezzi ed il punteggio assegnato, quindi andiamo a riempire i valori nulli con quelli della serie generata prima.

# In[18]:


wine['price'] = wine.apply(
    lambda row: avg_prices[row['points']] if np.isnan(row['price']) else row['price'],
    axis=1
)


# Le colonne *designation* e *region_2* hanno molti valori vuoti, quindi dal momento che non possono essere riempite conviene eliminarle.
# 
# Per tutte le altre invece scartiamo le righe che contengono valori nulli.

# In[19]:


wine.drop(columns=["region_2", "designation"], inplace=True);
wine.dropna(inplace=True);


# In[20]:


wine.head()


# ### Selezione delle feature rilevanti
# Ai fini dell'elaborazione finali nel dataframe sono ancora presenti informazioni più o meno ridondanti. 
# Valutiamo quali feature mantenere in base anche alla dimensione dei dati categorici.

# In[21]:


for x in ["country","region_1","province","variety", "winery"]:
    print(x+":  \t"+ str(wine[x].nunique()));


# Notiamo che *region_1* e *winery* contengono un numero eccessivamente alto di valori, *country* invece troppo basso quindi varierebbe molto poco.
# 
# Scegliamo quindi di eliminarle perché non particolarmente significative per definire un modello.

# In[22]:


wine.drop(columns=["country", "region_1","winery"], inplace=True);
wine.head()


# Valutiamo ora la distribuzione delle frequenze di *province* e *variety* per scegliere come comportarsi.

# In[23]:


variety = wine["variety"].value_counts()[wine["variety"].value_counts()>200].size;
province = wine["province"].value_counts()[wine["province"].value_counts()>100].size;

print("Provinces with more than 100 wines:"+str(province));
print("Varieties with more than 200 wines:"+str(variety));


# Vediamo quindi che le istanze non sono equamente distribuite e che possiamo risparmiare un fattore 10 per quel che riguarda le varietà di vino eliminando poche tuple.

# In[24]:


var_stay = wine["variety"].value_counts()[wine["variety"].value_counts()>200]
prov_stay = wine["province"].value_counts()[wine["province"].value_counts()>100]
#generate an array of boolean values for rows that has to stay
filter_arr = [];
for i in wine.index : 
    prov = wine['province'][i];
    var = wine['variety'][i];
    filter_arr.append(prov in prov_stay and var in var_stay);

wine_reduced = wine[filter_arr].copy();
del wine;
wine_reduced.shape


# Abbiamo quindi ottenuto un dataset con circa 100000 tuple di vini appartenenti a varietà e province con una frequenza elevata.
# 
# Aver ottenuto feature con una minore variabilità ci aiuta a migliorare la precisione del modello. Feature che variano troppo, come troppo poco, sono poco rilevanti e tendono a degradare il processo di regressione.
# 
# Volendo si potrebbe addestrare un modello sulle feature rimaste fuori in modo da poter valutare tutte le diverse tipologie di vino e le diverse province di appartenenza. Per semplicità in questa trattazione procederemo solo sui dati così selezionati.

# In[25]:


wine_reduced.head()


# Aggiungiamo oltre alla colonna *production_year* il calcolo di quanti anni è invecchiato il vino (dato tendenzialmente significativo rispetto al dominio applicativo ed indipendente dalla rilevazione) sapendo che i dati sono stati raccolti nel 2017.
# 
# Rinominiamo alcune colonne per evitare ambiguità quando andremo ad analizzare il testo.

# In[26]:


aged = 2017-wine_reduced["production_year"]
wine_reduced["years_aged"] = aged;


# In[27]:


wine_reduced= wine_reduced.rename(columns={"price": "bottle_price", "variety":"wine_variety", "province":"production_province"})
wine_reduced.head()


# Ora convertiamo le feature categoriche in valori numerici tramite il metodo di binarizzazione

# In[28]:


province_dumm = wine_reduced["production_province"].str.get_dummies();
variety_dumm = wine_reduced["wine_variety"].str.get_dummies();


# In[29]:


wine_numeric = wine_reduced.merge(province_dumm, left_index=True, right_index=True);
wine_numeric = wine_numeric.merge(variety_dumm, left_index=True, right_index=True);
wine_numeric = wine_numeric.drop(columns=["wine_variety", "production_province"]);


# In[30]:


wine_numeric.head(1)


# Ora il dataframe è quasi pronto per preparare il modello.

# ## Preparazione del modello
#  
# Andiamo ora a preparare il modello a partire dai dati che abbiamo raffinato.
# 
# Procediamo con i seguenti passi:
# - Estraiamo le informazioni dal testo generando una matrice documenti termini
# - Accodiamo le nuove feature a quelle già in nostro possesso
# - Dividiamo i dati in train e validation set
# - Standardizziamo le feature in modo che le differenze tra le scale non pesino sull'esito del modello
# - Addestriamo diversi modelli utilizzando diverse tecniche per valutare quale riesce ad ottenere una precisione migliore

# ### Language Processing
# 
# Analizziamo ora le recensioni, in modo da ottenere un valore numerico da poter inserire all'interno del dataframe per processarlo assieme agli altri dati.
# 
# Per prima cosa importiamo le librerie necessarie:

# In[31]:


from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split


# Poi etichettiamo le recensioni positive e negative in modo da poter fare un test preliminare con un modello di classificazione e stimare se le operazioni che stiamo facendo sul testo sono efficaci e permettono di estrarre caratteristiche significative.

# In[32]:


middle = wine_numeric["points"].mean()
wine_numeric["desc_label"] = np.where(wine_numeric["points"] >= middle, "pos", "neg")


# In[33]:


wine_train, wine_val = train_test_split(wine_numeric, test_size=1/3, random_state=42)


# Scarichiamo da nltk la lista delle stopwords per la lingua inglese in modo da poter selezionare in modo più accurato le features.

# In[34]:


nltk.download("stopwords")
nltk.download("punkt")
stoplist = nltk.corpus.stopwords.words("english")


# Estraiamo quindi una rappresentazione vettoriale pesata in base alla frequenza delle parole selezionando solo quelle che sono presenti in almeno 10 recensioni.
# 
# Utilizziamo il parametro stop_words per rimuovere alcune parole della lingua inglese che non hanno un particolare valore semantico all'interno della frase ma servono principalmente alla sua costruzione.

# In[35]:


tresh = 10;
vect = TfidfVectorizer(min_df=tresh, stop_words=stoplist);
dtm = vect.fit_transform(wine_train["description"]);


# In[36]:


vect.get_feature_names()[:10]


# Notiamo che all'interno delle recensioni ci sono dei termini numerici che spesso si riferiscono ad altre annate, percentuali di composizione ecc. Tali termini sono poco significativi per la nostra analisi quindi li rimuoviamo in modo da snellire le feature.
# 
# Rigeneriamo quindi lo spazio vettoriale impostando il parametro **token_pattern** per ignorare le parole che contengono numeri.

# In[37]:


tresh = 10;
vect = TfidfVectorizer(min_df=tresh,stop_words=stoplist, token_pattern=r'(?u)\b[A-Za-z]+\b');
dtm_train = vect.fit_transform(wine_train["description"]);


# In[38]:


dtm_train.shape


# In[39]:


vect.get_feature_names()[:10]


# Notiamo che le feature selezionate spesso sono declinazioni della stessa parola (per esempio abound e abounds).
# 
# Per rendere più snello l'insieme delle feature e catturare l'essenza della recensione procediamo quindi con un processo di stemming che permette di estrarre la radice semantica delle parole in modo da considerarne solo il significato.
# 
# Utilizziamo uno degli algoritmi implementati in nltk:

# In[40]:


ps = nltk.stem.PorterStemmer()


# e definiamo quindi la funzione includendo lo stemming e la rimozione dei numeri e delle stopwords

# In[41]:


regex = re.compile(r'(?u)\b[A-Za-z]+\b')
def tokenize_with_stemming(text):
    return [ps.stem(token) for token #remove numbers
            in filter(lambda x : regex.match(x) and x not in stoplist, nltk.tokenize.word_tokenize(text)) ]


# Testiamo la funzione su una recensione:

# In[42]:


s = wine_train["description"].iloc[2]
print(s)
tokenize_with_stemming(s)[:10]


# Generiamo nuovamente lo spazio specificando come tokenizer la funzione appena definita. 
# 
# Notiamo che l'operazione è più lunga ma produce risultati più snelli e precisi. 

# In[43]:


tresh = 10;
vect = TfidfVectorizer(min_df=tresh, tokenizer=tokenize_with_stemming);
dtm_train = vect.fit_transform(wine_train["description"]);


# In[44]:


dtm_train.shape


# Con questo procedimento abbiamo snellito il numero delle feature di circa 1000 elementi.
# 
# Rappresentiamo anche il validation set nello stesso spazio vettoriale ottenendo la matrice documenti termini.
# 
# Addestriamo ora un modello di classificazione sulle descrizioni e ne valutiamo la performance per avere una stima di come il modello reagisce alle feature estratte

# In[45]:


dtm_val = vect.transform(wine_val["description"]);
from sklearn.linear_model import LogisticRegression
lrm = LogisticRegression(C=10)
lrm.fit(dtm_train, wine_train["desc_label"]);


# In[46]:


lrm.score(dtm_val, wine_val["desc_label"])


# Possiamo visualizzare i coefficenti assegnati alle varie feature in modo da cogliere come il modello ha interpretato il linguaggio per giudicare se la recensione è positiva o negativa.

# In[47]:


coefs = pd.Series(lrm.coef_[0], index=vect.get_feature_names())
coefs.sort_values(inplace=True)


# In[48]:


coefs.head(3)


# In[49]:


coefs.tail(3)


# Purtroppo avendo applicato lo stemming le feature non sono più vere e proprie parole, ma possiamo comunque coglierne il loro significato in base alla radice.

# #### Selezioniamo il parametro min_df
# 
# Il modello di classificazione ci fornisce una stima dell'accuratezza che possiamo raggiungere con i successivi raffinamenti.
# Per avere un'idea più precisa di come selezionare le feature possiamo tentare di valutare più modelli modificando il parametro **min_df** che rappresenta il numero minimo di recensioni in cui una parola deve comparire per essere considerata rilevante.
# 
# Per il primo test abbiamo scelto 10 in modo arbitrario, testiamo alcuni diversi valori e valutiamo quale possa essere il migliore in relazione al numero di feature che vengono selezionate e all'accuratezza del modello generato.
# 
# Non variamo il parametro della regressione logistica proprio perché non è interessante per le operazioni future.

# In[50]:


print("min_df:%d\t shape:%s\t score:%6.5f" % (10, dtm_train.shape, lrm.score(dtm_val, wine_val["desc_label"])))
print("--------------------------------------------------")
for x in [5, 25, 35, 50, 100]:
    vect = TfidfVectorizer(min_df=x, tokenizer=tokenize_with_stemming);
    dtm_train = vect.fit_transform(wine_train["description"]);
    shape = dtm_train.shape
    dtm_val = vect.transform(wine_val["description"]);
    lrm = LogisticRegression(C=10)
    lrm.fit(dtm_train, wine_train["desc_label"]);
    score = lrm.score(dtm_val, wine_val["desc_label"])
    print("min_df:%d\t shape:%s\t score:%6.5f" % (x, shape, score))


# Vediamo come 35 sia la scelta migliore per il parametro perchè l'accuratezza tende a scendere sia se sono presenti troppe feature sia se ne vengono eliminate molte richiedendo che siano presenti in parecchie recensioni.
# 
# Anche se l'accuratezza è di poco inferiore rispetto al modello con parametro 10 il risparmio sul numero delle feature è sufficientemente grande da giustificare una leggera perdita di precisione. 
# 
# Facendo crescere ulteriormente il parametro il risparmio sulle feature diventa meno significativo e la perdita di precisione cresce.

# ### Unificazione dei dati
# 
# Abbiamo visto come un semplice modello di classificazione riesca ad estrarre in modo efficace le informazioni dal testo.
# 
# Ora dobbiamo utilizzare i dati ricavati dall'elaborazione del testo assieme a quelli già presenti nel dataframe per elaborare un modello di regressione.
# 
# Accodiamo quindi alla matrice documenti termini la restante parte dei dati. Per farlo dobbiamo convertire il nostro dataframe in una matrice sparsa in modo da limitare le dimensioni in memoria della tabella.

# In[51]:


import scipy.sparse


# In[52]:


#convertiamo la matrice di valori numerici in matrice sparsa
wine_train_sparse = scipy.sparse.csr_matrix(wine_train.drop(columns=["points", "description", "desc_label"]).values)
wine_val_sparse = scipy.sparse.csr_matrix(wine_val.drop(columns=["points", "description", "desc_label"]).values)

wine_train_sparse.shape


# Poi accodiamo la matrice documenti termini a quella sparsa appena ottenuta

# In[53]:


#accodiamo la matrice documenti termini
from scipy.sparse import hstack
wine_train_sparse = hstack((wine_train_sparse, dtm_train))
wine_val_sparse = hstack((wine_val_sparse, dtm_val))

wine_train_sparse.shape


# ### Creazione di un modello di regressione
# Il nostro obiettivo finale è quello di ottenere però un modello di regressione sui dati in modo da poter stimare non solo la qualità del vino ma cercare di ottenere direttamente un punteggio e avere così un'indicatore più preciso.
# 
# Andiamo quindi a testare alcune tecniche di regressione per valutare quella che meglio si presta al nostro tipo di problema. Non valutiamo un approccio polinomiale dal momento che il numero di feature è già molto alto e applicare un filtro polinomiale porterebbe ad aumentare il tempo di esecuzione e il numero di variabili degradando le performance del modello.
# 
# Per prima cosa mettiamo assieme tutte le operazioni di preprocessing definendo la funzione:

# In[54]:


def preprocess(df, min_df, seed):
    #divisione dei set
    X = df.drop(columns="points")
    y = df["points"]
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=1/3, random_state=seed)

    #estrazione del testo
    vect = TfidfVectorizer(min_df=min_df, tokenizer=tokenize_with_stemming);
    dtm_train = vect.fit_transform(X_train["description"])
    terms = vect.get_feature_names()
    dtm_val = vect.transform(X_val["description"])

    #creazione delle matrici sparse
    #manteniamo gli indici delle colonne separatamente
    cols = X_train.drop(columns=["description", "desc_label"]).columns.values.tolist()
    X_train_sparse = scipy.sparse.csr_matrix(X_train.drop(columns=["description", "desc_label"]).values)
    X_val_sparse = scipy.sparse.csr_matrix(X_val.drop(columns=["description", "desc_label"]).values)
    X_train_sparse = hstack((X_train_sparse, dtm_train)).tocsr()
    X_val_sparse = hstack((X_val_sparse, dtm_val)).tocsr()
    #ritorniamo l'indice condiviso

    index = cols+terms
    return X_train_sparse, X_val_sparse, y_train, y_val, index, vect


# In[55]:


#Ripuliamo la memoria dai vecchi set di dati 
wine_val_sparse = None
wine_train_sparse = None
wine_train = None
wine_val = None
dtm_train = None
dtm_val = None
#Generiamo i nuovi con la funzione appena definita
X_train, X_val, y_train, y_val, index, wine_vect = preprocess(wine_numeric, 35, 42)


# Ora creiamo i modelli con l'ausilio delle Pipeline di sklearn.
# 
# Visto che il numero di parametri è già molto alto rinunciamo all'utilizzo di regressione polinomiale che farebbe ulteriormente aumentare il numero delle feature e procediamo invece ad applicare diversi modelli di regressione utilizzando la grid search per individuare un set di iperparametri che massimizzi l'accuratezza.
# 
# Importiamo per prima cosa le librerie necessarie:

# In[56]:


from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV
from sklearn.preprocessing import StandardScaler
#sopprimiamo i warning della GridSearch
import warnings
warnings.filterwarnings("ignore")


# Al nostro dataframe applichiamo sempre un filtro StandardScaler per standardizzare i dati in particolare dal momento che i prezzi e i punteggi hanno scale molto diverse rispetto al resto dei valori. Nella standardizzazione imponiamo il parametro *with_mean=False* perché operando su matrici sparse non è possibile calcolare la media senza perdere la struttura compressa.

# #### Regressione Lasso
# Per prima cosa testiamo se con la regressione Lasso possiamo eliminare alcune feature perché poco rilevanti.
# 
# Creiamo una pipeline e facciamo partire la grid search che testa il modello in 5-cross fold validation secondo il set di iperparametri che gli chiediamo di valutare.

# In[57]:


from sklearn.linear_model import Lasso
model = Pipeline([
    ("scale",  StandardScaler(with_mean=False)),
    ("linreg", Lasso())
])
grid = {
    "linreg__alpha": [0.1, 0.5, 1]
    }
gs = GridSearchCV(model, param_grid=grid, cv=5)
gs.fit(X_train, y_train)
sel = ["rank_test_score","mean_test_score","mean_train_score","params"]
pd.DataFrame(gs.cv_results_).sort_values("mean_test_score", ascending=False)[sel]


# Sceliamo quindi il parametro più piccolo perché vediamo che l'accuratezza crolla con una regolarizzazione più forte e addestriamo un modello allo scopo di individuare le feature più rilevanti.

# In[58]:


model = Pipeline([
    ("scale",  StandardScaler(with_mean=False)),
    ("linreg", Lasso(alpha=0.1))
])
model.fit(X_train, y_train);


# In[59]:


lasso = pd.Series(model.named_steps["linreg"].coef_, index)
c = len(lasso[lasso>0])
print("Features estratte: "+ str(c))
lasso[lasso>0][:20]


# Vediamo che la precisione crolla utilizzando lasso perché vengono eliminate molte features, in compenso riusciamo ad apprezzare il fatto che vengono considerate maggiormente le parole delle recensioni rispetto alle varietà e alle province di produzione.
# 
# Deduciamo quindi che purtroppo anche se non tutte le feature sono ugualmente rilevanti è difficile selezionarne un gruppo ristretto e avere comunque una precisione accettabile.

# #### Regressione Ridge
# Testiamo ora il modello di regressione Ridge per valutare le performance di un modello di regressione lineare applicando però una regolarizzazione per evitare che i coefficienti crescano troppo.

# In[60]:


from sklearn.linear_model import Ridge
model = Pipeline([
    ("scale",  StandardScaler(with_mean=False)),
    ("linreg", Ridge())
])
grid = {
    "linreg__alpha": [0.1, 1, 10, 50]
    }
gs = GridSearchCV(model, param_grid=grid, cv=5)
gs.fit(X_train, y_train)
pd.DataFrame(gs.cv_results_).sort_values("mean_test_score", ascending=False)[sel]


# Vediamo come il valore **alpha** che rappresenta il peso della regolarizzazione non modifica particolarmente i risultati ottenuti questo ci fa propendere verso l'idea che con la semplice regressione lineare si possa comunque raggiungere un risultato soddisfacente.

# #### Regressione Lineare
# Addestriamo quindi un modello di regressione lineare sul nostro train set e valutiamone l'accuratezza.

# In[61]:


from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold
from sklearn.model_selection import cross_val_score

linear_model = Pipeline([
    ("scale",  StandardScaler(with_mean=False)),
    ("linreg", LinearRegression())
])

kf = KFold(5, shuffle=True, random_state=42)
scores = cross_val_score(model,X_train , y_train, cv=kf)
scores.mean()


# Vediamo come l'accuratezza raggiunta sia di fatto identica a quella della Regressione Ridge segno che la regolarizzazione non influisce in modo significativo sul risultato come avevamo previsto.

# #### Approccio misto: regressione sul risultato della classificazione
# Dal momento che il problema prevede l'analisi di dati testuali e di feature differenti ho pensato che potesse essere interessante valutare un approccio misto in cui si sfrutta il risultato della classificazione delle descrizioni come parametro su cui applicare la regressione. Questo diminuisce di molto il numero di feature rendendo il modello anche più semplice da valutare.
# 
# Addestriamo quindi un modello di classificazione come abbiamo fatto mentre estraevamo le feature dal testo. Per prima cosa valutiamo il parametro **C** che indica il costo della regolarizzazione.

# In[62]:


wine_train, wine_val = train_test_split(wine_numeric, test_size=1/3, random_state=42)
vect = TfidfVectorizer(min_df=35,stop_words=stoplist, token_pattern=r'(?u)\b[A-Za-z]+\b');
dtm_train = vect.fit_transform(wine_train["description"]);
dtm_val = vect.transform(wine_val["description"]);

from sklearn.linear_model import LogisticRegression
lrm = LogisticRegression()

grid=grid = {"C": [5, 10, 50, 100]}
gs = GridSearchCV(lrm, param_grid=grid)
gs.fit(dtm_train, wine_train["desc_label"])
pd.DataFrame(gs.cv_results_).sort_values("mean_test_score", ascending=False)[sel]


# Vediamo quindi che il parametro migliore è **C=10** quindi addestriamo un modello sui dati con quel parametro e poi utilizziamo la funzione *predict_proba* per ottenere una nuova colonna con la probabilità di classificazione ovvero un punteggio sulla "positività" della recensione.

# In[63]:


lrm.fit(dtm_train, wine_train["desc_label"])
dtm_all = vect.transform(wine_numeric["description"])
proba = pd.DataFrame(lrm.predict_proba(dtm_all),
             index=wine_numeric.index,
             columns=lrm.classes_)
wine_mixed = wine_numeric.drop(columns=["description","desc_label"]).merge(proba.drop(columns="neg"),
                                                                           left_index=True, right_index=True)
wine_mixed.head(1)


# Dal momento che abbiamo un modello più semplice utilizziamo Lasso per estrarre le feature essenziali.

# In[64]:


mixed_model = Pipeline([
    ("scale",  StandardScaler()),
    ("linreg", Lasso(alpha=0.05))
])
X = wine_mixed.drop(columns="points")
y = wine_mixed["points"]
mixed_train_x, mixed_val_x, mixed_train_y, mixed_val_y = train_test_split(X, y, test_size=1/3, random_state=42)
mixed_model.fit(mixed_train_x, mixed_train_y)
mixed_model.score(mixed_val_x, mixed_val_y)


# Vediamo come l'accuratezza sia scesa abbastanza perché basiamo la nostra regressione già su un risultato stimato e su un numero inferiore di feature.

# In[65]:


coefs = pd.Series(mixed_model.named_steps["linreg"].coef_, wine_mixed.drop(columns="points").columns).sort_values()
print(coefs[coefs!=0])
print("count: "+ str(len(coefs[coefs!=0])))


# Anche qua si conferma come le caratteristiche che vengono trascurate maggiormente sono le province di produzione, mentre il peso maggiore viene assegnato al prezzo, alla positività della descrizione e agli anni di invecchiamento.

# #### Test polinomiale con la riduzione delle feature
# 
# Visto che entrambe le volte che abbiamo eseguito lasso abbiamo individuato alcune feature più importanti delle altre proviamo come ultima strada a vedere se è possibile migliorare la precisione selezionando quelle feature e applicando un filtro polinomiale prima di applicare la regressione.
# Applichiamo la regressione ridge perché lavorando con feature polinomiali la regolarizzazione diventa di solito importante per bilanciare l'effetto dell'esplosione delle variabili.

# In[66]:


keep = coefs[coefs!=0].index.tolist()
wine_lasso = wine_mixed[keep+["points"]]
wine_lasso.head(1)


# In[67]:


from sklearn.preprocessing import PolynomialFeatures
reduced_model = Pipeline([
    ("poly", PolynomialFeatures(include_bias=False)),
    ("scale",  StandardScaler()),
    ("linreg", Ridge())
])
X = wine_lasso.drop(columns="points")
y = wine_lasso["points"]
train_x, val_x, train_y, val_y = train_test_split(X, y, test_size=1/3, random_state=42)
grid = {
    "poly__degree": [2,3],
    "linreg__alpha": [0.1, 10]
    }
gs = GridSearchCV(reduced_model, param_grid=grid)
gs.fit(train_x, train_y)
pd.DataFrame(gs.cv_results_).sort_values("mean_test_score", ascending=False)[sel]


# Vediamo come riusciamo così ad ottenere una buona accuratezza, comparabile con quella ottenuta con il modello con tutte le feature, ma sicuramente più semplice da interpretare.

# ## Valutazione dei modelli migliori
# Andiamo ora a valutare con più attenzione i modelli che abbiamo individuato. Scegliamo il modello Ridge ed il modello con regressione lineare che ci hanno dato i risultati migliori.

# In[68]:


X_train, X_val, y_train, y_val, index, wine_vect = preprocess(wine_numeric, 35, 42)

ridge = Pipeline([
    ("scale",  StandardScaler(with_mean=False)),
    ("linreg", Ridge(alpha=1))
])
linear = Pipeline([
    ("scale",  StandardScaler(with_mean=False)),
    ("linreg", LinearRegression())
])
ridge.fit(X_train, y_train);
linear.fit(X_train,y_train);


# Dopo averli addestrati sulla totalità dei dati valutiamo i vari parametri dei modelli di regressione. Definiamo la funzione:

# In[69]:


from sklearn.metrics import mean_squared_error

def relative_error(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / y_true))

def print_eval(X, y, model):
    print("   Mean squared error: {:.5}".format(mean_squared_error(model.predict(X), y)))
    print("       Relative error: {:.5%}".format(relative_error(model.predict(X), y)))
    print("R-squared coefficient: {:.5}".format(model.score(X, y)))


# In[70]:


print("Linear model Train")
print_eval(X_train, y_train, linear)
print("--------------------------------")
print("Linear model Val")
print_eval(X_val, y_val, linear)
print("================================")
print("Ridge model Train")
print_eval(X_train, y_train, ridge)
print("--------------------------------")
print("Ridge model Val")
print_eval(X_val, y_val, ridge)


# Vediamo come i modelli sono praticamente identici analizziamo ora i coefficienti per dedurre l'impatto che le feature hanno sulla predizione del punteggio.
# 
# Valutiamo il modello ridge perché più generico perché bilancia il peso dei coefficienti.

# ## Interpretazione della conoscenza appresa dal modello
# 
# Andiamo ora ad interpretare tramite l'analisi dei coefficienti degli iperpiani la conoscenza appresa dal modello confrontandola con quello che ci aspettavamo dalla conoscenza basilare sul dominio applicativo e facendo il confronto con le statistiche sui dati in nostro possesso.

# In[71]:


coefs = pd.Series(ridge.named_steps["linreg"].coef_, index).sort_values()


# In[72]:


coefs.head(20)


# Dall'analisi delle feature negative emerge come i coefficenti siano alti per alcune regioni, e varietà di vino. Questi valori pesano molto negativamente sulla valutazione del modello.

# In[73]:


coefs.tail(20)


# Per quel che riguarda i valori positivi vediamo che sono tendenzialmente più bassi rispetto a quelli negativi segno che probabilmente sono più le features che alzano positivamente la valutazione e che da sole pesano meno rispetto a quelle negative.
# 
# Verifichiamo questa ipotesi:

# In[74]:


print("negative features: " +str(len(coefs[coefs<0])))
print("positive features: " +str(len(coefs[coefs>0])))


# Vediamo anche che voto viene utilizzato come voto di partenza.

# In[75]:


print("Base: %5.3f"%ridge.named_steps["linreg"].intercept_)
print("Mean: %5.3f"%wine_reduced["points"].mean())


# Il voto è molto vicino alla media dei voti, questo ci sembra ovviamente sensato in modo che il modello possa oscillare in positivo ed in negativo quanto più possibile.

# La conoscenza appresa dal modello ci sembra rispecchiare quella che intuitivamente si può stimare sul problema della classificazioni di vini: infatti è noto che ci sono province di produzione e varietà più pregiate di altre quindi è normale che determinate province vengano valutate più o meno positivamente.
# 
# Infatti ad esempio vediamo le 5 migliori e le 5 peggiori e li confrontiamo con alcune statistiche sui punteggi che avevamo nel dataframe.

# In[76]:


def more_than_90_ratio(serie):
    n = serie.count()
    value = serie[serie>=90].count()
    return value/n

def best_worst_values(cat,n):
    cats = wine_reduced[cat].unique()
    catscoef = coefs[cats].sort_values()
    best = catscoef.tail(n)
    worst = catscoef.head(n)
    means = wine_reduced[[cat, "points"]].groupby(cat).mean()
    std = wine_reduced[[cat, "points"]].groupby(cat).std()
    max_ = wine_reduced[[cat, "points"]].groupby(cat).max()
    min_ = wine_reduced[[cat, "points"]].groupby(cat).min()
    more_90 = wine_reduced[[cat, "points"]].groupby(cat).agg(more_than_90_ratio)
    count = wine_reduced[cat].value_counts()
    best = {"Best " +cat : catscoef.tail(n).index, 
         'coef':catscoef.tail(n).values,
         'points_mean': means.loc[best.index]["points"].values,
         'points_std': std.loc[best.index]["points"].values,
         'points_max': max_.loc[best.index]["points"].values,
         'points_min': min_.loc[best.index]["points"].values,
         'more_than_90_ratio': more_90.loc[best.index]["points"].values,
         'count': count[best.index].values
        }
    worst = {"Worst " +cat : catscoef.head(n).index,
            'coef':catscoef.head(n).values,
            'points_mean': means.loc[worst.index]["points"].values,
            'points_std': std.loc[worst.index]["points"].values,
            'points_max': max_.loc[worst.index]["points"].values,
            'points_min': min_.loc[worst.index]["points"].values,
             'more_than_90_ratio': more_90.loc[worst.index]["points"].values,
             'count': count[worst.index].values
            } 
    display(pd.DataFrame(best).sort_values("coef", ascending=False).reset_index(drop=True))
    display(pd.DataFrame(worst).sort_values("coef"))
    
best_worst_values("production_province", 5)


# Facciamo la stessa cosa per le qualità di vini per individuare quelle che il modello ha valutato come migliori e peggiori

# In[77]:


best_worst_values("wine_variety",5)


# Vediamo come il parametro **more_than_90_ratio** che esprime la proporzione tra i vini con punteggio superiore a 90 rispetto al totale per quella categoria riflette in modo abbastanza preciso il coefficiente assegnato dal modello.
# 
# In particolare vediamo con il parametro **count** che sono stati assegnati pesi più bassi alle feature che seppur avendo una media o un ratio più alto erano più scarse nel dataframe e quindi meno significative.
# 
# Ovviamente il confronto con queste feature non tiene conto del peso sulle altre feature testuali e non quindi non può essere letto come unico indicatore della lettura del modello.
# 
# Valutiamo ora il lavoro sulle feature testuali:

# In[78]:


words_coefs = coefs[wine_vect.get_feature_names()].sort_values()
print("positive words: %d"%words_coefs[words_coefs>0].count())
print("negative words: %d"%words_coefs[words_coefs<0].count())


# Notiamo che c'è un forte squilibrio tra le parole valutate come positive e quelle valutate come negative. Questo è effettivamente comprensibile considerando che il dominio applicativo contiene vini di punteggio superiore ad 80 quindi nessuna descrizione era fortemente negativa.
# 
# Vediamo quelle valutate più positivamente

# In[79]:


words_coefs.tail(10).sort_values(ascending=False)


# In[80]:


words_coefs.head(10)


# Ancora una volta dalle parole ricavate con lo stemming riusciamo comunque a cogliere il significato e a verificare che il modello ha compreso la positività delle parole in modo coerente con la loro accezione nel linguaggio naturale.
# 
# Vediamo ora i coefficenti sul prezzo, e sull'invecchiamento:

# In[81]:


coefs[["bottle_price","years_aged"]]


# Vediamo come il prezzo a bottiglia viene valutato in modo positivo dal modello. Questo è coerente con quello che ci potevamo aspettare visto che di norma vini più pregiati sono anche più costosi.
# 
# L'invecchiamento invece, contrariamente alle aspettative, viene valutata come una feature negativa.

# ## Conclusioni
# 
# Tramite l'analisi di questo dominio applicativo siamo riusciti con tecniche semplici di analisi del linguaggio naturale e regressione ad estrarre un modello di conoscenza con una buona precisione e coerente con la realtà.
# 
# L'idea dietro questo progetto era vedere come l'estrazione di conoscenza dal testo può essere estremamente efficace anche in un dominio applicativo ristretto e in cui sono presenti molti termini "tecnici" e lontani dall'uso comune.
# 
# Inoltre l'obiettivo di questa analisi voleva focalizzare l'attenzione su come mescolare elementi testuali, categorici e numerici per ottenere un unico modello che avesse una conoscenza globale del problema.
# 
# Mi ritengo personalmente soddisfatto dei risultati ottenuti che hanno fornito spunti interessanti su cui riflettere.