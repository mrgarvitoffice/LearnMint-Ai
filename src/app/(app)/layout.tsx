
"use client";

import { useEffect, type ReactNode } from 'react';
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

  useEffect(() => {
    // This effect handles redirection safely after the component has rendered.
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [loading, user, router]);

  // While loading or if there's no user, show a loader.
  // The redirection will be handled by the useEffect hook.
  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If loading is finished and a user exists, render the main application layout.
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
