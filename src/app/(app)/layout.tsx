
"use client";

import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface MainAppLayoutProps {
  children: ReactNode;
}

/**
 * MainAppLayout Component - Authenticated Route Guard
 * 
 * This layout wraps all pages inside the main application.
 * It ensures that only authenticated users can access these pages.
 * If a user is not logged in, it redirects them to the sign-in page.
 */
export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // This effect runs after rendering to handle redirection safely.
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  if (!user) {
    // While the useEffect handles the redirect, we return a loader here
    // to prevent any child content from flashing before the redirect happens.
    return (
       <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Redirecting to sign-in...</p>
      </div>
    );
  }

  // If loading is complete and a user exists, render the app layout.
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
