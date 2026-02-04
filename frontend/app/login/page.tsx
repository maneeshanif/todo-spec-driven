'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, generateAndStoreJwtToken } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Chrome, Github } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  gold: "#c9a962",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        toast.error(response.error.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Get session and update store immediately
      const session = await authClient.getSession();
      console.log('Login session:', session); // Debug log

      // Better Auth returns { data: { user, session }, error }
      const sessionUser = session?.data?.user;

      if (sessionUser) {
        // Generate JWT token for backend API authentication BEFORE updating user
        console.log('[Login] Generating JWT token...');
        const token = await generateAndStoreJwtToken();
        console.log('[Login] JWT token generated:', token ? 'SUCCESS' : 'FAILED');

        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          image: sessionUser.image || undefined,
        });

        // Wait a tick for Zustand persist to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('[Login] User state persisted, ready to navigate');
      }

      toast.success('Login successful!');
      console.log('[Login] Navigating to dashboard...');
      // Use replace to prevent back navigation to login
      router.replace('/dashboard');
      console.log('[Login] Navigation initiated');
    } catch (error: any) {
      console.error('[Login] Login error:', error);
      toast.error(error.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
    }
  };

  const handleGithubLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/dashboard',
      });
    } catch (error: any) {
      toast.error(error.message || 'GitHub login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-4xl font-light mb-2" 
            style={{ color: colors.goldDark, fontFamily: 'serif' }}
          >
            Welcome Back
          </h1>
          <p className="text-sm tracking-wide" style={{ color: colors.textMuted }}>
            Just whisper it, done.
          </p>
        </div>

        {/* Card */}
        <div 
          className="rounded-lg p-8 shadow-lg border"
          style={{ 
            backgroundColor: colors.textLight, 
            borderColor: colors.border 
          }}
        >
          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm tracking-wide" style={{ color: colors.text }}>
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="pl-10"
                  style={{ borderColor: colors.border }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm tracking-wide" style={{ color: colors.text }}>
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10"
                  style={{ borderColor: colors.border }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full tracking-wide uppercase text-sm"
              style={{ 
                backgroundColor: colors.goldDark, 
                color: colors.textLight 
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: colors.border }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2" style={{ backgroundColor: colors.textLight, color: colors.textMuted }}>
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full"
              style={{ borderColor: colors.border }}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGithubLogin}
              className="w-full"
              style={{ borderColor: colors.border }}
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="font-medium hover:underline"
                style={{ color: colors.goldDark }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
