import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSignup from "~/services/auth/hooks/useSignup";
import { useNavigate } from "react-router";
import toast, { Toaster } from 'react-hot-toast';

// 1. Schema di Validazione
const signupSchema = z
    .object({
        firstname: z.string().min(2, "Il nome deve contenere almeno 2 caratteri"),
        lastname: z.string().min(2, "Il cognome deve contenere almeno 2 caratteri"),
        email: z.string().email("Inserisci un indirizzo email valido"),
        password: z
            .string()
            .min(8, "La password deve essere di almeno 8 caratteri")
            .regex(/[A-Z]/, "Deve contenere almeno una maiuscola")
            .regex(/[0-9]/, "Deve contenere almeno un numero"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Le password non coincidono",
        path: ["confirmPassword"],
    });

export type FormValues = z.infer<typeof signupSchema>

export default function Signup() {
    const navigate = useNavigate();
    const { mutate } = useSignup();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = (data: FormValues) => {
        console.log("1. Form valido, dati pronti per l'invio:", data);

        // Avvia il toast di caricamento
        const loadingToast = toast.loading('Creazione account in corso...');

        mutate({
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            password: data.password
        }, {
            onSuccess: (response) => {
                console.log("2. Successo API:", response);
                toast.dismiss(loadingToast); // Chiudi il caricamento

                toast.success("Registrazione completata!", {
                    duration: 3000
                });

                // Ritarda leggermente il redirect per far leggere il messaggio
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
            },
            onError: (error: any) => {
                console.error("2. Errore API:", error);
                toast.dismiss(loadingToast); // Chiudi il caricamento

                // Cerca di mostrare un messaggio di errore specifico dal backend, se esiste
                const serverMessage = error?.response?.data?.message || "Errore durante la registrazione.";
                toast.error(serverMessage);
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

            {/* Componente Toast necessario per visualizzare i messaggi */}
            <Toaster position="top-center" />

            {/* Intestazione */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Crea il tuo account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Oppure{' '}
                    <a onClick={() => navigate("/login")} className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                        accedi se sei già registrato
                    </a>
                </p>
            </div>

            {/* Form */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

                        {/* Nome */}
                        <div>
                            <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">Nome completo</label>
                            <div className="mt-1">
                                <input
                                    id="firstname"
                                    type="text"
                                    {...register("firstname")}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.firstname ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.firstname && <p className="mt-1 text-sm text-red-600">{errors.firstname.message}</p>}
                            </div>
                        </div>

                        {/* Cognome */}
                        <div>
                            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Cognome completo</label>
                            <div className="mt-1">
                                <input
                                    id="lastname"
                                    type="text"
                                    {...register("lastname")}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.lastname ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.lastname && <p className="mt-1 text-sm text-red-600">{errors.lastname.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Indirizzo Email</label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    {...register("email")}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    {...register("password")}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                            </div>
                        </div>

                        {/* Conferma Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Conferma Password</label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    {...register("confirmPassword")}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        {/* Submit */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Registrazione in corso..." : "Registrati"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}