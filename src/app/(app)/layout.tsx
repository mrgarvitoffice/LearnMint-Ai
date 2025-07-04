
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
 * This layout is the primary guard for all authenticated pages (e.g., Dashboard, Notes). It uses the AuthContext to:
 * 1. Redirect unauthenticated users to the sign-in page.
 * 2. Display a loading screen during the initial session verification.
 * This ensures that no authenticated content is ever displayed to an unauthorized user and provides a smooth transition from the initial app load.
 */
export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext
  const pathname = usePathname();
  const router = useRouter(); // Get router instance for smoother navigation

  // Effect to handle redirection based on authentication state
  useEffect(() => {
    // If authentication check is complete (not loading) and there's no user, redirect
    if (!loading && !user) {
      // Use router.replace for a client-side navigation without a full page reload.
      router.replace('/sign-in'); 
    }
  }, [user, loading, router]); // Dependencies for the effect

  // The primary loading screen is handled by AuthProvider. This guard handles the transition state
  // and ensures no content is rendered until the user session is fully verified.
  if (loading) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying your session...</p>
      </div>
    );
  }
  
  // A second check to make sure the user object is truly present before rendering.
  // This can prevent flicker on initial load for authenticated users.
  if (!user) {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Redirecting to sign-in...</p>
      </div>
    );
  }


  // If user is authenticated, render the main application layout with the page content
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
