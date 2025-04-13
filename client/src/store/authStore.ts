import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthStore, UserProfile } from '../types/auth';

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setUser: (user) => set({ user }),

      loginSuccess: (token: string, user: UserProfile) => {
        set({ token, user, isAuthenticated: true, isLoading: false, error: null });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },
    }),
    {
      name: 'auth-storage', // Name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({ token: state.token }), // Only persist the token
    }
  )
);

export default useAuthStore; 