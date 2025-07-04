"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * AuthLayout Component
 *
 * This layout component is a client-side guard for authentication pages.
 * It ensures that if a user is already logged in, they are immediately redirected
 * to the main application dashboard. It also handles the loading state during
 * session verification and after a successful sign-in attempt.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the auth state is not loading and a user object exists, redirect them.
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // Show a loading screen while the initial auth check is running,
  // or if a user has just logged in and we are waiting for the redirect.
  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">{loading ? 'Checking session...' : 'Redirecting...'}</p>
      </div>
    );
  }

  // If the auth check is complete and there is no user, render the sign-in/sign-up form.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
