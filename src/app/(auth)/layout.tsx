
"use client";

import type { ReactNode } from 'react';

/**
 * AuthLayout Component
 *
 * This layout component wraps authentication-related pages.
 * The previous auth-guard logic has been removed to prepare for a new auth provider.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  // This layout simply renders the children (e.g., sign-in/sign-up pages)
  // in a centered container.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
