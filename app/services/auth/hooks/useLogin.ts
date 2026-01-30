import {useMutation} from "@tanstack/react-query";
import login from "~/services/auth/api/login";

export default function useLogin(){
    return useMutation({
        mutationFn: login
    })
}