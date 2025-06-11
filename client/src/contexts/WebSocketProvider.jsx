import React, { createContext, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';
import { useChatStore } from '../hooks/useChatStore.js';
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

const WebSocketContext = createContext(null);
export const useWebSocketActions = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const socketRef = useRef(null);
    const { user } = useAuth();

    const {
        setConnected,
        initializeCustomerSession,
        addMessage,
        setPeerTyping,
        clearPeerTyping,
        addOptimisticMessage,
        revertOptimisticMessage,
    } = useChatStore.getState();

    // --- THIS IS THE BIG CHANGE! ---
    // The connection logic is now wrapped in this function.
    // It will not run until something calls it.
    const connectSocket = useCallback(() => {
        // If we already have a connection, don't do anything.
        if (socketRef.current?.connected) {
            return;
        }

        const guestIdentifier = user ? null : getOrCreateGuestIdentifier();
        const socketURL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';

        const socket = io(socketURL, {
            withCredentials: true,
            auth: { guestIdentifier }
        });
        
        socketRef.current = socket;

        // --- All event listeners are now set up only when we choose to connect ---
        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => {
            setConnected(false);
            socketRef.current = null; // Clear the ref on disconnect to allow reconnection
        });
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

    }, [user, queryClient, setConnected, initializeCustomerSession, addMessage, setPeerTyping, clearPeerTyping, revertOptimisticMessage]);

    // This effect now only handles the cleanup when the user logs in/out
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user]);

    // --- The 'useSendMessageMutation' hook remains the same ---
    const useSendMessageMutation = (event) => {
        return useMutation({
            mutationFn: (variables) => {
                return new Promise((resolve, reject) => {
                    if (!socketRef.current?.connected) {
                        // We connect here if needed before sending a message!
                        connectSocket();
                        // This might take a moment, so we should add a small delay/retry
                        setTimeout(() => {
                           if (!socketRef.current?.connected) {
                               return reject(new Error("Socket still not connected."));
                           }
                           socketRef.current.emit(event, { ...variables }, (response) => {
                                if (response && response.success) resolve(response.data);
                                else reject(new Error(response?.error || `Failed to send message.`));
                           });
                        }, 1000); // 1-second delay to allow connection
                    } else {
                        socketRef.current.emit(event, { ...variables }, (response) => {
                            if (response && response.success) resolve(response.data);
                            else reject(new Error(response?.error || `Failed to send message.`));
                        });
                    }
                });
            },
            onMutate: async (variables) => {
                const optimisticId = addOptimisticMessage(variables.optimisticMessage);
                variables.optimisticId = optimisticId;
                return { optimisticId };
            },
            onError: (err, variables, context) => {
                toast.error(err.message || "Failed to send message.");
                if (context?.optimisticId) {
                   revertOptimisticMessage(context.optimisticId, variables.optimisticMessage.session_id);
                }
            },
            onSettled: (data, error, variables) => {
                queryClient.invalidateQueries({ queryKey: ['messages', variables.optimisticMessage.session_id] });
            }
        });
    };

    const sendAdminReplyMutation = useSendMessageMutation('admin_to_customer_message');
    const sendCustomerMessageMutation = useSendMessageMutation('customer_chat_message');

    const actions = useMemo(() => ({
        // We no longer need to expose connectSocket directly, as mutations handle it
        sendAdminReply: ({ text, sessionId }) => {
            const optimisticMessage = { message_text: text, sender_type: 'admin', admin_user_id: user?.id, session_id: sessionId };
            sendAdminReplyMutation.mutate({ text, sessionId, optimisticMessage });
        },
        sendCustomerMessage: ({ text, sessionId }) => {
            const optimisticMessage = { message_text: text, sender_type: 'guest', session_id: sessionId };
            sendCustomerMessageMutation.mutate({ text, sessionId, optimisticMessage });
        },
        emitStartTyping: (sessionId) => {
            if (socketRef.current?.connected) socketRef.current.emit('start_typing', { sessionId });
        },
        emitStopTyping: (sessionId) => {
            if (socketRef.current?.connected) socketRef.current.emit('stop_typing', { sessionId });
        },
    }), [user, sendAdminReplyMutation, sendCustomerMessageMutation]);

    return (
        <WebSocketContext.Provider value={actions}>
            {children}
        </WebSocketContext.Provider>
    );
};
