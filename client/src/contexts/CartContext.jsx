import React, { createContext, useState, useContext, useEffect } from 'react';

// A default value to act as a safety net!
const defaultCartValue = {
    cartItems: [],
    addToCart: () => console.warn('addToCart called outside of CartProvider'),
    removeFromCart: () => console.warn('removeFromCart called outside of CartProvider'),
    updateQuantity: () => console.warn('updateQuantity called outside of CartProvider'),
    cartItemCount: 0
};

const CartContext = createContext(defaultCartValue);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        let storedCart = localStorage.getItem('realmMaidCartForCheckout');
        if (!storedCart) {
            storedCart = localStorage.getItem('realmMaidCart');
        }
        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart);
                if (Array.isArray(parsedCart)) {
                    setCartItems(parsedCart);
                }
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('realmMaidCart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity: quantity } : item
                )
            );
        }
    };
    
    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartItemCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};