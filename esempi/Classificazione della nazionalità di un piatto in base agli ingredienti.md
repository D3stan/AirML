#!/usr/bin/env python
# coding: utf-8

# <center>
# 
# # What's Cooking Challenge
# 
# ### <i> Progetto per l'esame di Programmazione di applicazioni di Data Intensive (2019) </i>
# 
# ### Cichetti Federico, Sponziello Nicolò
# </center>

# Il progetto ha lo scopo di creare un modello in grado di classificare il tipo di cucina di una ricetta in base agli ingredienti forniti.

# ## Librerie

# In[2]:


import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import nltk
import pickle
import random
from collections import defaultdict
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, Perceptron
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import confusion_matrix
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.svm import SVC

get_ipython().run_line_magic('matplotlib', 'inline')

nltk.download("punkt")
nltk.download('averaged_perceptron_tagger')
nltk.download("stopwords")


# ## Esplorazione dei dati

# Partiamo caricando i dati in un dataframe Pandas e visualizzandone una parte per capire come sono strutturati

# In[3]:


df = pd.read_json("train.json")
pd.options.display.max_colwidth = 500


# In[4]:


df.head()


# In[5]:


df.tail()


# Il dataframe ha tre colonne:
# - "cuisine" indica il tipo di cucina a cui appartiene il piatto. Questa sarà l'incognita da scoprire.
# - "id" è una colonna che contiene un numero identificativo di ogni piatto. Questo dato non è utile al problema, quindi decidiamo di eliminare la colonna e usare come identificativo l'indice aggiunto in automatico da Pandas.
# - "ingredients" contiene la lista di ingredienti del piatto.

# In[6]:


if "id" in df:
    df.drop("id", inplace=True, axis=1)
df.head()


# Prima di procedere si esplorano e visualizzano alcuni dati, in particolare:
# * Quante ricette sono presenti
# * La totalità degli ingredienti

# In[7]:


len(df)


# Le ricette da classificare nel dataset sono 39774 in totale.

# In[8]:


len(df['cuisine'].unique())


# In totale ci sono 20 tipi di cucine differenti. Si tratta quindi di un problema di classificazione multiclasse.
# Controlliamo quanti piatti ci sono per ogni cucina.

# In[9]:


df['cuisine'].value_counts()


# In[10]:


df['cuisine'].value_counts().plot("bar")


# In[11]:


plt.figure(figsize=(12, 12))
df['cuisine'].value_counts().plot.pie()


# Dai grafici possiamo notare che le classi sono sbilanciate, cioè sono presenti molte ricette che vengono identificate come cucina italiana e messicana, mentre ci sono poche ricette russe e brasiliane, per esempio.

# Per analizzare gli ingredienti, per adesso usiamo un approccio iterativo. Si crea un set di ingredienti in modo da eliminare eventuali duplicati.

# In[12]:


ingredients = set()
for recipe in df['ingredients']:
    for i in recipe:
        ingredients.add(i)


# In[13]:


len(ingredients)


# In totale notiamo che in tutto ci sono 6714 ingredienti diversi nel dataset.

# Visualizziamo quelli più usati. Per fare questo gli ingredienti vanno inseriti in una lista in modo da mantenere i duplicati che poi dovranno essere contati.

# In[14]:


ingredients_list = list()
for i in df['ingredients']:
    for word in i:
        ingredients_list.append(word)


# In[15]:


common_ingredients = pd.Series(ingredients_list)
common_ingredients.value_counts().nlargest(15)


# Questi sono gli ingredienti più comuni

# In[16]:


common_ingredients.value_counts().nlargest(20).plot(kind="bar")


# Visualizziamo ora gli ingredienti più comuni per ogni cucina. Si crea un dizionario che contiene per ogni cucina un dizionario ingrediente -> numero di occorrenze e lo si ordina per tale conteggio. Possiamo poi costruire un DataFrame per visualizzare efficacemente quali sono gli ingredienti più usati.

# In[17]:


tmp = df.groupby('cuisine')['ingredients'].apply(list)

