import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        console.log("AuthProvider: Starting session check...");

        const checkSession = async () => {
            try {
                const { data } = await API.get('/auth/session', { signal });
                console.log("AuthProvider: Session check API call returned.", data);
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("AuthProvider: The session check API call failed.", error);
                }
            } finally {
                if (!signal.aborted) {
                    console.log("AuthProvider: Finalizing auth check, setting loading to false.");
                    setAuthLoading(false);
                }
            }
        };
        
        checkSession();

        return () => {
            console.log("AuthProvider: Cleanup function running.");
            controller.abort();
        };
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await API.post('/auth/login', { email, password });
            if (data.success && data.user) {
                setUser(data.user);
                if (data.user.isAdmin) navigate('/admin');
                else navigate('/dashboard');
            }
            return data;
        } catch (error) {
            setUser(null);
            throw error.response?.data || new Error('An unknown error occurred.');
        }
    };

    const logout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setUser(null);
            navigate('/');
        }
    };
    
    const register = async (email, password) => {
        try {
            const { data } = await API.post('/auth/register', { email, password });
            if (data.success) {
                navigate(`/please-verify?email=${encodeURIComponent(email)}`);
            }
            return data;
        } catch (error) {
            throw error.response?.data || new Error('An unknown error occurred during registration.');
        }
    };

    const value = {
        user,
        setUser,
        login,
        logout,
        register,
        isAuthLoading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* --- THIS IS THE FIX! --- */}
            {/* We now ALWAYS render the children components. */}
            {/* Other parts of your app (like MainLayout) will use */}
            {/* the 'isAuthLoading' value to decide what to show! */}
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};