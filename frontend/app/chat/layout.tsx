'use client';

/**
 * Chat layout - provides the structure for the chat page.
 *
 * Features:
 * - Protected route (requires auth)
 * - Full height layout
 * - Header with title and back navigation
 * - Supports ChatKit with custom ConversationSidebar
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Bot, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // Show nothing while checking auth
  if (!_hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header - hidden on mobile (page has its own mobile header) */}
      <header className="hidden md:flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">TodoBot</h1>
          </div>

          <p className="text-sm text-muted-foreground">
            AI-powered task management
          </p>
        </div>
      </header>

      {/* Main content - ChatKit page */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
