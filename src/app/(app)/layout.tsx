
"use client"; // This layout uses client-side hooks (useEffect, useRouter, useAuth).

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Custom hook to access authentication state
import { AppLayout } from '@/components/layout/AppLayout'; // The main application layout component (Header, Sidebar)
import { Loader2 } from 'lucide-react'; // Loading spinner icon
import { motion, AnimatePresence } from 'framer-motion';

interface MainAppLayoutProps {
  children: ReactNode; // The content of the specific page being rendered within this layout
}

/**
 * MainAppLayout Component
 * 
 * This layout is the primary guard for all authenticated pages (e.g., Dashboard, Notes).
 * It ensures that only authenticated users can access the main application content.
 */
export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext
  const pathname = usePathname();
  const router = useRouter();

  // Effect to handle redirection for unauthenticated users
  useEffect(() => {
    // Once the initial auth check is complete, if there's no user, redirect to sign-in.
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]); // Dependencies for the effect

  // If the session is still being verified OR if there is no user, show a full-page loader.
  // This prevents the main app content from ever rendering for an unauthenticated user,
  // and it provides a seamless loading experience.
  if (loading || !user) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If loading is complete and a user object exists, render the main application layout.
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
