
// Root Layout for the LearnMint Application
// This is the main layout component that wraps all pages.
// It sets up global styles, fonts, theme provider, query provider, authentication provider, and toaster.

import type { Metadata, Viewport } from 'next'; // Type for page metadata
import { Space_Grotesk } from 'next/font/google'; // Switched to Space Grotesk font
import './globals.css'; // Global stylesheet
import { AppProviders } from '@/components/providers/AppProviders'; // Context providers (Theme, Query)
import { Toaster } from "@/components/ui/toaster"; // Component for displaying toast notifications
import { TopProgressBar } from '@/components/layout/TopProgressBar'; // Visual loading indicator for page transitions
import { Suspense } from 'react'; // React Suspense for handling loading states
import { AuthProvider } from '@/contexts/AuthContext'; // Authentication context provider

// Initialize Space Grotesk font with variable for Tailwind CSS
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});


// --- Application Metadata ---
// Defines metadata for SEO and PWA (Progressive Web App) features.
export const metadata: Metadata = {
  title: 'LearnMint - AI Powered Learning', // Default title for all pages
  description: 'AI-powered learning assistant for notes, quizzes, flashcards, and more by MrGarvit.',
  manifest: '/manifest.json', // Path to the PWA manifest file
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/icons/icon-192x192.png', // Apple touch icon
    shortcut: '/icons/icon-192x192.png', // General shortcut icon
  },
};

// --- Viewport Configuration ---
// Defines viewport settings, including the theme color for the browser UI.
export const viewport: Viewport = {
  themeColor: [ // Handles theme color for light and dark modes
    { media: '(prefers-color-scheme: light)', color: 'hsl(0 0% 100%)' }, // Light theme (white)
    { media: '(prefers-color-scheme: dark)', color: 'hsl(222 47% 11%)' }  // Dark theme (deep midnight blue)
  ],
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
    <html lang="en" suppressHydrationWarning={true}>
      {/* No explicit <head> tag here; Next.js manages it via the metadata object. */}
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
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
