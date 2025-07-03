
"use client";

import type { ReactNode } from 'react';
import { Header } from './Header';
import { DesktopSidebar } from './DesktopSidebar';
import { TopMobileNav } from './TopMobileNav';
import { BottomMobileNav } from './BottomMobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { state: sidebarState } = useSidebar();

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <TopMobileNav />
        <main className="flex-1 overflow-y-auto p-4 pt-20 pb-20">
          {children}
        </main>
        <BottomMobileNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <DesktopSidebar />
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300 ease-in-out",
        sidebarState === 'expanded' ? "md:ml-64" : "md:ml-20"
      )}>
        <Header />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
