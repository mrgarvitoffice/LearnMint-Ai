import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

interface MainAppLayoutProps {
  children: ReactNode;
}

export default function MainAppLayout({ children }: MainAppLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
