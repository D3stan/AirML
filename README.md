# AirML
Predictive Analytics for Short-Term Rentals

## Setup
0. Install **anaconda** `winget install Anaconda.Miniconda3`
1. Clone repo
2. Open anaconda prompt and navigate to project directory
3. Setup virtual environment: `conda env create -f environment.yml`
4. Activate virtual environment: `conda activate adi`
5. Patch git to work with notebooks: `nbstripout --install`
6. Activate nbdime: `nbdime config-git --enable`
7. Open `main.ipynb` in Jupyter Notebook or VSCode and run cells sequentially.
8. Profit

## Merging
To merge the notebook file run `nbdime mergetool`. Link to docs: https://nbdime.readthedocs.io/en/latest/