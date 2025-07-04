
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * AuthLayout Component
 *
 * This layout component is a client-side guard for authentication pages.
 * It ensures that if a user is already logged in, they are immediately redirected
 * to the main application dashboard, preventing them from seeing the sign-in/sign-up forms.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 1. If we are still verifying the session, show a loading screen.
  // This prevents the sign-in form from flashing for authenticated users.
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Checking session...</p>
      </div>
    );
  }

  // 2. If the auth check is complete and a user object EXISTS, redirect them away.
  if (user) {
    // This check ensures router.replace is only called on the client-side.
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    // Return a loader to prevent rendering the sign-in form while redirecting.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Redirecting...</p>
      </div>
    );
  }

  // 3. If the auth check is complete and there is NO user, render the sign-in/sign-up form.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
