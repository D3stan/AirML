# AirML Web App

Questa cartella contiene la web app locale di AirML:

- `backend/`: API mock FastAPI.
- `frontend/`: SPA React + Vite + Tailwind.

Per usare l'app in locale devi avviare backend e frontend in due terminali separati.

## Prerequisiti

Installa prima questi strumenti:

- Python 3.10 o superiore
- Node.js 20 o superiore
- npm

Controllo rapido:

```bash
python --version
node --version
npm --version
```

## 1. Clona il repository

```bash
git clone <URL_DEL_REPOSITORY>
cd AirML
```

Se il percorso contiene spazi, usa sempre le virgolette quando fai `cd`.

Esempio:

```bash
cd "/d/Universita/Terzo Anno/data_intensive/AirML"
```

## 2. Avvia il backend FastAPI

Apri un primo terminale dalla root del progetto.

Vai nella cartella backend:

```bash
cd web-app/backend
```

Installa le dipendenze minime del backend:

```bash
python -m pip install fastapi uvicorn pydantic pandas scikit-learn xgboost joblib httpx pytest
```

Avvia il backend:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Se tutto va bene vedrai un output simile:

```text
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

URL utili del backend:

```text
Swagger / API docs:
http://127.0.0.1:8000/docs

Health check:
http://127.0.0.1:8000/health
```

Puoi testare il backend anche da terminale:

```bash
curl -s http://127.0.0.1:8000/health
```

## 3. Avvia il frontend React/Vite

Apri un secondo terminale dalla root del progetto.

Vai nella cartella frontend:

```bash
cd web-app/frontend
```

Installa le dipendenze Node:

```bash
npm install
```

Avvia Vite:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Se tutto va bene vedrai:

```text
VITE ready
Local: http://127.0.0.1:5173/
```

Apri la SPA da questo URL:

```text
http://127.0.0.1:5173/dashboard
```

Rotte principali:

```text
/dashboard
/settings
```

Nota importante: non aprire `http://127.0.0.1:8000` per vedere la SPA. La porta `8000` e' il backend. La SPA React gira sulla porta `5173`.

## 4. Comandi completi in due terminali

Terminale 1, backend:

```bash
cd web-app/backend
python -m pip install fastapi uvicorn pydantic pandas scikit-learn xgboost joblib httpx pytest
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminale 2, frontend:

```bash
cd web-app/frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Poi apri:

```text
http://127.0.0.1:5173/dashboard
```

## 5. Build di produzione del frontend

Per verificare che il frontend compili correttamente:

```bash
cd web-app/frontend
npm run build
```

Per vedere localmente la build prodotta:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

Apri:

```text
http://127.0.0.1:4173
```

## 6. Test backend

Se sono presenti test backend:

```bash
cd web-app/backend
python -m pytest tests -p no:cacheprovider
```

## 7. Problemi comuni

### La SPA si vede senza CSS

Assicurati di aprire il frontend da Vite:

```text
http://127.0.0.1:5173/dashboard
```

Non usare la porta `8000` per la SPA.

Se il problema continua, ferma eventuali server Vite vecchi e pulisci la cache:

```bash
taskkill //F //IM node.exe
cd web-app/frontend
rm -rf node_modules/.vite
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Poi fai hard refresh nel browser:

```text
Ctrl + F5
```

### La porta 5173 e' gia occupata

Chiudi il vecchio dev server con `Ctrl + C`.

Su Windows/Git Bash puoi anche usare:

```bash
taskkill //F //IM node.exe
```

Poi rilancia:

```bash
cd web-app/frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

### Il backend non parte con `app.main`

Il comando previsto e':

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Questo richiede che esista il file:

```text
web-app/backend/app/main.py
```

Se manca, il backend non puo partire con quel comando.

### `curl` non funziona su Windows

Puoi aprire direttamente nel browser:

```text
http://127.0.0.1:8000/health
```

Oppure usare PowerShell:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health
```

## 8. Riassunto veloce

Backend:

```bash
cd web-app/backend
python -m pip install fastapi uvicorn pydantic pandas scikit-learn xgboost joblib httpx pytest
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd web-app/frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Apri:

```text
http://127.0.0.1:5173/dashboard
```