def most_common_ingr_by_cuisine(cuisine):
    lists = tmp[cuisine]
    res = defaultdict(int)
    for recipe in lists:
        for ingr in recipe:
            res[ingr] += 1
    return sorted(res.items(), key=lambda x: x[1], reverse=True)


# Chiamando la funzione qui sopra passando, ad esempio, la classe "italian" possiamo vedere che sale, olio di oliva, aglio e parmigiano sono alcuni degli ingredienti più comuni della cucina italiana.

# In[18]:


commons_ital = pd.DataFrame(most_common_ingr_by_cuisine('italian'), columns=["ingredient", "count"]).head(10)
commons_ital


# In realtà il sale è l'ingrediente più comune per molte cucine.

# In[19]:


pd.DataFrame(most_common_ingr_by_cuisine('french'), columns=["ingredient", "count"]).head(3)


# In[20]:


pd.DataFrame(most_common_ingr_by_cuisine('brazilian'), columns=["ingredient", "count"]).head(3)


# Definiamo ora una funzione che restituisca il numero di ingredienti medio per ogni ricetta di una determinata cucina.

# In[21]:


def avg_ingr_per_recipe(cuisine):
    recipes = tmp[cuisine]
    count = 0;
    for recipe in recipes:
        for ingr in recipe:
            count += 1;
    return count/len(recipes)

avg_ingr_per_recipe('brazilian')


# In[22]:


average = {cuisine: avg_ingr_per_recipe(cuisine) for cuisine in df['cuisine'].unique()}
average


# In[23]:


plt.figure(figsize=(21, 3))
plt.bar(average.keys(), average.values(), align="center", width=0.5)
plt.title("Ingredienti medi per ricetta per ogni cucina")
plt.show()


# # Preprocessing dei dati

# In questa fase, partendo dai risultati dell'analisi, effettuiamo una trasformazione dei dati in modo che siano pronti per essere elaborati dagli algoritmi di learning.

# Come abbiamo potuto notare, il dataframe si compone di righe formate da:
# 
# - **[cuisine]**: categoria di cucina
# - **[ingredients]**: lista di ingredienti in formato testuale

# Una prima domanda che ci si può porre è come gestire gli ingredienti di una ricetta dato che spesso, come emerso dall'analisi dei dati, sono composti da più parole.
# - Una soluzione possibile è quella di considerarli cosi come sono presenti, cioè "black olives" rimarrebbe "black olives"
# - Oppure si potrebbero unire tutti gli ingredienti di una ricetta in un'unica stringa e applicare tecniche di text processing per cercare di estrarre più informazioni possibili
#     - Stemming, Bag of Word, Vector Space Model

# ## Binarizzazione

# Un primo approccio naive sarebbe quello di estrarre dal dataset un set contenente tutti gli ingredienti presenti e binarizzare ogni ricetta.
# - Ad ogni riga, che rappresenta una ricetta, è associato un vettore di elementi in [0, 1] in cui la cella corrispondente all'ingrediente contiene 1 se è usato nella ricetta, 0 altrimenti.
# - Avremmo ottenuto un dataset con circa 6700 features e 40'000 istanze, con un'alta occupazione di memoria e lunghi tempi di calcolo.

# Oltre ad essere evidentemente un metodo poco scalabile, lento, e che occupa livelli veramente alti di memoria, lavora considerando troppi ingredienti e probabilmente è troppo complesso per essere efficace. In seguito ad alcuni test non riportati, si è effettivamente rivelato abbastanza inefficiente e inaccurato, motivo per cui sono stati subito scelti approcci differenti, previlegiando soluzioni con un numero di feature ridotto.

# ## Vector Space Model

# Questo modello consente di rappresentare le ricette come vettori all'interno di un iperspazio in cui a ogni singola parola del dizionario comune (in questo caso, ogni singolo ingrediente) viene associato un peso che indica quanto esso contraddistingua la ricetta stessa.
# Il modello tf-idf si adatta particolarmente bene allo scopo, in quanto:
# - Associa ad ogni parola un peso che dipende sia dalla frequenza di uso locale Tf (cioè nella stessa ricetta) sia negli altri documenti idf (ricette)
# - Tutti gli ingredienti vengono mappati
# - I valori per ogni parola sono normalizzati in [0, 1]
# - Le parole in comune vengono raggruppate: non ci sono duplicati
# 

