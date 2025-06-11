import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useChatStore } from '../hooks/useChatStore.js';
import ChatWidget from './ChatWidget.jsx';

// Component to render a dynamic, animated starry background.
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

// Component to inject the primary CSS styles for the main layout.
const FaceliftStyles = () => (
    <style>{`
        .site-container { display: flex; flex-direction: column; min-height: 100vh; }
        main { flex-grow: 1; }
        #stars-container-colorful { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; background: #1a0922; }
        .star { position: absolute; border-radius: 50%; animation: twinkle linear forwards; box-shadow: 0 0 6px 2px currentColor; }
        @keyframes twinkle { 0% { transform: scale(0.5); opacity: 0.5; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.5); opacity: 0; } }
        
        @keyframes dynamic-neon-glow {
            0%, 100% { text-shadow: 0 0 4px #fff, 0 0 8px #fff, 0 0 12px #ff33a1, 0 0 16px #ff33a1, 0 0 20px #ff33a1; }
            50% { text-shadow: 0 0 6px #fff, 0 0 12px #fff, 0 0 18px #c433ff, 0 0 24px #c433ff, 0 0 30px #c433ff; }
        }

        .main-header { position: sticky; top: 0; z-index: 1020; padding: 10px 20px; background: rgba(26, 9, 34, 0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--card-border, #4a1566); display: flex; justify-content: space-between; align-items: center; }
        .logo { font-family: 'Press Start 2P', monospace; text-decoration: none; color: #fff; font-size: 1.1rem; }
        
        .logo-glow {
            animation: dynamic-neon-glow 4s ease-in-out infinite alternate;
        }

        .main-nav { display: flex; align-items: center; gap: 15px; }
        .auth-buttons-container { display: flex; gap: 10px; }
        .cart-icon-button { background: none; border: none; color: #00e6cc; font-size: 1.6rem; cursor: pointer; position: relative; }
        .cart-item-count-badge { position: absolute; top: 0px; right: 0px; background: #ff3366; color: white; font-family: var(--font-sans); font-weight: bold; font-size: 0.7rem; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #1a0922; }

        .menu-toggle-btn { display: none; }
        @media (max-width: 768px) {
            .main-nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background-color: rgba(26, 9, 34, 0.98); flex-direction: column; align-items: stretch; padding: 10px 0; border-top: 1px solid var(--card-border, #4a1566); }
            .main-nav.active { display: flex; }
            .auth-buttons-container { flex-direction: column; width: 100%; padding: 10px; gap: 10px; border-top: 1px solid var(--card-border, #4a1566); margin-top: 10px; }
            .cart-icon-container { margin-left: auto; }
            .menu-toggle-btn { display: flex; flex-direction: column; justify-content: space-around; width: 30px; height: 25px; background: transparent; border: none; cursor: pointer; }
            .menu-toggle-btn span { width: 100%; height: 3px; background-color: white; border-radius: 2px; transition: all 0.3s ease; }
        }
        
        .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(26, 9, 34, 0.7); backdrop-filter: blur(5px); z-index: 1050; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0s 0.3s; }
        .modal-backdrop.active { opacity: 1; visibility: visible; transition: opacity 0.3s ease; }
        .cart-modal { position: fixed; top: 0; right: 0; width: 400px; max-width: 90vw; height: 100%; background-color: #2d0a3d; border-left: 1px solid #4a1566; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35); display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .modal-backdrop.active .cart-modal { transform: translateX(0); }
        .cart-modal-header { padding: 1rem; background-color: #1a0922; border-bottom: 1px solid #4a1566; display: flex; justify-content: space-between; align-items: center; }
        .cart-modal-header h2 { margin: 0; font-family: 'Press Start 2P', monospace; background: linear-gradient(135deg, #ff3366, #00e6cc); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .cart-modal-close-btn { font-size: 1.6rem; color: #ccc; background: none; border: none; cursor: pointer; }
        .cart-modal-body { flex-grow: 1; overflow-y: auto; padding: 1rem; }
        .cart-items-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .cart-item-card { display: flex; gap: 1rem; background-color: rgba(50, 13, 66, 0.4); border-radius: 8px; padding: 0.75rem; border: 1px solid #4a1566; }
        .cart-item-card img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; image-rendering: pixelated; }
        .cart-item-details { flex-grow: 1; display: flex; flex-direction: column; }
        .cart-item-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .cart-item-header h4 { margin: 0; font-size: 0.9rem; font-family: 'Press Start 2P', monospace; }
        .cart-item-remove { font-size: 1rem; color: #ff3366; background: none; border: none; cursor: pointer; line-height: 1; padding: 0 5px; }
        .cart-item-details p { margin: 0.25rem 0; font-size: 0.85rem; }
        .cart-item-actions { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
        .quantity-controls { display: flex; align-items: center; }
        .quantity-controls button { width: 28px; height: 28px; }
        .cart-item-quantity-input { width: 40px; text-align: center; background-color: #1a0922; border: 1px solid #4a1566; color: white; margin: 0 5px; border-radius: 4px; }
        .cart-modal-footer { padding: 1rem; background-color: #1a0922; border-top: 1px solid #4a1566; }
        .cart-summary { background-color: #1a0922; border-radius: 12px; padding: 1rem; border: 1px solid #4a1566; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .total-row { font-size: 1.2rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #4a1566; }

        .site-footer { text-align: center; padding: 2rem; margin-top: 2rem; color: var(--text-secondary, #a9a3b1); font-size: 0.9rem; background-color: transparent; border-top: 1px solid; border-image-source: linear-gradient(90deg, transparent, var(--accent-lavender, #adff2f), transparent); border-image-slice: 1; }
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
                <div className="cart-modal-header"> <h2 className="gradient-text">Your Bag of Holding 🛍️</h2> <button className="cart-modal-close-btn modal-close" aria-label="Close cart" onClick={onClose}>×</button> </div>
                <div className="cart-modal-body"> <div id="cartItemsListDiv" className="cart-items-list"> {cartItems.length > 0 ? cartItems.map(item => ( <div key={item.id} className="cart-item-card"> <img src={item.imageUrl || 'https://placehold.co/80x80/320d42/ffffff?text=Item'} alt={item.name} /> <div className="cart-item-details"> <div className="cart-item-header"><h4 className="text-primary">{item.name}</h4><button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>×</button></div> <p className="text-secondary text-sm">Price: ${parseFloat(item.price).toFixed(2)}</p> <div className="cart-item-actions"> <div className="quantity-controls"> <button className="btn btn-sm btn-outline cart-quantity-decrease" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button> <input type="number" value={item.quantity} className="selectable cart-item-quantity-input" onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} /> <button className="btn btn-sm btn-outline cart-quantity-increase" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button> </div> <span className="cart-item-total-value text-primary">${(item.price * item.quantity).toFixed(2)}</span> </div> </div> </div> )) : (<p className="text-secondary text-center p-lg">Your cart is currently empty.</p>)} </div> </div>
                <div className="cart-modal-footer"> <div className="cart-summary card card-glass"> <div className="summary-row"><span>Subtotal</span><span id="cartSubtotal">${subtotal.toFixed(2)}</span></div> <div className="summary-row total-row"><span className="font-bold">Total</span><span className="gradient-text font-bold" id="cartTotal">${subtotal.toFixed(2)}</span></div> <button id="proceedToCheckoutBtn" className="btn btn-primary-action btn-block" onClick={handleCheckout} disabled={cartItems.length === 0}>Let's Checkout, Hun! 💖</button> </div> </div>
            </div>
        </div>
    );
};

const Footer = () => ( <footer className="site-footer"> <p>© 2025 Realm Maid. All rights reserved, gorgeous!</p> </footer> );

function MainLayout() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { isAuthLoading } = useAuth();
    
    // Select the primitive state value directly to prevent unnecessary re-renders.
    const isConnected = useChatStore(state => state.isConnected);

    return (
        <div className="site-container">
            <StarryBackground />
            <FaceliftStyles />
            <Header onCartClick={() => setIsCartOpen(true)} />
            <main>
                <Outlet />

                {/* --- Temporary Debug Panel (Optional) --- */}
                <div style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '10px',
                    zIndex: '9999',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                }}>
                    <h4 style={{marginTop: 0, borderBottom: '1px solid white', paddingBottom: '5px'}}>Debug State</h4>
                    <p>isAuthLoading: {isAuthLoading ? 'true' : 'false'}</p>
                    <p>isConnected (from ChatStore): {isConnected ? 'true' : 'false'}</p>
                </div>

            </main>
            <Footer />
            <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            
            {/* The ChatWidget is now managed within its own file */}
            <ChatWidget />
        </div>
    );
}

export default MainLayout;
