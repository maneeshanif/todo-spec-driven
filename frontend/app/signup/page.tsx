'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SignupForm from '@/components/auth/SignupForm';
import { BackgroundBeams } from '@/components/ui/background-beams';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupSuccess = () => {
    // Redirect to dashboard after successful signup
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
              Create Account
            </h1>
            <p className="text-neutral-400">
              Get started with your free account today
            </p>
          </div>

          {/* Signup Form */}
          <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-8">
            <SignupForm
              onSuccess={handleSignupSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {/* Footer */}
          <p className="text-center text-neutral-400 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
