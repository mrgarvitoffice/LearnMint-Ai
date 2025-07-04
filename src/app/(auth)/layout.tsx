
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * AuthLayout Component - Public Route Guard
 *
 * This layout component wraps authentication-related pages (sign-in, sign-up).
 * It ensures that authenticated users cannot access these pages and redirects them
 * to the main dashboard instead.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect runs after rendering to handle redirection safely.
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Checking session...</p>
      </div>
    );
  }

  if (user) {
    // While the useEffect handles the redirect, we return a loader here
    // to prevent the auth form from flashing before the redirect happens.
    return (
       <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Already signed in, redirecting...</p>
      </div>
    );
  }
  
  // If loading is complete and no user exists, render the auth page.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
