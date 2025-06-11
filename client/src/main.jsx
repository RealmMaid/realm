import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.jsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketProvider.jsx';

// 1. Add the new imports from React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. Create the client instance
const queryClient = new QueryClient();

// This is the entry point of your application, wrapping the App
// component with all the necessary providers for routing, authentication,
// shopping cart state, and WebSocket connections.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Wrap your existing providers with the QueryClientProvider */}
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
  </React.StrictMode>,
);
