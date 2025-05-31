
// Root Layout for the LearnMint Application
// This is the main layout component that wraps all pages.
// It sets up global styles, fonts, theme provider, query provider, authentication provider, and toaster.

import type { Metadata } from 'next'; // Type for page metadata
import { Geist, Geist_Mono } from 'next/font/google'; // Specific fonts used in the application
import './globals.css'; // Global stylesheet
import { AppProviders } from '@/components/providers/AppProviders'; // Context providers (Theme, Query)
import { Toaster } from "@/components/ui/toaster"; // Component for displaying toast notifications
import { TopProgressBar } from '@/components/layout/TopProgressBar'; // Visual loading indicator for page transitions
import { Suspense } from 'react'; // React Suspense for handling loading states
import { AuthProvider } from '@/contexts/AuthContext'; // Authentication context provider

// Initialize Geist Sans font with variable for Tailwind CSS
const geistSans = Geist({
  variable: '--font-geist-sans', // CSS variable name for Geist Sans
  subsets: ['latin'],             // Character subsets to include
});

// Initialize Geist Mono font with variable for Tailwind CSS
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',   // CSS variable name for Geist Mono
  subsets: ['latin'],               // Character subsets to include
});

// --- Application Metadata ---
// Defines metadata for SEO and PWA (Progressive Web App) features.
export const metadata: Metadata = {
  title: 'LearnMint - AI Powered Learning', // Default title for all pages
  description: 'AI-powered learning assistant for notes, quizzes, flashcards, and more.', // Default description
  manifest: '/manifest.json', // Path to the PWA manifest file
  themeColor: '#00FFFF', // Cyan color, adjust as needed
};

/**
 * RootLayout Component
 * 
 * The top-level layout component for the entire application.
 * It wraps all page content with necessary providers and global elements.
 * 
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The content of the current page.
 * @returns {JSX.Element} The rendered root layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // HTML element with language and suppressed hydration warning (common for Next.js + ThemeProvider)
    <html lang="en" suppressHydrationWarning={true}>
      <head />
      {/* Body element with font classes applied and antialiasing for smoother text */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {/* AppProviders wraps children with ThemeProvider and QueryClientProvider */}
        <AppProviders>
          {/* AuthProvider manages user authentication state */}
          <AuthProvider>
            {/* Suspense for TopProgressBar to allow it to use client-side hooks */}
            <Suspense fallback={null}>
              <TopProgressBar />
            </Suspense>
            {/* Renders the actual page content */}
            {children}
            {/* Toaster component for displaying notifications */}
            <Toaster />
          </AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
