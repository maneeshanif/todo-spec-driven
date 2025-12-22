'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { authClient, generateAndStoreJwtToken, syncTokenCookie } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/authStore';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to safely check if we're on client and hydrated
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  
  const hasFetchedSession = useRef(false);
  const isClient = useIsClient();

  useEffect(() => {
    // Sync token cookie on startup (for existing users with token in localStorage)
    if (isClient) {
      syncTokenCookie();
    }

    // Only fetch session once on client, if no user exists in store
    if (isClient && !user && !hasFetchedSession.current) {
      hasFetchedSession.current = true;
      setLoading(true);
      console.log('[AuthContext] Fetching session...');
      authClient.getSession()
        .then(async (sessionData) => {
          console.log('[AuthContext] Session response:', sessionData);

          // Better Auth returns { data: { user, session }, error }
          const sessionUser = sessionData?.data?.user;

          if (sessionUser) {
            console.log('[AuthContext] Session user found:', sessionUser.email);
            console.log('[AuthContext] Generating JWT token...');

            // Generate JWT token for backend API authentication if session exists
            const token = await generateAndStoreJwtToken();
            console.log('[AuthContext] Token generation result:', token ? 'SUCCESS' : 'FAILED');

            // Verify token was stored
            const storedToken = localStorage.getItem('bearer_token');
            console.log('[AuthContext] Token in localStorage:', storedToken ? `YES (${storedToken.length} chars)` : 'NO');

            setUser({
              id: sessionUser.id,
              email: sessionUser.email,
              name: sessionUser.name,
              image: sessionUser.image || undefined,
            });
          } else {
            console.log('[AuthContext] No session user found');
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('[AuthContext] Failed to get session:', error);
          setLoading(false);
        });
    }
  }, [isClient, user, setUser, setLoading]);

  // On server or before hydration, show loading
  // On client, check actual store state
  const isLoading = !isClient || loading;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
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
