import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authClient, generateAndStoreJwtToken, clearJwtToken } from '@/lib/auth-client';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setHydrated: () => void;
}

// Auth store compatible with Better Auth
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false, // Start with false - loading only when actively fetching
      _hasHydrated: false,
      
      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: !!user,
          loading: false 
        }),
      
      setLoading: (loading) => set({ loading }),
      
      login: async (email: string, password: string) => {
        console.log('[AuthStore] Login started for:', email);
        set({ loading: true });

        // CRITICAL: Clear any existing tokens BEFORE login to prevent stale token usage
        clearJwtToken();
        console.log('[AuthStore] Cleared old tokens before login');

        try {
          // Use Better Auth sign in
          console.log('[AuthStore] Calling authClient.signIn.email...');
          const response = await authClient.signIn.email({
            email,
            password,
          });

          console.log('[AuthStore] SignIn response:', response);

          if (response.error) {
            throw new Error(response.error.message);
          }

          // Get session after successful login
          console.log('[AuthStore] Getting session...');
          const session = await authClient.getSession();
          console.log('[AuthStore] Session:', session);

          if (session?.data?.user) {
            // Generate JWT token for backend API authentication
            console.log('[AuthStore] Generating JWT token...');
            const jwtToken = await generateAndStoreJwtToken();
            console.log('[AuthStore] JWT token result:', jwtToken ? `SUCCESS (${jwtToken.length} chars)` : 'FAILED');

            // Verify it's in localStorage
            const storedToken = localStorage.getItem('bearer_token');
            console.log('[AuthStore] Token in localStorage after login:', storedToken ? 'YES' : 'NO');

            set({
              user: {
                id: session.data.user.id,
                email: session.data.user.email,
                name: session.data.user.name || email,
                image: session.data.user.image || undefined,
              },
              token: jwtToken,
              isAuthenticated: true,
              loading: false,
            });
            console.log('[AuthStore] Login complete, user set');
          }
        } catch (error: any) {
          console.error('[AuthStore] Login error:', error);
          set({ loading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string, name: string) => {
        console.log('[AuthStore] Signup started for:', email);
        set({ loading: true });

        // CRITICAL: Clear any existing tokens BEFORE signup to prevent stale token usage
        clearJwtToken();
        console.log('[AuthStore] Cleared old tokens before signup');

        try {
          // Use Better Auth sign up
          const response = await authClient.signUp.email({
            email,
            password,
            name,
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          // Get session after successful signup
          const session = await authClient.getSession();

          if (session?.data?.user) {
            // Generate JWT token for backend API authentication
            const jwtToken = await generateAndStoreJwtToken();

            set({
              user: {
                id: session.data.user.id,
                email: session.data.user.email,
                name: session.data.user.name || name,
                image: session.data.user.image || undefined,
              },
              token: jwtToken,
              isAuthenticated: true,
              loading: false,
            });
          }
        } catch (error: any) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        console.log('[AuthStore] Logout started...');

        try {
          console.log('[AuthStore] Calling authClient.signOut()...');
          await authClient.signOut();
          console.log('[AuthStore] signOut completed');
        } catch (error) {
          console.error('[AuthStore] Logout error:', error);
        }

        // IMPORTANT: First reset the Zustand state (this will persist null values)
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false
        });
        console.log('[AuthStore] State reset');

        // Then clear localStorage AFTER state is set (to avoid race condition)
        // Use setTimeout to ensure Zustand persist has completed
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('bearer_token');
            localStorage.removeItem('auth-storage');
            console.log('[AuthStore] LocalStorage cleared');
          }
        }, 100);

        console.log('[AuthStore] Logout complete');
      },
      
      setHydrated: () => set({ _hasHydrated: true, loading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user-related state, not loading flags
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Hydration error:', error);
        }
        // Always mark as hydrated after rehydration attempt
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
);

// Hook to handle hydration properly in Next.js
export const useHydration = () => {
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  // This runs on mount (client-side only)
  if (typeof window !== 'undefined' && !_hasHydrated) {
    // Force hydration flag after a microtask
    Promise.resolve().then(() => {
      setHydrated();
    });
  }
  
  return _hasHydrated;
};