# Di default, un TfidfVectorizer() effettua del preprocessing prima di creare la matrice che contiene i pesi. Questo preprocessing può comprendere l'eliminazione di eventuali stopword (cioè parole inglesi di poca importanza nella comprensione dei contenuti che vengono scartate), segni di punteggiatura e tanto altro. Una possibile variante è quella di considerare le ricette sia divise per singole parole che per n-uple.

# Per prima cosa, manipoliamo la colonna 'ingredients' del dataframe
# - trasformiamo la lista di ingredienti in un'unica stringa in modo che possa essere letta dal tokenizer

# In[24]:


for idx in df.index:
    txt = ""
    for ing in df.loc[idx, "ingredients"]:
        txt += (ing + " ")
    df.loc[idx, "ingredients"] = txt


# In[25]:


df.head()


# Creiamo i set per il training dei modelli e il calcolo dello score sul validation

# In[26]:


X_t, X_v, y_t, y_v = train_test_split(df['ingredients'], df['cuisine'], random_state=42, test_size=1/3)


# In[27]:


import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)


# ## Nota per le seguenti GridSearch

# In alcune GridSearch sono stati volontariamente omessi alcuni valori di iperparametri che sono stati testati individualmente su altri notebook. Questa decisione è stata fatta per alleggerire i tempi di calcolo di questo notebook in modo da presentare solo risultati rilevanti.

# ## Perceptron

# Iniziamo lo studio dei modelli di classificazione partendo dal più semplice: il Perceptron. Con class_weight="balanced" si fa un tentativo di bilanciare le classi dato che come si è visto ci sono molte più ricette italiane e messicane che altre.

# In[28]:


perceptron = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("perc", Perceptron())
])


# Per ottimizzare i parametri, usiamo la Grid Search
#  - Testiamo anche quale ngram ottimizza lo score

# In[34]:


grid1 = {
    'tfidf__ngram_range':[(1, 1), (1, 2), (1, 3)],  #considerazioni di unigrammi, bigrammi, trigrammi
    'perc__penalty': ['l1', 'l2', None], #regolarizzazioni da effettuare
    'perc__alpha': np.logspace(-5, -3, 3), #peso della regolarizzazione
    'perc__class_weight': [None, "balanced"]
}
gs_perc = GridSearchCV(perceptron, param_grid=grid1, n_jobs=6)


# In[35]:


gs_perc.fit(X_t, y_t)
gs_perc.score(X_v, y_v)


# In[36]:


pd.DataFrame(gs_perc.cv_results_).sort_values("rank_test_score").head(5)


# In[37]:


pd.Series(gs_perc.best_params_)


# Possiamo notare dall'analisi dei risultati prodotti dal Perceptron che le performance migliori si ottengono:
#  - Nessun bilanciamento delle classi
#  - Senza uso di penalizzazione
#  - Considerando bigrammi

# Si salva il modello su disco:

# In[38]:


with open("what's_cooking_website/models/model_perc.bin", "wb") as f:
    pickle.dump(gs_perc.best_estimator_, f)


# ### Note riguardo al perceptron
# 
# Questo modello è già abbastanza buono, ma probabilmente si può fare di meglio. Il peso della regolarizzazione deve essere piuttosto piccolo e si preferisce una regolarizzazione di tipo L2.
# Proviamo l'accuratezza di un modello casuale per vedere quanto si discosta da quella rilevata con il nostro modello.

# In[39]:


cuisines = pd.Series(df["cuisine"].value_counts().keys(), index=range(0, 20, 1))
cuisines.head(5)


# In[40]:


random_predictions = [cuisines.iloc[random.randint(0, 19)] for i in range(0, len(X_v))]
print(str(len(random_predictions) == len(X_v)) + ", " + str(random_predictions[:5]))


# In[41]:


ran_ser = pd.Series(random_predictions)
len(ran_ser[ran_ser == pd.Series(y_v.values)]) / len(X_v)


