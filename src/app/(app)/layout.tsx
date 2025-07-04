
"use client";

import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface MainAppLayoutProps {
  children: ReactNode;
}

/**
 * MainAppLayout Component
 * 
 * This layout wraps all pages inside the main application.
 * It provides the consistent sidebar and header structure via AppLayout.
 * Authentication guards have been removed to allow for integration of a new auth provider.
 */
export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const pathname = usePathname();

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}
