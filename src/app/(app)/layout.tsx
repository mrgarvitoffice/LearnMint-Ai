
"use client";

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MainAppLayoutProps {
  children: ReactNode;
}

/**
 * MainAppLayout Component
 * 
 * This layout is the primary guard for all authenticated pages (e.g., Dashboard, Notes).
 * It ensures that only authenticated users can access the main application content.
 */
export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 1. If we are still determining the auth state, show a full-page loader.
  // This prevents any rendering of the app or redirects until the user's session is confirmed.
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // 2. If the auth check is complete and there is NO user, redirect to the sign-in page.
  if (!user) {
    // This check ensures router.replace is only called on the client-side.
    if (typeof window !== 'undefined') {
      router.replace('/sign-in');
    }
    // Return a loader to prevent rendering children while the redirect is in progress.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Redirecting to sign-in...</p>
      </div>
    );
  }

  // 3. If we reach here, `loading` is false and `user` exists. Render the main application layout.
  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}
