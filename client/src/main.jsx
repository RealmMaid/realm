import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App.jsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketProvider.jsx'; // 1. Commented out the import

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
            <CartProvider>
              <WebSocketProvider>
              <App />
              </WebSocketProvider>
            </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
