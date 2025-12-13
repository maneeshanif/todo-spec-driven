'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signup } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingButton } from '@/components/LoadingSpinner';

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
};

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function SignupForm({ onSuccess, isLoading, setIsLoading }: SignupFormProps) {
  const [error, setError] = useState<string>('');
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await signup(data);
      login(response.user, response.access_token, response.refresh_token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="border p-3 text-sm" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" }}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-xs tracking-wider uppercase mb-2" style={{ color: colors.textMuted }}>
          Full Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="w-full px-4 py-3 border transition-all focus:outline-none"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text
          }}
          placeholder="John Doe"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm" style={{ color: "#dc2626" }}>{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-xs tracking-wider uppercase mb-2" style={{ color: colors.textMuted }}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-4 py-3 border transition-all focus:outline-none"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text
          }}
          placeholder="you@example.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm" style={{ color: "#dc2626" }}>{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-xs tracking-wider uppercase mb-2" style={{ color: colors.textMuted }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="w-full px-4 py-3 border transition-all focus:outline-none"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text
          }}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm" style={{ color: "#dc2626" }}>{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs" style={{ color: colors.textMuted, fontStyle: "italic" }}>
          Must be at least 8 characters long
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 text-xs tracking-[0.3em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
      >
        {isLoading ? <LoadingButton /> : 'Create Account'}
      </button>
    </form>
  );
}
