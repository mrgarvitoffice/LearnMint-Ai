
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
 * This layout component wraps all authenticated application pages (e.g., Dashboard, Notes, Quiz).
 * It handles authentication checks:
 * - If the user is not authenticated, it redirects them to the sign-in page.
 * - It displays a loading state while authentication status is being verified.
 * - Once authenticated, it renders the `AppLayout` which includes the header and sidebar navigation,
 *   passing the page's children to be displayed within that main layout.
 */
export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext
  const router = useRouter(); // Initialize router for navigation

  // Effect to handle redirection based on authentication state
  useEffect(() => {
    // If authentication check is complete (not loading) and there's no user
    if (!loading && !user) {
      router.push('/sign-in'); // Redirect to the sign-in page
    }
  }, [user, loading, router]); // Dependencies for the effect

  // Display a loading screen while authentication is being verified
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying Authentication...</p>
      </div>
    );
  }

  // If not loading and still no user, or user object is not fully loaded.
  // This state might be briefly visible before redirection completes.
  if (!user || !user.uid) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Verifying session...</p>
      </div>
    );
  }

  // If user is authenticated, render the main application layout with the page content
  return (
    <AppLayout>{children}</AppLayout>
  );
}
