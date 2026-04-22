# BankBot Frontend - Documento Tecnico

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Framework | React 19 + React Router v7 |
| Build tool | Vite 7 |
| Stile | Tailwind CSS v4 |
| Fetch / Cache | TanStack React Query v5 |
| Form | React Hook Form + Zod |
| Notifiche | react-hot-toast |
| Real-time | WebSocket nativo (browser) |
| Linguaggio | TypeScript |

---

## Architettura generale

```
app/
+-- root.tsx                  // Layout root, AuthProvider, QueryClientProvider
+-- routes.tsx                // Definizione delle route
+-- context/
|   +-- authContext.tsx       // Context autenticazione globale
+-- pages/
|   +-- login/                // Pagina di login
|   +-- signup/               // Pagina di registrazione
|   +-- chat/                 // Pagina principale della chat
+-- services/
    +-- auth/                 // Logica di autenticazione
    |   +-- api/              // Chiamate HTTP login/signup
    |   +-- hooks/            // useLogin, useSignup
    +-- chat/                 // Logica della chat
        +-- api/              // Chiamate HTTP (conversazioni, messaggi, ws-token)
        +-- hooks/            // useChat, useConversations, useWsToken
        +-- utils/            // chatState.ts (utility pure)
```

---

## Flusso di Autenticazione

### Verifica sessione al caricamento

Al mount di `AuthProvider`, viene chiamato `GET /me` per verificare se esiste una sessione attiva (cookie):

