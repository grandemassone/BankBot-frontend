# BankBot - Frontend

Interfaccia utente dell'assistente bancario BankBot, costruita con **React Router v7**, **TanStack Query**, **Tailwind CSS** e **WebSocket**.

---

## Requisiti

| Tool | Versione minima |
|------|----------------|
| Node.js | 20.x |
| npm | 9.x |

> Il frontend richiede che il **backend BankBot sia in esecuzione** su `http://localhost:3000`.

---

## 1. Clonazione del repository

```bash
git clone <url-del-repository>
cd BankBot-frontend
```

---

## 2. Variabili d'ambiente

Crea un file `.env` nella root del progetto:

```env
VITE_BACKEND_URL=http://localhost:3000
```

---

## 3. Installazione delle dipendenze

```bash
npm install
```

---

## 4. Avvio in modalita' sviluppo

```bash
npm run dev
```

L'applicazione e' disponibile su `http://localhost:5173`.

---

## 5. Build per la produzione

```bash
npm run build
npm start
```

Il server SSR di produzione parte su `http://localhost:3000` (porta configurabile).

---

## 6. Type checking

```bash
npm run typecheck
```

---

## 7. Test

```bash
npm test
```

Esegue i test unitari sulle utility di stato della chat (`chatState.test.ts`).

---

## Riepilogo comandi

```bash
# 1. Clona
git clone <url> && cd BankBot-frontend

# 2. Crea .env
echo "VITE_BACKEND_URL=http://localhost:3000" > .env

# 3. Installa dipendenze
npm install

# 4. Avvia in sviluppo
npm run dev

# oppure per la produzione:
npm run build && npm start
```

---

## Prerequisiti di sistema

Prima di avviare il frontend, assicurarsi che il backend sia attivo:

```bash
# Nella cartella BankBot-backend
docker compose up -d
npx knex migrate:latest --knexfile src/knexfile.ts
npx knex seed:run --knexfile src/knexfile.ts
npm run start:dev
```