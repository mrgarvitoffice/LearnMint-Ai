
"use client";

import type { ReactNode } from 'react';
import { Header } from './Header';
import { DesktopSidebar } from './DesktopSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { MobileSecondaryNav } from './MobileSecondaryNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <MobileSecondaryNav />
        <main className="flex-1 gap-4 p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className={cn(
          "flex-1 gap-4 p-4 sm:px-6 sm:py-4 overflow-y-auto"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
