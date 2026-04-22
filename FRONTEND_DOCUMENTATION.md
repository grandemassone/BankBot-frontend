# BankBot Frontend - Documentazione di Business

## Panoramica del prodotto

BankBot Frontend e' l'interfaccia web dell'assistente bancario BankBot. Permette ai clienti e agli amministratori della banca di interagire con i propri conti bancari tramite una chat in linguaggio naturale, accessibile da qualsiasi browser moderno.

---

## Profili utente

### Cliente (ruolo USER)
Il cliente puo' accedere alla propria area personale, chattare con l'assistente AI per consultare il saldo, le transazioni e gestire il proprio conto bancario.

### Amministratore (ruolo ADMIN)
L'amministratore dispone delle stesse funzionalita' del cliente, piu' strumenti avanzati di analisi e gestione dell'intero sistema bancario. L'interfaccia mostra un badge rosso "ADMIN" per distinguere il ruolo.

---

## Funzionalita' principali

### 1. Registrazione

Un nuovo utente puo' creare il proprio account compilando il modulo di registrazione con:
- Nome e cognome
- Indirizzo email
- Password

In caso di email gia' registrata, viene mostrato un messaggio di errore.

---

### 2. Login

L'utente accede con email e password. In caso di credenziali errate viene mostrato un messaggio di errore direttamente nel modulo. Al login riuscito l'utente viene reindirizzato automaticamente alla chat.

La sessione e' mantenuta tramite cookie sicuri: al rientro nell'applicazione l'utente non deve effettuare nuovamente il login finche' la sessione e' valida.

---

### 3. Logout

Dal menu' a tendina in alto a destra (con l'email dell'utente), e' possibile effettuare il logout. La sessione viene terminata e l'utente viene reindirizzato alla pagina di login.

---

### 4. Chat con l'Assistente Bancario

La pagina principale dell'applicazione e' la chat. L'utente digita la propria richiesta in linguaggio naturale e l'assistente risponde in tempo reale.

**Funzionalita' della chat:**

- **Invio messaggio:** premere Invio o il pulsante di invio. Il messaggio appare immediatamente nella conversazione.
- **Indicatore "sta scrivendo":** mentre l'assistente elabora la risposta, viene mostrato un indicatore animato.
- **Notifiche tool call:** quando l'assistente consulta i sistemi bancari (es. recupera il saldo), viene mostrata una notifica inline con il nome dello strumento e il risultato.
- **Indicatore di connessione:** un pallino verde/rosso in alto indica se la connessione in tempo reale e' attiva.

**Esempi di messaggi che l'utente puo' inviare:**

| Messaggio utente | Risposta dell'assistente |
|-----------------|-------------------------|
| "Qual e' il mio saldo attuale?" | Importo e valuta del conto |
| "Mostrami le ultime 5 transazioni" | Lista movimenti recenti |
| "Voglio aprire un conto in CHF" | Procedura guidata apertura conto |
| "Aggiungi una spesa di 100 euro per affitto" | Conferma registrazione transazione |
| "Quali sono le informazioni del mio conto?" | IBAN, valuta, saldo |

---

### 5. Gestione delle Conversazioni

Nella barra laterale sinistra sono elencate tutte le conversazioni precedenti dell'utente.

- **Nuova conversazione:** il pulsante "+" crea una nuova sessione di chat vuota.
- **Selezione conversazione:** cliccando su una conversazione nella sidebar, vengono caricati i messaggi precedenti.
- **Titolo automatico:** ogni conversazione riceve automaticamente un titolo basato sul primo messaggio inviato.
- **Rinomina conversazione:** cliccando sull'icona matita accanto al titolo e' possibile rinominare la conversazione con un nome personalizzato.
- **Anteprima:** nella sidebar viene mostrata un'anteprima del contenuto della conversazione.

---

### 6. Resilienza della connessione

Se la connessione WebSocket cade (es. per problemi di rete), l'applicazione tenta automaticamente di riconnettersi fino a 10 volte con attese progressivamente piu' lunghe. L'utente viene informato dell'errore solo se tutti i tentativi falliscono.

---

## Navigazione

| Pagina | URL | Accesso |
|--------|-----|---------|
| Login | /login | Pubblico |
| Registrazione | /signup | Pubblico |
| Chat | /chat | Solo utenti autenticati |
| Home | / | Redirect automatico |

Gli utenti non autenticati che tentano di accedere a /chat vengono reindirizzati al login. Gli utenti gia' autenticati che accedono a /login o /signup vengono reindirizzati alla chat.

---

## Requisiti tecnici minimi

- Browser moderno con supporto WebSocket (Chrome, Firefox, Safari, Edge)
- JavaScript abilitato
- Connessione a Internet attiva