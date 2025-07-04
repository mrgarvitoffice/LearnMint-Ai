
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirection *after* the initial render.
    // It will only run when loading is complete.
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // This block handles the initial render state.
  // It shows a loader while authentication is in progress OR if a user already exists.
  // The useEffect above will handle the redirect, so this just prevents rendering the sign-in page for a logged-in user.
  if (loading || user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">{loading ? 'Verifying session...' : 'Redirecting to dashboard...'}</p>
      </div>
    );
  }
  
  // Only render the sign-in/sign-up forms if loading is false and no user is found.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background/95 p-4"
         style={{
            backgroundImage: `
              radial-gradient(at 0% 0%, hsla(180, 100%, 50%, 0.15) 0px, transparent 50%),
              radial-gradient(at 98% 98%, hsla(170, 100%, 50%, 0.1) 0px, transparent 50%),
              linear-gradient(160deg, #00030a, #071a2d)
            `,
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
         }}
    >
      {children}
    </div>
  );
}
