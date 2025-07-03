
"use client";

import type { ReactNode } from 'react';
import { Header } from './Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BottomNavBar } from './BottomNavBar';
import { DesktopSidebar } from './DesktopSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          {!isMobile && <DesktopSidebar />}
          <main className={cn("flex-1 overflow-y-auto", isMobile ? "pb-32" : "pb-4")}>
            {children}
          </main>
        </div>
        {isMobile && <BottomNavBar />}
      </div>
    </SidebarProvider>
  );
}
