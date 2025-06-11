import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useChatStore } from '../hooks/useChatStore.js';
import { useWebSocketActions } from '../contexts/WebSocketProvider.jsx';
import ChatWidget from './ChatWidget.jsx';

// --- Your sub-components like StarryBackground, Header, etc. are perfect. ---
const StarryBackground = () => { /* ... */ };
const FaceliftStyles = () => { /* ... */ };
const Header = ({ onCartClick }) => { /* ... */ };
const ShoppingCart = ({ isOpen, onClose }) => { /* ... */ };
const Footer = () => { /* ... */ };


function MainLayout() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { isAuthLoading } = useAuth();
    const { connectSocket } = useWebSocketActions();

    // --- The Smarter Logic! ---
    // 1. We get the connection status directly from our chat store.
    const { isConnected } = useChatStore(state => ({
        isConnected: state.isConnected,
    }));

    // 2. We still have the effect that starts the connection after auth is loaded.
    useEffect(() => {
        if (!isAuthLoading) {
            connectSocket();
        }
    }, [isAuthLoading, connectSocket]);

    return (
        <div className="site-container">
            <StarryBackground />
            <FaceliftStyles />
            <Header onCartClick={() => setIsCartOpen(true)} />
            <main>
                <Outlet />
            </main>
            <Footer />
            <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            
            {/* 3. This is the final, most stable way to render the widget! */}
            {/* It waits for auth to be done AND for the socket to confirm it's connected. */}
            {!isAuthLoading && isConnected && <ChatWidget />}
        </div>
    );
}

export default MainLayout;
