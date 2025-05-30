
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from "@/components/ui/toaster";
import { TopProgressBar } from '@/components/layout/TopProgressBar'; // Added import
import { Suspense } from 'react'; // Added import for Suspense if TopProgressBar needs it

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AppProviders>
          <Suspense fallback={null}> {/* Suspense for client components like TopProgressBar */}
            <TopProgressBar />
          </Suspense>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
