
"use client";

import { type ReactNode, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { DesktopSidebar } from './DesktopSidebar';
import { TopMobileNav } from './TopMobileNav';
import { BottomMobileNav } from './BottomNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';
import { Loader2 } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { open } = useSidebar();
  const pathname = usePathname();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsPageLoading(true);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 600); // Duration for the loading overlay
      prevPathnameRef.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const mainContent = (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        className={cn("flex-1", isMobile ? "overflow-y-auto pt-32 pb-20 px-4" : "p-4 sm:p-6")}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );

  const loadingOverlay = (
    <AnimatePresence>
      {isPageLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        {loadingOverlay}
        <TopMobileNav /> 
        {mainContent}
        <BottomMobileNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background/80">
      {loadingOverlay}
      <DesktopSidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          open ? "md:ml-64" : "md:ml-20"
        )}
      >
        <Header />
        {mainContent}
      </div>
    </div>
  );
}
