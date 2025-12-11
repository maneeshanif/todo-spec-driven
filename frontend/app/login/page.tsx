'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { BackgroundBeams } from '@/components/ui/background-beams';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = () => {
    // Redirect to dashboard after successful login
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative w-full bg-neutral-950 antialiased">
      <BackgroundBeams className="absolute inset-0" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="text-2xl font-bold text-white hover:text-neutral-300 transition-colors"
            >
              ← Todo App
            </Link>
            <h1 className="text-4xl font-bold text-white mt-6 mb-2">
              Welcome Back
            </h1>
            <p className="text-neutral-400">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-8">
            <LoginForm
              onSuccess={handleLoginSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {/* Footer */}
          <p className="text-center text-neutral-400 mt-6">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
