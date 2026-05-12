# Programmazione di Applicazioni Data Intensive
## Linee guida progetti d’esame

Il progetto deve essere svolto **individualmente** oppure **in gruppo fino a tre persone**, con un impegno approssimativo di **2–3 giornate di lavoro a testa**.

Il progetto deve riguardare:
- l’**analisi di uno o più dataset**
- l’**addestramento di un modello** di:
  - classificazione  
  - regressione  
  - recommendation  

Il progetto va svolto e consegnato in forma di **Jupyter Notebook (`.ipynb`)**, contenente:
- il codice
- i risultati richiesti
- commenti sui dati analizzati
- spiegazione delle scelte effettuate
- discussione dei risultati ottenuti  

❗ **Non** vanno copiate o riportate nozioni già presenti nel materiale didattico.

### Modalità di consegna

Per consegnare il progetto, inviare via e-mail ai docenti del corso **almeno 5 giorni prima della prova orale** un **URL pubblicamente accessibile** dove sia possibile leggere il file Jupyter, ad esempio utilizzando:
- nbviewer
- Google Colab
- GitHub
- strumenti equivalenti

---

## Passaggi minimi da svolgere

1. **Descrizione del contesto**
   - contesto e obiettivo del modello di predizione
   - fonte e struttura del dataset
   - descrizione delle variabili
   - eventuale prima scrematura dei dati:
     - eliminazione di variabili non informative (es. identificatori)
     - eliminazione di variabili con molti valori nulli

2. **Analisi esplorativa dei dati (EDA)**
   - statistiche generali:
     - medie
     - quartili
     - valori distinti
     - indici di correlazione
   - visualizzazioni tramite:
     - tabelle
     - grafici a torta
     - istogrammi
     - grafici a dispersione
   - commento dei risultati
   - eventuale eliminazione di dati non utilizzabili

3. **Preparazione dei dati**
   - individuazione della variabile *target*
   - identificazione delle variabili predittive
   - suddivisione in **training set** e **test set**
   - preprocessing:
     - one-hot encoding di variabili categoriche
     - over/under-sampling in caso di classi sbilanciate

4. **Addestramento e validazione dei modelli**
   - addestramento di **due o più modelli**
   - calcolo delle metriche di performance viste a lezione, ad esempio:
     - MSE
     - errore relativo
     - coefficiente \( R^2 \) (per regressione)
   - analisi del modello addestrato:
     - coefficienti di una regressione
     - nodi iniziali di un albero decisionale
   - individuazione delle variabili più rilevanti

5. **Ottimizzazione degli iperparametri**
   - scelta di uno o più modelli di base (es. *ridge regression*)
   - ricerca degli iperparametri tramite:
     - grid search
     - randomized search
   - massimizzazione delle performance del modello

---

## Dove reperire i dataset

### Siti noti
- **UCI Machine Learning Repository**  
  <https://archive.ics.uci.edu/ml>

- **Kaggle**  
  <https://www.kaggle.com/datasets>

- **OpenML**  
  <https://www.openml.org/search?type=data>

- **Registry of Open Data on AWS**  
  <https://registry.opendata.aws/>

### API o librerie
- ad esempio dataset finanziari accessibili con package come `yfinance`

### Fonti esterne
- organizzazioni o aziende che abbiano autorizzato l’utilizzo dei dati

---

## Requisiti del dataset

Il dataset scelto deve contenere:
- **almeno qualche migliaio di istanze**
- **indicativamente una decina di variabili**

Se il dataset è molto grande, è possibile selezionare un **sottoinsieme casuale** delle istanze per ridurre i tempi di calcolo.

---

## Punti facoltativi (per migliorare la valutazione)

In particolare per i lavori di gruppo, è possibile:
- utilizzare **più dataset**, unendoli o usandoli separatamente
- **generare nuove variabili**, ad esempio:
  - estrazione di campi da una data (giorno, mese, …)
  - estrazione di termini chiave da testi
- addestrare **diversi tipi di modelli** e confrontarli
  - usando anche librerie esterne (XGBoost, LightGBM, ecc.)
- eseguire una **validazione più approfondita**
  - ad esempio con *nested cross-validation*
- creare una **applicazione Web** per l’uso dei modelli:
  - tramite interfaccia utente
  - e/o API○ ad es. dataset di borsa accessibili con package come yfinance
● Tramite organizzazioni o aziende che ne abbiano autorizzato l’utilizzo
Il dataset scelto deve contenere una quantità adeguata di dati, indicativamente almeno qualche migliaio di istanze
e una decina di variabili. Se il dataset è molto grande, è possibile selezionare un sottoinsieme casuale delle istanze
per ridurre i tempi di calcolo.
Punti facoltativi
Per migliorare la valutazione del progetto, specialmente se svolto in gruppo, è possibile ad es.:
● utilizzare molteplici dataset, unendone insieme i dati in uno unico o utilizzandoli separatamente per
addestrare diversi modelli;
● generare nuove variabili in aggiunta a quelle presenti nei dati, ad es. estraendo i singoli campi di una data
(giorno della settimana, mese, …) o i termini chiave da campi testuali, si vedano l’esercitazione sulla
predizione di borsa e quella col dataset Rossman per alcuni esempi;
● addestrare più tipi di modelli di predizione e confrontarne i risultati, avvalendosi eventualmente di librerie
esterne come XGBoost, LightGBM, …
● eseguire una validazione più approfondita dei modelli, ad es. tramite la nested cross validation;
● creare una applicazione Web che consenta l’utilizzo dei modelli addestrati tramite interfaccia utente e/o
API.