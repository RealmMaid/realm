import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocketActions } from '../contexts/WebSocketProvider.jsx';
import { useChatStore } from '../hooks/useChatStore.js';
import { useAuth } from '../hooks/useAuth.jsx';

const ChatWidgetStyles = () => (
    <style>{`
        /* All your beautiful CSS styles remain unchanged */
        .chat-resume-message {
            text-align: center;
            padding: 1rem 0;
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .chat-resume-message::before,
        .chat-resume-message::after {
            content: '';
            flex-grow: 1;
            height: 1px;
            background: var(--card-border);
        }
        .chat-fab { 
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            width: 60px; 
            height: 60px; 
            border-radius: 50%; 
            background: var(--gradient-primary); 
            color: var(--text-dark); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 2rem; 
            border: none; 
            cursor: pointer; 
            box-shadow: var(--shadow-lg); 
            z-index: 1060; 
            transition: transform 0.2s ease-out; 
        }
        .chat-fab:hover { 
            transform: scale(1.1); 
        }
        .chat-panel { 
            position: fixed; 
            bottom: 90px; 
            right: 20px; 
            width: 370px; 
            max-width: 90vw; 
            height: 500px; 
            max-height: calc(100vh - 120px); 
            z-index: 1050; 
            border-radius: var(--radius-lg); 
            background-color: var(--card-bg); 
            border: 1px solid var(--card-border); 
            box-shadow: var(--shadow-lg); 
            display: flex; 
            flex-direction: column; 
            transform: translateY(20px) scale(0.95); 
            opacity: 0; 
            transition: transform 0.2s ease-out, opacity 0.2s ease-out; 
            visibility: hidden; 
        }
        .chat-panel.visible { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
            visibility: visible; 
        }
        .chat-panel-header { 
            padding: 1rem; 
            border-bottom: 1px solid var(--card-border); 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        .chat-panel-header h3 { 
            font-family: var(--font-pixel); 
            color: var(--accent-lavender); 
            margin: 0; 
        }
        .chat-panel-header button { 
            background: none; 
            border: none; 
            font-size: 1.5rem; 
            color: var(--text-secondary); 
            cursor: pointer; 
        }
        .chat-messages-area { 
            flex-grow: 1; 
            overflow-y: auto; 
            padding: 1rem; 
            display: flex; 
            flex-direction: column; 
            gap: 0.75rem; 
        }
        .chat-input-area { 
            border-top: 1px solid var(--card-border); 
            padding: 1rem; 
        }
        .chat-input-area form { 
            display: flex; 
            gap: 0.5rem; 
        }
        .chat-input-area input { 
            flex-grow: 1; 
        }
        .chat-status { 
            text-align: center; 
            padding: 0.5rem; 
            font-size: 0.8rem; 
        }
        .chat-status.connected { 
            color: var(--accent-green); 
        }
        .chat-status.disconnected { 
            color: var(--accent-red); 
        }
        .chat-message-item-wrapper { 
            display: flex; 
            flex-direction: column; 
            max-width: 80%; 
        }
        .msg-sender-name { 
            font-size: 0.75rem; 
            font-weight: bold; 
            color: var(--text-secondary); 
            margin-bottom: 2px; 
        }
        .chat-message-item-wrapper.user-message { 
            align-self: flex-end; 
            align-items: flex-end; 
        }
        .chat-message-item-wrapper.admin-message { 
            align-self: flex-start; 
            align-items: flex-start; 
        }
        .chat-message { 
            max-width: 100%; 
            word-wrap: break-word; 
            padding: 0.5rem 0.75rem; 
            border-radius: 15px; 
            line-height: 1.4; 
        }
        .chat-message .msg-timestamp {
            font-size: 0.7rem;
            margin-top: 4px;
            opacity: 0.7;
            display: block;
            text-align: right;
        }
        .chat-message.user { 
            background-color: var(--accent-pink); 
            color: var(--text-dark); 
            border-bottom-right-radius: 3px; 
        }
        .chat-message.admin { 
            background-color: var(--accent-lavender); 
            color: var(--text-dark); 
            border-bottom-left-radius: 3px; 
        }
        .typing-indicator-container {
            height: 20px;
            padding: 0 1rem;
            box-sizing: border-box;
        }
        .typing-indicator {
            font-style: italic;
            font-size: 0.8rem;
            color: var(--text-secondary);
            animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .read-receipt { 
            margin-left: 5px; 
            color: var(--text-secondary); 
            font-size: 0.8rem;
        }
        .read-receipt.read { 
            color: var(--accent-blue);
            font-weight: bold;
        }
        .read-receipt.sending {
            color: var(--text-secondary);
            font-style: italic;
        }
    `}</style>
);

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const { user: currentUser } = useAuth();
    
    // Get the stable actions object from the context provider.
    const { sendCustomerMessage, emitStartTyping, emitStopTyping } = useWebSocketActions();
    
    // Select each piece of state individually to ensure stability and prevent loops.
    const isConnected = useChatStore(state => state.isConnected);
    const customerChat = useChatStore(state => state.customerChat);
    const typingPeers = useChatStore(state => state.typingPeers);

    const { sessionId, messages } = customerChat;
    
    const [isResumedSession, setIsResumedSession] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (messages?.length > 0 && !isResumedSession) {
            setIsResumedSession(true);
        }
    }, [messages, isResumedSession]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        return () => clearTimeout(typingTimeoutRef.current);
    }, []);

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (sessionId) {
            if (!typingTimeoutRef.current) emitStartTyping(sessionId);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                emitStopTyping(sessionId);
                typingTimeoutRef.current = null;
            }, 1500);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            if (sessionId) emitStopTyping(sessionId);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            
            sendCustomerMessage({ text: newMessage.trim(), sessionId });
            setNewMessage('');
        }
    };
    
    const getMessageStatus = (msg) => {
        if (String(msg.id).startsWith('local-')) return 'sending';
        if (msg.read_at) return 'read';
        return 'sent';
    };

    const peerIsTyping = sessionId && typingPeers[sessionId];

    return (
        <>
            <ChatWidgetStyles />
            <button className="chat-fab" onClick={() => setIsOpen(p => !p)} aria-label="Toggle Chat">
                {isOpen ? '✕' : '💬'}
            </button>
            <div className={`chat-panel ${isOpen ? 'visible' : ''}`}>
                <div className="chat-panel-header">
                    <h3>Support Chat</h3>
                    <button onClick={() => setIsOpen(false)} aria-label="Close Chat">×</button>
                </div>
                <div className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Connecting...'}
                </div>
                <div className="chat-messages-area">
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                            Send a message to start the chat!
                        </div>
                    )}

                    {isResumedSession && (
                        <div className="chat-resume-message">
                            <span>Welcome back!</span>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                         if (!msg || !msg.id) return null;
                         const isAdminMessage = msg.sender_type === 'admin';
                         let isMyMessage = !isAdminMessage;
                         let senderName = isMyMessage ? 'You' : (currentUser?.isAdmin ? 'Admin' : 'Support');
                         const messageStatus = isMyMessage ? getMessageStatus(msg) : null;
 
                         return (
                             <div 
                                 data-message-id={msg.id} 
                                 key={msg.id} 
                                 className={`chat-message-item-wrapper ${isMyMessage ? 'user-message' : 'admin-message'}`}
                                 style={{ opacity: messageStatus === 'sending' ? 0.7 : 1 }}
                             >
                                 <span className="msg-sender-name">{senderName}</span>
                                 <div className={`chat-message ${isMyMessage ? 'user' : 'admin'}`}>
                                     {msg.message_text}
                                     <span className="msg-timestamp">
                                         {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                         {isMyMessage && <span className={`read-receipt ${messageStatus}`}>✓✓</span>}
                                     </span>
                                 </div>
                             </div>
                         );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className="typing-indicator-container">
                    {peerIsTyping && <div className="typing-indicator"><span>Admin is typing...</span></div>}
                </div>
                <div className="chat-input-area">
                    <form onSubmit={handleSend}>
                        <input type="text" className="selectable" placeholder="Type a message..." value={newMessage} onChange={handleTyping} autoFocus />
                        <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>Send</button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ChatWidget;
