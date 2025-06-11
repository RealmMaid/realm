import React, { createContext, useEffect, useRef, useMemo, useContext } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';
import { useChatStore } from '../hooks/useChatStore.js'; // Import the Zustand store
import { v4 as uuidv4 } from 'uuid';

// --- Helper function to get or create a guest ID ---
const getOrCreateGuestIdentifier = () => {
    const GUEST_ID_KEY = 'chatGuestIdentifier';
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
        guestId = uuidv4();
        localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
};

/**
 * This context is now only responsible for providing the functions
 * that interact with the WebSocket. State is handled by Zustand.
 */
const WebSocketContext = createContext(null);
export const useWebSocketActions = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const socketRef = useRef(null);
    const { user } = useAuth();

    // Get actions directly from the Zustand store.
    const {
        setConnected,
        initializeCustomerSession,
        addMessage,
        setPeerTyping,
        clearPeerTyping,
        addOptimisticMessage,
        revertOptimisticMessage,
    } = useChatStore.getState();

    // Effect for managing the socket connection and its event listeners
    useEffect(() => {
        const guestIdentifier = user ? null : getOrCreateGuestIdentifier();
        
        // --- THIS IS THE FIX! ---
        // 1. We get the URL cleanly from the environment variables you set on Render.
        const socketURL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';

        // 2. We create the socket with the URL and a single, clean options object.
        const socket = io(socketURL, {
            withCredentials: true,
            auth: { guestIdentifier }
        });
        
        socketRef.current = socket;

        // --- Socket Event Handlers ---
        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('customer_session_initialized', (data) => initializeCustomerSession(data));
        socket.on('new_customer_message', (payload) => addMessage(payload.savedMessage));
        socket.on('new_admin_message', (payload) => {
            const messageWithId = { ...payload.savedMessage, optimisticId: payload.optimisticId };
            addMessage(messageWithId);
        });
        socket.on('new_customer_session', (payload) => {
            toast(`New chat started with ${payload?.data?.participantName || 'a new visitor'}.`, { icon: '💬' });
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        });
        socket.on('peer_is_typing', ({ sessionId, userName }) => setPeerTyping(sessionId, userName));
        socket.on('peer_stopped_typing', ({ sessionId }) => clearPeerTyping(sessionId));

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    // 3. The dependency array is now much cleaner!
    // This effect will only re-run if the user logs in or out.
    }, [user, queryClient, setConnected, initializeCustomerSession, addMessage, setPeerTyping, clearPeerTyping, revertOptimisticMessage]); // revertOptimisticMessage was also missing here!


    // --- React Query Mutation for sending messages ---
    const useSendMessageMutation = (event) => {
        return useMutation({
            mutationFn: (variables) => {
                return new Promise((resolve, reject) => {
                    if (!socketRef.current?.connected) {
                        return reject(new Error("Socket not connected."));
                    }
                    socketRef.current.emit(event, { ...variables }, (response) => {
                        if (response && response.success) {
                            resolve(response.data);
                        } else {
                            reject(new Error(response?.error || `Failed to send message.`));
                        }
                    });
                });
            },
            onMutate: async (variables) => {
                const optimisticId = addOptimisticMessage(variables.optimisticMessage);
                variables.optimisticId = optimisticId;
                return { optimisticId };
            },
            onError: (err, variables, context) => {
                toast.error(err.message || "Failed to send message.");
                revertOptimisticMessage(context.optimisticId, variables.optimisticMessage.session_id);
            },
            onSettled: (data, error, variables) => {
                queryClient.invalidateQueries({ queryKey: ['messages', variables.optimisticMessage.session_id] });
            }
        });
    };

    const sendAdminReplyMutation = useSendMessageMutation('admin_to_customer_message');
    const sendCustomerMessageMutation = useSendMessageMutation('customer_chat_message');

    // --- Exposed Actions via Context ---
    const actions = useMemo(() => ({
        sendAdminReply: ({ text, sessionId }) => {
            const optimisticMessage = {
                message_text: text,
                sender_type: 'admin',
                admin_user_id: user?.id,
                session_id: sessionId,
            };
            sendAdminReplyMutation.mutate({ text, sessionId, optimisticMessage });
        },
        sendCustomerMessage: ({ text, sessionId }) => {
            const optimisticMessage = {
                message_text: text,
                sender_type: 'guest',
                session_id: sessionId,
            };
            sendCustomerMessageMutation.mutate({ text, sessionId, optimisticMessage });
        },
        emitStartTyping: (sessionId) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('start_typing', { sessionId });
            }
        },
        emitStopTyping: (sessionId) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('stop_typing', { sessionId });
            }
        },
    }), [user, sendAdminReplyMutation, sendCustomerMessageMutation]);

    return (
        <WebSocketContext.Provider value={actions}>
            {children}
        </WebSocketContext.Provider>
    );
};
