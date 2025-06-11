import { useEffect, useRef, useCallback } from 'react';
import { useWebSocketActions } from '../contexts/WebSocketProvider';
import { useAuth } from './useAuth';

export const useReadReceipts = (messages, sessionId) => {
    const { emitMessagesRead } = useWebSocketActions();
    const { user: currentUser } = useAuth();
    const observer = useRef(null);
    const observedMessageIds = useRef(new Set());

    const handleIntersection = useCallback((entries) => {
        const readableMessageIds = entries
            .filter(entry => entry.isIntersecting)
            .map(entry => parseInt(entry.target.dataset.messageId, 10));

        if (readableMessageIds.length > 0) {
            emitMessagesRead(sessionId, readableMessageIds);
            
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.current.unobserve(entry.target);
                    observedMessageIds.current.delete(parseInt(entry.target.dataset.messageId, 10));
                }
            });
        }
    }, [sessionId, emitMessagesRead]);
    
    useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(handleIntersection, {
            root: null,
            rootMargin: '0px',
            threshold: 0.5,
        });
        
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [handleIntersection]);

    const messageRef = useCallback((node) => {
        if (node) {
            const messageId = parseInt(node.dataset.messageId, 10);
            if (isNaN(messageId)) return;

            const message = messages.find(m => m && m.id === messageId);
            
            if (!message) {
                return;
            }

            let isMyMessage = false;
            if (currentUser) {
                // --- THIS IS THE FIX ---
                // We now check for both `admin_user_id` and `adminUserId` to correctly
                // identify if the message was sent by the currently logged-in admin.
                isMyMessage = message.sender_type === 'admin' 
                    ? (message.admin_user_id === currentUser.id || message.adminUserId === currentUser.id)
                    : message.user_id === currentUser.id;
            } else {
                // This logic correctly identifies messages sent by a guest user.
                isMyMessage = message.sender_type === 'guest';
            }

            // This condition ensures we only observe unread messages that are NOT our own.
            if (!message.read_at && !isMyMessage && !observedMessageIds.current.has(messageId)) {
                observer.current.observe(node);
                observedMessageIds.current.add(messageId);
            }
        }
    }, [messages, currentUser]);

    return messageRef;
};
