# AirML
# Previsione del prezzo e dell'occupancy degli AirBnb in Italia
**Progetto di Programmazione di applicazioni Data Intensive A.A. 2025-2026**

**Realizzato da:** Matteo Ceccarelli, Alessandro Porcheddu, Nicolas Tazzieri, Matteo Todeschi

{`matteo.ceccarelli12`, `alessandro.porcheddu`, `nicolas.tazzieri`, `matteo.todeschi2`}@studio.unibo.it

## Files
- `main.ipynb`: contiene la parte principale del progetto
- `calendar_feature_engineering.ipynb`: contiene i passaggi effettuati per estrarre i dati da calendars.csv

## Web app
Le istruzioni su come eseguire la web app sono presenti nella cartella web-app. Si può inoltre visualizzare una demo su [AirMl](https://airml.0xpuddu.com/dashboard) 

## Setup per lo sviluppo
0. Install **anaconda** `winget install Anaconda.Miniconda3`
1. Clone repo
2. Open anaconda prompt and navigate to project directory
3. Setup virtual environment: `conda env create -f environment.yml`
4. Activate virtual environment: `conda activate adi`
5. Patch git to work with notebooks: `nbstripout --install`
6. Activate nbdime: `nbdime config-git --enable`
7. Open `main.ipynb` in Jupyter Notebook or VSCode and run cells sequentially.
8. Profit

### Merging
To merge the notebook file run `nbdime mergetool`. Link to docs: https://nbdime.readthedocs.io/en/latest/
