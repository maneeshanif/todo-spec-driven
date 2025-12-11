'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !token) {
      // Redirect to login page
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  // Don't render children if not authenticated
  if (!isAuthenticated || !token) {
    return null;
  }

  return <>{children}</>;
}
