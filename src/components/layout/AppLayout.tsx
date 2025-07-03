
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
      <div className="flex min-h-screen w-full bg-muted/40">
        {!isMobile && <DesktopSidebar />}
        <div className="flex flex-1 flex-col">
           <Header />
           <main className={cn(
               "flex-1 gap-4 p-4 sm:px-6 sm:py-4 overflow-y-auto", 
               isMobile ? "pb-32" : "pb-4"
            )}>
                {children}
            </main>
        </div>
        {isMobile && <BottomNavBar />}
      </div>
    </SidebarProvider>
  );
}
