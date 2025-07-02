
"use client";

import type { ReactNode } from 'react';
import { Header } from './Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-card md:flex">
          <div className="flex h-16 items-center border-b px-6">
            <Header />
          </div>
          <ScrollArea className="flex-1">
            <SidebarNav items={NAV_ITEMS} />
          </ScrollArea>
        </aside>
        <div className="flex flex-1 flex-col md:pl-64">
           <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 md:hidden">
              <Header />
           </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
