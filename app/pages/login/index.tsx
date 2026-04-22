import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from "react-router";
import useLogin from "~/services/auth/hooks/useLogin";
import {useAuth} from '~/context/authContext';
// Importiamo toast per le notifiche
import toast, { Toaster } from 'react-hot-toast';

// 1. Schema di Validazione (Zod)
// Nota: Qui non controlliamo la complessità (maiuscole/numeri),
// ma solo che i campi non siano vuoti.
const loginSchema = z.object({
    email: z
        .string()
        .email({ message: "Inserisci un indirizzo email valido" }),
    password: z
        .string()
        .min(1, { message: "Inserisci la password" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const { mutate } = useLogin();
    const { refreshUser } = useAuth();

    // 2. Setup React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    // 3. Gestione invio
    const onSubmit = (data: LoginFormValues) => {
        // Avviamo il loading toast
        const loadingToast = toast.loading('Verifica credenziali...');

        mutate({
            email: data.email,
            password: data.password
        }, {
            onSuccess: async (response) => {
                toast.dismiss(loadingToast);
                toast.success("Login effettuato! Benvenuto/a.");
                await refreshUser();
                navigate("/chat");
            },
            onError: (error: any) => {
                // Il backend ha risposto con errore (es. 401 o 400 - Password errata)
                toast.dismiss(loadingToast);
                console.error("Login Error:", error);

                // Recuperiamo il messaggio dal server se esiste, altrimenti messaggio generico
                const errorMessage = error?.response?.data?.message || "Email o password non validi.";

                toast.error(errorMessage, {
                    duration: 4000
                });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

            {/* Componente per le notifiche */}
            <Toaster position="top-center" />

            {/* Intestazione */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Accedi al tuo account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Non hai ancora un account?{' '}
                    <a
                        onClick={() => navigate("/signup")}
                        className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
                    >
                        Registrati ora
                    </a>
                </p>
            </div>

            {/* Card del Form */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

                        {/* Campo Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Indirizzo Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    {...register("email")}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
                                    ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Campo Password */}
                        <div>
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                        Password dimenticata?
                                    </a>
                                </div>
                            </div>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    {...register("password")}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
                                    ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Bottone Submit */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Verifica in corso..." : "Accedi"}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}