# L'accuratezza del circa 5% era attesa dato che si tratta di selezionare uno tra venti valori differenti.

# ## Miglioramento dei risultati: Regressione Logistica

# Proviamo a migliorare il risultato:
# - Preprocessando in maniera differente i dati
# - Utilizzando modelli più complessi e accurati

# Definiamo una nostra funzione di preprocessing per avere più controllo su questa fase. Il processamento di un ingrediente viene fatto attraverso i seguenti passaggi:
# - tokenizzazione per dividere in singole parole gli ingredienti multiparola
# - casefolding
# - rimozione delle stopwords e delle parole non-alfabetiche per sfoltire l'insieme degli ingredienti
# - rimozione delle unità di misura
# - stemming/lemmatization dei token ottenuti con i passaggi precedenti in modo da estrarre solamente la parte rilveante degli stessi (la loro radice morfologica)

# In[42]:


units = ['oz', 'gram', 'g']


# In[43]:


def preprocess_stem(ingredients):
    #tokenization
    tokens = nltk.tokenize.word_tokenize(ingredients)
    #token filtering
    tokens_left = {token.lower() for token in tokens} #casefolding
    for tok in set(tokens): #do not check duplicates
        if tok in nltk.corpus.stopwords.words("english") or not tok.isalpha() or tok in units: #non-alphabetic words and stopwords removal
            tokens_left.remove(tok)
    #stemming
    ps = nltk.stem.PorterStemmer()
    stemmed_tokens = {ps.stem(tok) for tok in tokens_left}
    return stemmed_tokens


# Proviamo ora a testare questa funzione insieme a quella di default in una Grid Search in cui si utilizza come modello la Regressione Logistica. Mettiamo anche alcuni iperparametri della regressione nella Grid Search per ottenere il miglior modello possibile.

# In[45]:


grid2 = {
    'model__C' : [1, 3, 5, 10],
    'tokenizer__tokenizer' : [None, preprocess_stem],
    'model__penalty': ['l2', 'l1']
}
logreg = Pipeline([
    ("tokenizer", TfidfVectorizer()),
    ("model",  LogisticRegression())
])
gs_logreg = GridSearchCV(logreg, param_grid=grid2, n_jobs=6)
gs_logreg.fit(X_t, y_t)
gs_logreg.score(X_v, y_v)


# In[46]:


pd.DataFrame(gs_logreg.cv_results_).sort_values("rank_test_score").head(5)


# In[49]:


pd.Series(gs_logreg.best_params_)


# Notiamo dai risultati che il modello migliore ha scelto:
#  - C=5
#  - regolarizzazione l2 
#  - la funzione di default del Vectorizer per la tokenizzazione

# Nonostante il preprocessing potrebbe non essere ottimale, il modello è più accurato quindi possiamo cercare di capire che cosa ha imparato controllando i parametri.
# Possiamo creare un DataFrame che associ a ogni cucina per tutte le parole del dizionario individuate dal Vectorizer il corrispondente peso.

# In[50]:


model_logreg = gs_logreg.best_estimator_
coeffs = pd.DataFrame(model_logreg.named_steps["model"].coef_, index=model_logreg.classes_, columns=model_logreg.named_steps["tokenizer"].get_feature_names())
coeffs


# In questo modo selezionando una cucina e un ingrediente si può vedere il peso assegnato all'interno di una eventuale query.

# In[51]:


coeffs.loc["italian", "mozzarella"]


# In[52]:


coeffs.loc["mexican", "corn"]


# Possiamo inoltre studiare quali siano gli ingredienti più caratteristici di ogni cucina secondo questi pesi.

# In[53]:


best_ing_data = {
    "cuisine" : df["cuisine"].unique(),
    "best_ingredient" : [coeffs.loc[cuisine, :].idxmax() for cuisine in df["cuisine"].unique()],
    "score" : [coeffs.loc[cuisine, :].max() for cuisine in df["cuisine"].unique()]
}
best_ingredients = pd.DataFrame(best_ing_data).set_index(["cuisine"])
best_ingredients


