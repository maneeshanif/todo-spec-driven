import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  _hasHydrated: boolean;

  // Actions
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: true, // Start with loading true until hydration
      _hasHydrated: false,

      login: (user, token, refreshToken) => {
        // Also save token separately for axios interceptor (in case zustand hydration is slow)
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token);
          if (refreshToken) {
            localStorage.setItem('refresh-token', refreshToken);
          }
        }

        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          loading: false
        });
      },

      logout: () => {
        // Clear all auth data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('refresh-token');
          // Clear zustand persisted state
          localStorage.removeItem('auth-storage');
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          loading: false
        });
      },

      setLoading: (loading) => set({ loading }),

      setHasHydrated: (state) => {
        set({ _hasHydrated: state, loading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Called when storage is rehydrated
        if (state) {
          state.setHasHydrated(true);
          // Sync token to localStorage for axios interceptor
          if (state.token && typeof window !== 'undefined') {
            localStorage.setItem('auth-token', state.token);
          }
        }
      },
    }
  )
);
