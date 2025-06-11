import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useWebSocketActions } from '../contexts/WebSocketProvider.jsx'; // Make sure this is imported
import ChatWidget from './ChatWidget.jsx';

// --- (Your StarryBackground, FaceliftStyles, Header, ShoppingCart, and Footer components are all perfect and stay here) ---
const StarryBackground = () => {
    const containerRef = useRef(null);
    useEffect(() => {
        const colors = ['#FFD700', '#FF69B4', '#00E6CC', '#ADFF2F', '#EE82EE'];
        const createStar = () => {
            if (!containerRef.current) return;
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 3 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const duration = Math.random() * 2 + 3;
            star.style.animationDuration = `${duration}s`;
            star.addEventListener('animationend', () => star.remove());
            containerRef.current.appendChild(star);
        };
        const intervalId = setInterval(createStar, 200);
        return () => clearInterval(intervalId);
    }, []);
    return <div ref={containerRef} id="stars-container-colorful"></div>;
};

const FaceliftStyles = () => (
    <style>{`
        /* ... all your beautiful facelift styles ... */
    `}</style>
);

const Header = ({ onCartClick }) => {
    const [isNavActive, setIsNavActive] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const { cartItemCount } = useCart();
    return (
        <header className="main-header index-header">
            <Link to="/" className="logo logo-glow">Realm Maid 🎀</Link>
            <button id="menuToggleBtn" className="menu-toggle-btn" aria-label="Toggle Menu" onClick={() => setIsNavActive(!isNavActive)}>
                <span></span><span></span><span></span>
            </button>
            <nav id="mainNav" className={`main-nav ${isNavActive ? 'active' : ''}`}>
                <div id="authButtonsContainer" className="auth-buttons-container">
                    {isAuthenticated ? (<> <Link to={user.isAdmin ? "/admin" : "/dashboard"} className="btn">My Account</Link> <button onClick={logout} className="btn btn-outline">Logout</button> </>) : (<> <Link to="/login" className="btn">Log In</Link> <Link to="/register" className="btn btn-outline">Register</Link> </>)}
                </div>
                <div className="cart-icon-container">
                    <button id="cartIconButton" className="cart-icon-button" aria-label="View Cart" onClick={onCartClick}> 🛒 {cartItemCount > 0 && <span id="cartItemCountBadge" className="cart-item-count-badge">{cartItemCount}</span>} </button>
                </div>
            </nav>
        </header>
    );
}

const ShoppingCart = ({ isOpen, onClose }) => {
    const { cartItems, updateQuantity, removeFromCart } = useCart();
    const navigate = useNavigate();
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const handleCheckout = () => { onClose(); navigate('/checkout'); };
    return (
        <div className={`modal-backdrop ${isOpen ? 'active' : ''}`} id="shoppingCartModalBackdrop" onClick={onClose}>
            <div className="cart-modal" id="shoppingCartModal" onClick={(e) => e.stopPropagation()}>
                {/* ... all your shopping cart JSX ... */}
            </div>
        </div>
    );
};

const Footer = () => ( <footer className="site-footer"> <p>© 2025 Realm Maid. All rights reserved, gorgeous!</p> </footer> );


function MainLayout() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { isAuthLoading } = useAuth();
    // We still use the "on-demand" connect function from our provider
    const { connectSocket } = useWebSocketActions();

    // This is the new, stable logic!
    useEffect(() => {
        // When the authentication check is finished...
        if (!isAuthLoading) {
            // ...THEN we try to connect the websocket.
            // This prevents the race condition with the server cold start.
            console.log("Auth is loaded, attempting to connect socket!");
            connectSocket();
        }
    }, [isAuthLoading, connectSocket]); // This effect runs only when the auth state changes.

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
            
            {/* Now, we only need to wait for auth to finish before showing the widget. */}
            {/* The widget itself and its provider will handle the connection state internally. */}
            {!isAuthLoading && <ChatWidget />}
        </div>
    );
}

export default MainLayout;
