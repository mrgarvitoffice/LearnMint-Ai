
"use client";

import type { ReactNode } from 'react';
import { Header } from './Header';
import { SecondaryNavBar } from './SecondaryNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className="flex flex-1 flex-col">
        <Header />
        <SecondaryNavBar />
        <main className={cn(
          "flex-1 gap-4 p-4 sm:px-6 sm:py-4 overflow-y-auto",
          isMobile ? "pb-20" : "pb-4" // Adjusted padding for mobile after removing bottom nav
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
