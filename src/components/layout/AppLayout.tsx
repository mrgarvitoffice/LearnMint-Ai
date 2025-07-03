
"use client";

import type { ReactNode } from 'react';
import { Header } from './Header';
import { DesktopSidebar } from './DesktopSidebar';
import { TopMobileNav } from './TopMobileNav';
import { BottomMobileNav } from './BottomNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Logo } from '@/components/icons/Logo';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { state: sidebarState, toggleSidebar } = useSidebar();

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <TopMobileNav /> 
        <main className="flex-1 overflow-y-auto p-4 pt-32 pb-20">
          {children}
        </main>
        <BottomMobileNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col">
          <Header onSidebarToggle={toggleSidebar} sidebarState={sidebarState} />
          <main 
            className="flex-1 gap-4 p-4 sm:px-6 sm:py-4 overflow-y-auto transition-[margin-left] duration-300 ease-in-out"
            style={{ marginLeft: sidebarState === 'expanded' ? '256px' : '80px' }}
          >
            {children}
          </main>
      </div>
    </div>
  );
}