# Si nota già da questo DataFrame che gli ingredienti più caratteristici di alcune cucine sono semplicemente gli aggettivi che ne indicano le provenienze (irish e in altre prove precedenti anche russian), nonostante non siano veri e propri ingredienti. Per le altre cucine, invece, gli ingredienti principali sono abbastanza realistici.

# Proviamo ancora a migliorare i risultati utilizzando un modello ancora più complesso: SVM.

# Ma prima, salviamo anche questo modello su disco. 

# In[55]:


with open("what's_cooking_website/models/model_logreg.bin", "wb") as f:
    pickle.dump(model_logreg, f)


# ## Support Vector Machines

# Le Support Vector Machines sono uno strumento molto potente per individuare iperpiani di separazione ottimi, ovvero quelli che generano minore overfitting. Invece di considerare tutte le istanze, si considerano solo quelle vicine al decision boundary, i cosiddetti Support Vector e si cerca di massimizzare la distanza tra questi punti e l'iperpiano.

# Gli iperparametri per SVM sono i seguenti:
# - il tipo di funzione kernel da usare
# - C, ovvero un parametro che controlla l'overfitting effettuando uno spostamento dei dati misclassified
# - gamma, ovvero un parametro che controlla quanto il decision boundary sia flessibile (in rbf corrisponde all'ampiezza della gaussiana)
# 
# Abilitiamo anche probability=True per abilitare l'utilizzo di predict_proba nel modello finale.

# In[56]:


grid3 = {
    'model__gamma' : [0.1, 1, 5],
    'model__C' : [1, 5],
    'model__kernel' : ['rbf', 'poly']
}
SVC = Pipeline([
    ("tokenizer", TfidfVectorizer()),
    ("model",  SVC(probability=True))
])
gs_SVC = GridSearchCV(SVC, grid3, n_jobs=6)


# In[57]:


gs_SVC.fit(X_t, y_t)
gs_SVC.score(X_v, y_v)


# In[58]:


pd.DataFrame(gs_SVC.cv_results_).sort_values("rank_test_score").head(5)


# In[61]:


pd.Series(gs_SVC.best_params_)


# Con un'accuratezza del 0.80457 il modello SVM è il più preciso fra quelli ottenuti.
#  - C = 5
#  - Gamma = 1
#  - Kernel = RBF

# Ancora una volta, salviamo il modello su disco:

# In[62]:


with open("what's_cooking_website/models/model_SVM.bin", "wb") as f:
    pickle.dump(gs_SVC.best_estimator_, f)


# ## Affidabilità dei modelli

# Si vuole calcolare quanto i modelli trovati finora siano affidabili. Per farlo utilizzeremo diverse metriche:
# - Si calcola la matrice di confusione
# - Si calcolano precision, recall e f1-score dei modelli
# - Calcolo degli intervalli di confidenza con confidenza fissata al 95%

# Carichiamo i modelli dalla memoria in modo da poter eseguire questa parte senza dover necessariamente eseguire le precedenti.

# In[63]:


with open("what's_cooking_website/models/model_perc.bin", "rb") as f:
    model_perc_conf_test = pickle.load(f)


# In[64]:


with open("what's_cooking_website/models/model_logreg.bin", "rb") as f:
    model_logreg_conf_test = pickle.load(f)


# In[65]:


with open("what's_cooking_website/models/model_SVM.bin", "rb") as f:
    model_SVM_conf_test = pickle.load(f)


# In[66]:


def confusion_matrix_calculation(model):
    return confusion_matrix(y_v, model.predict(X_v))

def calculate_precision_recall_f1(model):
    y_v_predictions = model.predict(X_v)
    p = precision_score(y_v, y_v_predictions, pos_label=1, average="macro")
    r = recall_score(y_v, y_v_predictions, average="macro")
    f1 = f1_score(y_v, y_v_predictions, average="macro")
    return {"precision" : p, "recall": r, "f1-score": f1}


# In[67]:


#matrice di confusione del modello perceptron
conf_perc = pd.DataFrame(confusion_matrix_calculation(model_perc_conf_test), index=average.keys(), columns=average.keys())
conf_perc


