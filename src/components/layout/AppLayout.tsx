
"use client";

import type { ReactNode } from 'react';
import { Header } from './Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BottomNavBar } from './BottomNavBar';
import { SecondaryNavBar } from './SecondaryNavBar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <SecondaryNavBar />
        <main className="flex-1 overflow-y-auto pb-32 md:pb-0">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </SidebarProvider>
  );
}
