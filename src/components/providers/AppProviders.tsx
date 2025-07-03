
"use client";

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