# In[68]:


#matrice di confusione del modello di regressione logistica
conf_logreg = pd.DataFrame(confusion_matrix_calculation(model_logreg_conf_test), index=average.keys(), columns=average.keys())
conf_logreg


# In[69]:


#matrice di confusione del modello SVM
conf_SVC = pd.DataFrame(confusion_matrix_calculation(model_SVM_conf_test), index=average.keys(), columns=average.keys())
conf_SVC


# La matrice di confusione presenta sulla diagonale i valori predetti correttamente e nelle altre celle quelli che sono stati predetti in modo errato. 
# 
# Anche SVM, il modello migliore, fa abbastanza errori con alcune ricette (ad esempio scambia molti piatti britannici per piatti spagnoli. Questo errore è presente anche negli altri modelli: ne possiamo dedurre che molti ingredienti tra le due cucine siano in comune).

# In[70]:


#calcolo delle statistiche per ogni modello trovato
pd.DataFrame([calculate_precision_recall_f1(model_perc_conf_test),
              calculate_precision_recall_f1(model_logreg_conf_test),
              calculate_precision_recall_f1(model_SVM_conf_test)],
                 index=["perceptron", "logreg", "SVM"])


# Calcoliamo anche gli intervalli di confidenza dei modelli.

# In[71]:


def confidence(acc, N, Z):
    den = (2*(N+Z**2))
    var = (Z*np.sqrt(Z**2+4*N*acc-4*N*acc**2)) / den
    a = (2*N*acc+Z**2) / den
    inf = a - var
    sup = a + var
    return (inf, sup)

def calculate_accuracy(conf_matrix):
    return np.diag(conf_matrix).sum() / conf_matrix.sum().sum()


# In[72]:


#con confidenza del 0.95 si ha Z=1.96
pd.DataFrame([confidence(calculate_accuracy(conf_perc), len(X_v), 1.96),
              confidence(calculate_accuracy(conf_logreg), len(X_v), 1.96),
              confidence(calculate_accuracy(conf_SVC), len(X_v), 1.96)],
                 index=["perceptron", "logreg", "SVM"], columns=["inf", "sup"])


# Dagli intervalli di confidenza al 95% abbiamo la conferma che SVM è il più accurato

# ## Bilanciamento delle classi

# Proviamo ora a trasformare i dati in modo che le classi siano bilanciate per vedere se i risultati che si ottengono sono migliori o peggiori. Per farlo usiamo SMOTE che fa parte del modulo imblearn che deve essere scaricato con pip con il comando 
# ```python
# pip3 install imblearn
# ```

# In[73]:


from imblearn.over_sampling import SMOTE
balancer = SMOTE(random_state=42)
t = TfidfVectorizer()
balanced_matrix = t.fit_transform(df["ingredients"])
y_cpy = df["cuisine"]


# In[74]:


X, y = balancer.fit_resample(balanced_matrix, y_cpy)


# In[75]:


pd.Series(y).value_counts()


# Le classi sono state bilanciate.

# In[109]:


model_balanced = LogisticRegression(C=5)
X_t_b, X_v_b, y_t_b, y_v_b = train_test_split(balanced_matrix, y_cpy, random_state=42, test_size=1/3)


# In[107]:


model_balanced.fit(X_t_b, y_t_b)
model_balanced.score(X_v_b, y_v_b)


# Nonostante i dati siano ora bilanciati tramite oversampling, il modello non migliora la sua accuratezza. Tuttavia, un modello bilanciato dovrebbe essere meno soggetto a overfitting.

# ## Conclusioni

# Su kaggle, dove la competition era stata proposta per la prima volta, grazie al modello SVM abbiamo ottenuto un punteggio uguale ai competitor nelle posizioni 233-235 su 1388 teams. Con il modello di regressione logistica ci eravamo piazzati circa a metà (circa 620esimi). Si potrebbero migliorare ancora di più questi risultati utilizzando altri modelli e lavorando ulteriormente sugli iperparametri nelle Grid Search, ma per ora ci sembra un ottimo risultato.