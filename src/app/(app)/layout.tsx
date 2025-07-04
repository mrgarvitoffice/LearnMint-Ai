
"use client";

import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // This effect handles redirection *after* the initial render.
    // It will only run when loading is complete.
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  // This block handles the initial render state.
  // It shows a loader while authentication is in progress OR if there is no user.
  // The useEffect above will handle the redirect, so this just prevents rendering the children prematurely.
  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // Only render the main app layout and children if loading is false and a user exists.
  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="flex-1"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </AppLayout>
  );
}
