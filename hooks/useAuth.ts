'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login(email, password);
                    const { user, token } = response.data.data;

                    // Store token in localStorage for axios interceptor
                    localStorage.setItem('token', token);

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    return { success: true, message: 'Login berhasil!' };
                } catch (error: any) {
                    set({ isLoading: false });

                    // Handle different error types
                    let message = 'Login gagal. Coba lagi.';
                    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                        message = 'Koneksi jaringan gagal. Pastikan server Laravel berjalan di port 8000.';
                    } else if (error.response?.data?.message) {
                        message = error.response.data.message;
                    } else if (error.message) {
                        message = error.message;
                    }

                    return { success: false, message };
                }
            },

            logout: async () => {
                try {
                    await authApi.logout();
                } catch (error) {
                    // Ignore logout errors
                } finally {
                    localStorage.removeItem('token');
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                    });
                }
            },

            fetchUser: async () => {
                const { token } = get();
                if (!token) return;

                set({ isLoading: true });
                try {
                    const response = await authApi.me();
                    set({
                        user: response.data.data,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    localStorage.removeItem('token');
                }
            },

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => {
                if (token) {
                    localStorage.setItem('token', token);
                } else {
                    localStorage.removeItem('token');
                }
                set({ token });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
);
