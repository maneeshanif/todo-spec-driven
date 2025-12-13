'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthInitializer component
 * 
 * Handles hydration of auth state from localStorage.
 * This ensures the auth state is properly loaded before any components try to access it.
 * 
 * TODO: Add auto token refresh when backend implements refresh endpoint
 */
export default function AuthInitializer() {
  const { _hasHydrated } = useAuthStore();

  // Simply wait for hydration - zustand persist does the rest
  useEffect(() => {
    if (_hasHydrated) {
      console.log('Auth state hydrated');
    }
  }, [_hasHydrated]);

  return null;
}
