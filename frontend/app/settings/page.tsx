"use client";

import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-neutral-400">
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Name</label>
                <p className="text-white">{user.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Email</label>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-neutral-400">User ID</label>
                <p className="text-xs text-neutral-500 font-mono">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Preferences</CardTitle>
              <CardDescription className="text-neutral-400">
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-500 text-sm">
                Additional preferences coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
