import { useMutation, useQueryClient } from '@tanstack/react-query';
// 1. Import the toast object
import { toast } from 'react-hot-toast';
import API from '../api/axios';

const updateSessionStatus = async ({ sessionId, action }) => {
    const { data } = await API.post(`/admin/chat/sessions/${sessionId}/${action}`);
    return data;
};

export const useUpdateSessionStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSessionStatus,
        
        // This function runs after the mutation is successful
        onSuccess: (data, variables) => {
            console.log("Mutation was successful! Should be showing a toast now.");
            // First, invalidate the cache so the list updates
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });

            // 2. Show a friendly success notification!
            const successMessage = variables.action === 'archive' ? 'Session archived!' : 'Session resolved!';
            toast.success(successMessage);
        },

        // This function runs if the mutation fails
        onError: (error) => {
            // 3. Show a helpful error notification!
            toast.error(error.message || "An error occurred.");
            console.error("Failed to update session status:", error);
        }
    });
};
