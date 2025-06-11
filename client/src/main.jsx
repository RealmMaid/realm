import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App.jsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketProvider.jsx';

// We put our entire app rendering logic inside this function
const renderApp = () => {
    const queryClient = new QueryClient();

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <WebSocketProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </WebSocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );
};

// --- THIS IS THE SAFETY NET ---
// It checks if the page is still loading.
if (document.readyState === 'loading') {
    // If it is, it waits for the 'DOMContentLoaded' event before running our app.
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    // If the document is already ready, it runs our app immediately.
    renderApp();
}
