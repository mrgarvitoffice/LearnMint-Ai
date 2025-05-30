
"use client";

import type { ReactNode } from 'react';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import { Header } from './Header';
// SidebarNav is not directly used here anymore but might be used by Header's mobile sheet
// import { SidebarNav } from './SidebarNav'; 
import {
  SidebarProvider,
  // Sidebar, // Removed
  // SidebarHeader, // Removed
  // SidebarContent, // Removed
  // SidebarFooter, // Removed
  SidebarInset,
  // SidebarTrigger, // Removed (desktop trigger was part of Sidebar component)
} from '@/components/ui/sidebar';
import { Logo } from '../icons/Logo';
import Link from 'next/link';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen > {/* Kept for mobile menu context from Header -> SidebarNav */}
      {/* The main <Sidebar> component is removed to eliminate the left panel */}
      {/* 
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <Logo />
            <Link href="/" className="text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">
              {APP_NAME}
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2 pr-0">
          <SidebarNav items={NAV_ITEMS} />
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} {APP_NAME}
        </SidebarFooter>
      </Sidebar> 
      */}
      <SidebarInset className="flex flex-col min-h-screen"> {/* SidebarInset will now take full width */}
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
