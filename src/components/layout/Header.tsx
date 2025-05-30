
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { ThemeToggle } from './ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger asChild>
           <Button size="icon" variant="outline">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SidebarTrigger>
      </div>
      <div className="flex items-center gap-2">
        <Logo />
        <Link href="/" className="text-xl font-bold text-primary">
          {APP_NAME}
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
