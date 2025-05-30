
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from "@/components/ui/toaster";
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LearnMint - AI Powered Learning',
  description: 'AI-powered learning assistant for notes, quizzes, flashcards, and more.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="theme-color" content="#00FFFF" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AppProviders>
          <AuthProvider> {/* Wrap with AuthProvider */}
            <Suspense fallback={null}>
              <TopProgressBar />
            </Suspense>
            {children}
            <Toaster />
          </AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
