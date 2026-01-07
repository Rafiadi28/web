import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Default URL untuk Server Side Rendering (SSR) agar konsisten
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - add auth token & dynamic Base URL fix
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Dynamic URL fix for Client Side:
        // Jika browser diakses via IP (bukan localhost), paksa API request ke IP tersebut
        // Ini memastikan dari HP akan selalu menembak Backend di IP yang sama
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            // Override baseURL jika akses via Network IP (agar tidak fail connect ke localhost HP)
            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                config.baseURL = `http://${hostname}:8000/api/v1`;
            }
        }

        console.log('🚀 API Request to:', config.baseURL || API_BASE_URL, config.url);

        // Get token from localStorage (client-side only)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear auth and redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// API helper functions
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    logout: () =>
        api.post('/auth/logout'),

    me: () =>
        api.get('/auth/me'),

    updateProfile: (data: FormData) =>
        api.put('/auth/profile', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    changePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) =>
        api.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPasswordConfirmation,
        }),
};

export const dashboardApi = {
    get: () => api.get('/dashboard'),
};

export const usersApi = {
    list: (params?: { role?: string; search?: string; per_page?: number }) =>
        api.get('/users', { params }),

    roles: () => api.get('/users/roles'),
};

export const departmentsApi = {
    list: () => api.get('/departments'),
};
