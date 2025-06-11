import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // Removed Navigate for now
import { getCsrfToken } from './api/csrf';
import { Toaster } from 'react-hot-toast';

// --- Page Imports ---
import MainLayout from './components/MainLayout.jsx'; // We've copied this!
import HomePage from './pages/HomePage.jsx';         // We've copied this!

// --- We have NOT copied these files yet, so we comment them out! ---
// import ProtectedRoute from './components/ProtectedRoute.jsx';
// import LoginPage from './pages/LoginPage.jsx';
// import RegisterPage from './pages/RegisterPage.jsx';
// import ProductsPage from './pages/ProductsPage.jsx';
// import PleaseVerifyPage from './pages/PleaseVerifyPage.jsx';
// import UserDashboardPage from './pages/UserDashboardPage.jsx';
// import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
// import NotFoundPage from './pages/NotFoundPage.jsx';
// import CheckoutPage from './pages/CheckoutPage.jsx';

// --- Dashboard Component Imports (also not copied yet) ---
// import MyOrders from './components/dashboard/MyOrders.jsx';
// import ProfileSettings from './components/dashboard/ProfileSettings.jsx';
// import PaymentMethods from './components/dashboard/PaymentMethods.jsx';
// import MyWishlist from './components/dashboard/MyWishlist.jsx';
// import PixelClickerGame from './components/dashboard/PixelClickerGame.jsx';


function App() {
  useEffect(() => {
    // This is good to keep, it prepares your app's security early!
    getCsrfToken();
  }, []);

  return (
    <>
      <Routes>
        {/* We are only defining the routes for the pages we have copied so far */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          
          {/* Once we copy ProductsPage.jsx, LoginPage.jsx etc., we can uncomment these! */}
          {/* <Route path="/products" element={<ProductsPage />} /> */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/register" element={<RegisterPage />} /> */}
        </Route>

        {/* We will add all the other protected and admin routes back later! */}
        
        {/* It's good to have a catch-all, but let's add NotFoundPage.jsx first */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>

      {/* The Toaster is self-contained, so it's perfectly fine to keep! */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#320d42',
            color: '#ffffff',
            border: '1px solid #4a1566'
          },
        }}
      />
    </>
  );
}

export default App;
