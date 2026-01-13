console.log("Tutte le variabili caricate:", import.meta.env);
export default async function signup(params: {firstname : string, lastname: string, email: string, password: string}){
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/signup`, {method : "post", body : JSON.stringify(params), headers : {"content-type" : "application/json"}});
    return response.json()
}