```typescript
const checkUserLoggedIn = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/me`, {
        method: 'GET',
        credentials: 'include',   // invia cookie httpOnly
    })
    if (res.ok) {
        const data = await res.json()
        setUser(data.user)
    } else {
        setUser(null)
    }
}
```

### Login

```typescript
// services/auth/api/login.ts
const response = await fetch(`${VITE_BACKEND_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'content-type': 'application/json' },
    credentials: 'include',   // riceve e salva il cookie httpOnly
})
if (!response.ok) throw new Error(data.message)
```

Il cookie `accessToken` viene salvato automaticamente dal browser (httpOnly, non leggibile da JS).

### Hook `useLogin`

```typescript
export function useLogin() {
    const { refreshUser } = useAuth()
    return useMutation({
        mutationFn: login,
        onSuccess: () => refreshUser(),   // aggiorna il context utente
    })
}
```

---

## Flusso WebSocket (Chat)

### 1. Ottenimento del token WS

```typescript
// services/chat/api/getWsToken.ts
const response = await fetch(`${VITE_BACKEND_URL}/ws-token`, {
    credentials: 'include',
})
const { token } = await response.json()
return token   // JWT valido 2 minuti
```

### 2. Hook `useWsToken`

Usa TanStack Query per ottenere e memorizzare il token:

```typescript
export function useWsToken() {
    return useQuery({
        queryKey: ['wsToken'],
        queryFn: getWsToken,
        staleTime: 90_000,   // 90 secondi (token dura 120s)
    })
}
```

### 3. Hook `useChat` - Connessione WebSocket

```typescript
export function useChat(accessToken: string | null): UseChatReturn {
    const connect = useCallback(() => {
        const backendUrl = VITE_BACKEND_URL.replace(/^http/, 'ws')
        const ws = new WebSocket(`${backendUrl}/${accessToken}`)

        ws.onopen = () => setIsConnected(true)
        ws.onclose = () => {
            setIsConnected(false)
            // riconnessione con backoff esponenziale (max 10 tentativi, cap 30s)
            const delay = Math.min(1000 * Math.pow(2, attempt), 30_000)
            setTimeout(() => connect(), delay)
        }
        ws.onmessage = (event) => handleServerEvent(JSON.parse(event.data))
    }, [accessToken])
}
```

### 4. Gestione eventi WebSocket in arrivo

```typescript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    switch (data.type) {
        case 'message':
            // aggiunge il messaggio dell'assistente alla lista
            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
            break
        case 'typing':
            setIsTyping(data.active)
            break
        case 'tool_call':
            // mostra una notifica dello strumento invocato
            setMessages(prev => [...prev, { role: 'tool', toolName: data.toolName, content: data.result }])
            break
        case 'conversation_started':
            setCreatedConversationId(data.conversationId)
            break
        case 'error':
            setError(data.message)
            break
    }
}
```

### 5. Invio messaggio

```typescript
const sendMessage = useCallback((content: string, conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
            type: 'send_message',
            conversationId,
            content,
        }))
        setMessages(prev => [...prev, { role: 'user', content }])
    }
}, [])
```

---

## Gestione delle Conversazioni

### Hook `useConversations`

Recupera e aggiorna la lista conversazioni tramite TanStack Query:

```typescript
export function useConversations() {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: getConversations,
    })
}
```

### Utility `chatState.ts`

Funzioni pure (testabili senza dipendenze React):

```typescript
// Risolve quale conversazione selezionare
export function resolveSelectedConversationId(
    currentId: string | null,
    conversations: ConversationItem[]
): string | null {
    if (currentId && conversations.some(c => c.id === currentId)) return currentId
    return conversations.length > 0 ? conversations[0].id : null
}

// Mappa la history del DB al formato ChatMessage
export function mapHistoryToChatMessages(items: ConversationMessageItem[]): ChatMessage[] {
    return items
        .filter(item => item.role === 'user' || item.role === 'assistant')
        .map(item => ({ role: item.role, content: item.content || '' }))
}
```

---

## Componente Chat (pages/chat/index.tsx)

Il componente e' suddiviso in sotto-componenti interni:

| Componente | Responsabilita' |
|-----------|----------------|
| ChatHeader | Titolo, badge ruolo, indicatore connessione, dropdown utente |
| ConversationSidebar | Lista conversazioni, creazione nuova, rinomina |
| MessageList | Rendering messaggi user/assistant/tool, indicatore typing |
| ChatInput | Textarea invio messaggio, submit con Enter |

### Flusso principale al caricamento della pagina

```
1. useAuth()           -> recupera utente dal context
2. useWsToken()        -> ottiene token WS via GET /ws-token
3. useChat(token)      -> apre connessione WebSocket
4. useConversations()  -> carica lista conversazioni
5. resolveSelectedConversationId() -> seleziona conversazione attiva
6. getConversationMessages()       -> carica messaggi della conversazione selezionata
```

---

## Ricognessione automatica WebSocket

Il hook `useChat` implementa una strategia di riconnessione con backoff esponenziale:

```
Tentativo 1: attesa  1s
Tentativo 2: attesa  2s
Tentativo 3: attesa  4s
...
Tentativo 10: attesa 30s (cap massimo)
Dopo 10 tentativi: mostra errore "Impossibile riconnettersi"
```

---

## Routing

```typescript
// routes.tsx (React Router v7)
/           -> redirect automatico in base ad autenticazione
/login      -> pagina login
/signup     -> pagina registrazione
/chat       -> pagina chat (protetta)
```

---

## Struttura cartelle `app/`

```
app/
+-- root.tsx                      // Layout root con provider globali
+-- routes.tsx                    // Definizione route
+-- app.css                       // Stili globali + Tailwind
+-- context/
|   +-- authContext.tsx           // AuthProvider, useAuth hook
+-- pages/
|   +-- login/index.tsx           // Form login
|   +-- signup/index.tsx          // Form registrazione
|   +-- chat/index.tsx            // Pagina chat principale
+-- routes/
|   +-- home.tsx                  // Route home con redirect
+-- services/
    +-- auth/
    |   +-- api/login.ts          // fetch POST /login
    |   +-- api/signup.ts         // fetch POST /signup
    |   +-- hooks/useLogin.ts     // mutation login
    |   +-- hooks/useSignup.ts    // mutation signup
    +-- chat/
        +-- api/createConversation.ts
        +-- api/getConversationMessages.ts
        +-- api/getConversations.ts
        +-- api/getWsToken.ts
        +-- api/updateConversationTitle.ts
        +-- hooks/useChat.ts      // WebSocket + messaggi
        +-- hooks/useConversations.ts
        +-- hooks/useWsToken.ts
        +-- utils/chatState.ts    // utility pure
        +-- utils/chatState.test.ts
```