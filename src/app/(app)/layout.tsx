"use client"; // This layout uses client-side hooks (useEffect, useRouter, useAuth).

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Next.js hook for programmatic navigation
import { useAuth } from '@/contexts/AuthContext'; // Custom hook to access authentication state
import { AppLayout } from '@/components/layout/AppLayout'; // The main application layout component (Header, Sidebar)
import { Loader2 } from 'lucide-react'; // Loading spinner icon

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
  const router = useRouter(); // Initialize router for navigation

  // Effect to handle redirection based on authentication state
  useEffect(() => {
    // If authentication check is complete (not loading) and there's no user, redirect
    if (!loading && !user) {
      router.push('/sign-in'); 
    }
  }, [user, loading, router]); // Dependencies for the effect

  // The primary loading screen is handled by AuthProvider. This guard handles the transition state
  // and ensures no content is rendered until the user session is fully verified.
  if (loading || !user?.uid) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If user is authenticated, render the main application layout with the page content
  return (
    <AppLayout>{children}</AppLayout>
  );
}
