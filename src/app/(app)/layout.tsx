
"use client"; // Required for useEffect and useRouter

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

interface MainAppLayoutProps {
  children: ReactNode;
}

export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying Authentication...</p>
      </div>
    );
  }

  if (!user) {
    // This will briefly show before redirect, or if redirect fails.
    // Or, you can return null or a more specific "redirecting" message.
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Redirecting to sign in...</p>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
