
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAME, NAV_ITEMS, type NavItem } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { LayoutGrid, PanelLeft, UserCircle, Moon, Sun, Laptop, Palette, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import React from 'react';
import { SidebarNav } from './SidebarNav';

const primaryLinksSpec: { title: string; href: string }[] = [
  { title: 'Dashboard', href: '/' },
  { title: 'Generate', href: '/notes' },
  { title: 'Create Test', href: '/custom-test' },
];

const dropdownLinksSpec: { title: string; href: string }[] = [
  { title: 'Library', href: '/library' },
  { title: 'Calculator', href: '/calculator' },
  { title: 'Chatbot', href: '/chatbot' },
  { title: 'Arcade', href: '/arcade' },
];

export function Header() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleProfileClick = () => {
    toast({
      title: 'Profile Coming Soon!',
      description: 'User profile features are under development.',
    });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="rounded-lg">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
              <div className="flex items-center border-b border-sidebar-border p-4">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-primary">
                    <Logo />
                    <span>{APP_NAME}</span>
                  </Link>
                </SheetClose>
              </div>
              <div className="flex-1 overflow-y-auto">
                 <SidebarNav items={NAV_ITEMS} />
              </div>
               <div className="mt-auto border-t border-sidebar-border p-4 space-y-1">
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground" onClick={toggleTheme}>
                            <Palette className="h-5 w-5" /> Toggle Theme
                        </Button>
                    </SheetClose>
                </div>
          </SheetContent>
        </Sheet>
      </div>

      <Link href="/" className="mr-4 hidden items-center gap-2 md:flex">
        <Logo />
        <span className="font-bold text-xl text-primary">
          {APP_NAME}
        </span>
      </Link>

      <nav className="hidden flex-1 items-center gap-1 md:flex">
        {primaryLinksSpec.map(link => (
           <Button variant="ghost" asChild key={link.href} className={cn(
            "h-9 px-3 py-2",
            pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-primary"
          )}>
            <Link href={link.href}>{link.title}</Link>
          </Button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <LayoutGrid className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {dropdownLinksSpec.map(link => {
                const navItem = NAV_ITEMS.flatMap(item => item.children ? item.children : [item]).find(i => i.href === link.href);
                const Icon = navItem?.icon;
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className={cn("flex items-center gap-2", pathname === link.href && "bg-accent")}>
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      {link.title}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Toggle Theme
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button variant="ghost" size="icon" onClick={handleProfileClick} className="rounded-full">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">User Profile</span>
        </Button>
      </div>
    </header>
  );
}
