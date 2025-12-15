'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, generateAndStoreJwtToken } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Chrome, Github } from 'lucide-react';
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

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (response.error) {
        toast.error(response.error.message || 'Signup failed');
        setIsLoading(false);
        return;
      }

      // Get session and update store immediately
      const session = await authClient.getSession();
      console.log('Signup session:', session); // Debug log

      // Better Auth returns { data: { user, session }, error }
      const sessionUser = session?.data?.user;

      if (sessionUser) {
        // Generate JWT token for backend API authentication BEFORE updating user
        console.log('[Signup] Generating JWT token...');
        const token = await generateAndStoreJwtToken();
        console.log('[Signup] JWT token generated:', token ? 'SUCCESS' : 'FAILED');

        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          image: sessionUser.image || undefined,
        });
      }

      toast.success('Account created successfully!');
      
      // Use replace to prevent back navigation to signup
      router.replace('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (error: any) {
      toast.error(error.message || 'Google signup failed');
    }
  };

  const handleGithubSignup = async () => {
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/dashboard',
      });
    } catch (error: any) {
      toast.error(error.message || 'GitHub signup failed');
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
            Create Account
          </h1>
          <p className="text-sm tracking-wide" style={{ color: colors.textMuted }}>
            Start your journey with TaskFlow
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
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm tracking-wide" style={{ color: colors.text }}>
                Full Name
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="pl-10"
                  style={{ borderColor: colors.border }}
                />
              </div>
            </div>

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
                  minLength={8}
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
              {isLoading ? 'Creating account...' : 'Create Account'}
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
              onClick={handleGoogleSignup}
              className="w-full"
              style={{ borderColor: colors.border }}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGithubSignup}
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
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium hover:underline"
                style={{ color: colors.goldDark }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
