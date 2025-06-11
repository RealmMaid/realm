import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCart } from '../contexts/CartContext.jsx';
// We don't import the chat things for this test
// import { useChatStore } from '../hooks/useChatStore.js';
// import ChatWidget from './ChatWidget.jsx'; 

// --- (All your sub-components like StarryBackground, Header, etc. are still here) ---
const StarryBackground = () => { /* ... */ };
const FaceliftStyles = () => { /* ... */ };
const Header = ({ onCartClick }) => { /* ... */ };
const ShoppingCart = ({ isOpen, onClose }) => { /* ... */ };
const Footer = () => { /* ... */ };


function MainLayout() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { isAuthLoading } = useAuth();
    
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
            
            {/* --- The ChatWidget is completely gone for Test A --- */}
        </div>
    );
}

export default MainLayout;
