'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SignupForm from '@/components/auth/SignupForm';

// Luxury color palette (Cream theme)
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
};

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative w-full antialiased" style={{ backgroundColor: colors.bg }}>
      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2" style={{ borderColor: colors.goldDark, opacity: 0.3 }} />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2" style={{ borderColor: colors.goldDark, opacity: 0.3 }} />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2" style={{ borderColor: colors.goldDark, opacity: 0.3 }} />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2" style={{ borderColor: colors.goldDark, opacity: 0.3 }} />

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: colors.goldDark }} />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ backgroundColor: "#8b2635" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="text-sm tracking-[0.3em] uppercase transition-colors hover:opacity-70"
              style={{ color: colors.goldDark }}
            >
              ← TaskFlow®
            </Link>
            <h1
              className="text-4xl md:text-5xl font-extralight mt-8 mb-4"
              style={{ color: colors.text, fontFamily: "serif" }}
            >
              Begin Your Journey
            </h1>
            <p className="text-sm tracking-wide" style={{ color: colors.textMuted, fontFamily: "serif", fontStyle: "italic" }}>
              Create your account to get started
            </p>
          </div>

          {/* Signup Form */}
          <div
            className="backdrop-blur-sm border p-8"
            style={{ backgroundColor: `${colors.bgAlt}80`, borderColor: colors.border }}
          >
            <SignupForm
              onSuccess={handleSignupSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {/* Footer */}
          <p className="text-center mt-8 text-sm" style={{ color: colors.textMuted }}>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium transition-colors hover:opacity-70"
              style={{ color: colors.goldDark }}
            >
              Sign in
            </Link>
          </p>

          {/* Credit */}
          <p className="text-center mt-12 text-xs tracking-[0.3em] uppercase" style={{ color: colors.goldDark }}>
            By: maneeshanif
          </p>
        </div>
      </div>
    </div>
  );
}
