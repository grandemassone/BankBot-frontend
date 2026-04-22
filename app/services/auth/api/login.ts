export default async function login(params: {email: string, password: string}){
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        method : "post",
        body : JSON.stringify(params),
        headers : {"content-type" : "application/json"},
        credentials: 'include',
    });

    // 1. Leggiamo il risultato (che contiene il token o il messaggio di errore)
    const data = await response.json();

    // 2. CONTROLLO FONDAMENTALE:
    // response.ok è true solo se lo status è 2xx (es. 200, 201).
    // Se è false (es. 400, 401, 500), lanciamo un errore manualmente.
    if (!response.ok) {
        // Lanciamo un errore con il messaggio del server (se c'è), o uno generico
        throw new Error(data.message || "Errore durante il login");
    }

    // 3. Se siamo qui, il login è valido (200 OK)
    return data;
}