
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
      <motion.div 
        className="flex flex-1 flex-col"
        animate={{
            marginLeft: sidebarState === 'expanded' ? '256px' : '80px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Header />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-4 overflow-y-auto">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
