import {useMutation} from "@tanstack/react-query";
import signup from "~/services/auth/api/signup";

export default function useSignup(){
    return useMutation({
        mutationFn: signup,
        /*onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['todos'] })
        },*/
    })

}