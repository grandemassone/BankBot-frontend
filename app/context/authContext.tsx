import React, {createContext, useState, useContext, useEffect, type ReactNode} from 'react';

// 1. Definiamo la forma del nostro Utente (basata sul tuo JSON di Postman)
interface User {
    id: string;
    email: string;
    role: string;
}

// 2. Definiamo cosa conterrà il Context
interface AuthContextType {
    user: User | null;
    loading: boolean;
    // checkUserLoggedIn non serve esporlo se è usato solo internamente al useEffect,
    // ma in futuro qui aggiungerai probabilmente login() e logout()
}

// 3. Creiamo il context tipizzandolo correttamente
// <AuthContextType | null> dice a TS: "Questo context può essere null (all'inizio) oppure contenere i dati"
const AuthContext = createContext<AuthContextType | null>(null);

// 4. Tipizziamo le props del Provider per accettare 'children'
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const res = await fetch('http://localhost:3000/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Errore verifica auth:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Ora value corrisponde al tipo AuthContextType
    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// 5. Custom Hook per usare il context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve essere usato dentro un AuthProvider");
    }
    return context;
};