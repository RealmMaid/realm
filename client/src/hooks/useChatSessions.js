import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';

const fetchChatSessions = async () => {
    try {
        // --- THIS IS THE CORRECTED API CALL ---
        // It now correctly calls /api/chat/sessions
        const { data } = await API.get('/chat/sessions');

        if (data.success) {
            return data.sessions;
        }
        throw new Error(data.message || 'API returned success: false');
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'An unknown error occurred');
    }
};

export const useChatSessions = () => {
    return useQuery({
        queryKey: ['chatSessions'],
        queryFn: fetchChatSessions,
    });
};
