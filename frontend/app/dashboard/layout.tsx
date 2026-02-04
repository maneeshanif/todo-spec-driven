'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/authStore';

// Luxury color palette (Cream theme)
const colors = {
  bg: "#f8f5f0",
  goldDark: "#a08339",
  text: "#1a1a1a",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser, _hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Wait for store to hydrate from localStorage first
    if (!_hasHydrated) {
      return; // Don't check auth until hydration is complete
    }

    // Always verify session with server on dashboard load
    const checkAuth = async () => {
      try {
        // If we already have user in store, trust it
        if (user) {
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }

        // Otherwise check with server
        const session = await authClient.getSession();
        console.log('Dashboard session check:', session); // Debug log

        // Better Auth returns { data: { user, session }, error }
        const sessionUser = session?.data?.user;

        if (sessionUser) {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            image: sessionUser.image || undefined,
          });
          setIsAuthenticated(true);
        } else {
          // No session, redirect to login
          router.replace('/login');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/login');
        return;
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [user, setUser, router, _hasHydrated]);

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: colors.goldDark, borderTopColor: 'transparent' }} />
          <p className="text-sm tracking-[0.2em] uppercase" style={{ color: colors.goldDark }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
