// client/src/api/axios.js

import axios from 'axios';
import { getCsrfToken } from './csrf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// The interceptor with the special rule for the csrf-token URL
API.interceptors.request.use(
    async (config) => {
        // This is the most important rule!
        // It lets the request for the token itself pass through without waiting.
        if (config.url === '/auth/csrf-token') {
            return config;
        }

        try {
            const token = await getCsrfToken();
            if (token) {
                config.headers['X-CSRF-Token'] = token;
            }
        } catch (error) {
            console.error("CSRF token could not be attached.", error);
        }
    
        return config;
    }, 
    (error) => {
        return Promise.reject(error);
    }
);

export default API;
