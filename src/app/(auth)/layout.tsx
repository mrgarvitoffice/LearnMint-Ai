
"use client";

import { useEffect, type ReactNode } from 'react';
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

  useEffect(() => {
    // This effect handles redirection safely after the component has rendered.
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  // While loading or if a user exists, show a loader.
  // The redirection will be handled by the useEffect hook.
  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">{loading ? "Checking session..." : "Redirecting..."}</p>
      </div>
    );
  }

  // If loading is finished and there is no user, render the sign-in/sign-up form.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
