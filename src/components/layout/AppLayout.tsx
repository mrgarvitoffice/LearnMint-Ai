
"use client";

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { DesktopSidebar } from './DesktopSidebar';
import { TopMobileNav } from './TopMobileNav';
import { BottomMobileNav } from './BottomNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { open } = useSidebar();
  const pathname = usePathname();

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <TopMobileNav /> 
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            className="flex-1 overflow-y-auto pt-32 pb-20 px-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <BottomMobileNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background/80">
      <DesktopSidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          open ? "md:ml-64" : "md:ml-20"
        )}
      >
        <Header />
        <AnimatePresence mode="wait">
           <motion.main
              key={pathname}
              className="flex-1 p-4 sm:p-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {children}
            </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
