
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
    // This effect handles redirection for fully authenticated (non-guest) users.
    // It will only run when loading is complete and a non-anonymous user is found.
    if (!loading && user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // Show a loader for fully authenticated users who land here, before they are redirected.
  // Do NOT show a loader for guests, as they need to see the sign-in page.
  if (loading || (user && !user.isAnonymous)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">{loading ? 'Verifying session...' : 'Redirecting to dashboard...'}</p>
      </div>
    );
  }
  
  // Only render the sign-in/sign-up forms if loading is false and no user is found,
  // or if the current user is a guest.
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
