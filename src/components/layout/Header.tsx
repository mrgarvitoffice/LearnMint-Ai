
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
import { LayoutGrid, PanelLeft, UserCircle, Moon, Sun, Laptop, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import React from 'react';

// Define primary and dropdown links based on the spec
const primaryLinksSpec: { title: string; href: string }[] = [
  { title: 'Dashboard', href: '/' },
  { title: 'Generate', href: '/notes' }, // Assuming "Generate" maps to "Note Generator" page
  { title: 'Create Test', href: '/custom-test' },
];

const dropdownLinksSpec: { title: string; href: string }[] = [
  { title: 'Library', href: '/library' },
  { title: 'Calculator', href: '/calculator' },
  { title: 'Chatbot', href: '/chatbot' },
  { title: 'Arcade', href: '/arcade' }, // "Game" in spec maps to "Arcade"
];

// Helper to find NavItem from NAV_ITEMS for icons
const findNavItemByTitleOrHref = (titleOrHref: string, searchBy: 'title' | 'href'): NavItem | undefined => {
  for (const item of NAV_ITEMS) {
    if (searchBy === 'title' && item.title === titleOrHref) return item;
    if (searchBy === 'href' && item.href === titleOrHref) return item;
    if (item.children) {
      for (const child of item.children) {
        if (searchBy === 'title' && child.title === titleOrHref) return child;
        if (searchBy === 'href' && child.href === titleOrHref) return child;
      }
    }
  }
  // Specific fallbacks if titles in spec don't match NAV_ITEMS titles directly
  if (titleOrHref === 'Generate' && searchBy === 'title') return NAV_ITEMS.flatMap(i => i.children || i).find(i => i.href === '/notes');
  if (titleOrHref === 'Create Test' && searchBy === 'title') return NAV_ITEMS.find(i => i.href === '/custom-test');
  if (titleOrHref === 'Arcade' && searchBy === 'title') return NAV_ITEMS.find(i => i.href === '/arcade');
  return undefined;
};


export function Header() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const handleProfileClick = () => {
    toast({
      title: 'Profile Coming Soon!',
      description: 'User profile features are under development.',
    });
  };

  const renderNavLink = (link: { title: string; href: string; icon?: LucideIcon }, isMobileSheet: boolean = false, isMobileSheetHeader: boolean = false) => {
    const Icon = link.icon;
    const isActive = pathname === link.href;

    if (isMobileSheetHeader) {
      return (
         <div key={link.title} className="pt-3 pb-1 px-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground/80">
                {Icon && <Icon className="h-4 w-4"/>} {link.title.trim()}
            </h4>
        </div>
      )
    }

    return (
      <Link
        href={link.href}
        key={link.href}
        className={cn(
          "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
          isActive ? "text-primary" : "text-muted-foreground",
          isMobileSheet && "px-3 py-2.5 rounded-md text-base hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {Icon && isMobileSheet && <Icon className="h-5 w-5" />}
        {link.title.trim()}
      </Link>
    );
  };
  
  const allNavLinksForMobile: Array<NavItem & { isHeader?: boolean, originalTitle?: string }> = [];
  NAV_ITEMS.forEach(item => {
    if (item.children && item.children.length > 0) {
        allNavLinksForMobile.push({ ...item, originalTitle: item.title, isHeader: true }); 
        item.children.forEach(child => {
            allNavLinksForMobile.push({ ...child, title: child.title }); 
        });
    } else if (item.href !== '#') { // Direct link, not a parent placeholder
        allNavLinksForMobile.push(item);
    }
  });


  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="rounded-lg">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
              <div className="flex items-center border-b p-4">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
                    <Logo />
                    <span>{APP_NAME}</span>
                  </Link>
                </SheetClose>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
                {allNavLinksForMobile.map((item) => {
                  if (item.isHeader) {
                    return renderNavLink({ title: item.originalTitle || item.title, href: '#', icon: item.icon }, true, true);
                  }
                  return (
                    <SheetClose asChild key={item.href}>
                      {renderNavLink({ title: item.title, href: item.href, icon: item.icon }, true)}
                    </SheetClose>
                  );
                })}
              </nav>
               <div className="mt-auto border-t p-4 space-y-1">
                    <div className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground/80">Theme</div>
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base hover:bg-accent hover:text-accent-foreground" onClick={() => setTheme('light')}>
                            <Sun className="h-5 w-5" /> Light
                        </Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base hover:bg-accent hover:text-accent-foreground" onClick={() => setTheme('dark')}>
                            <Moon className="h-5 w-5" /> Dark
                        </Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base hover:bg-accent hover:text-accent-foreground" onClick={() => setTheme('system')}>
                            <Laptop className="h-5 w-5" /> System
                        </Button>
                    </SheetClose>
                </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Brand */}
      <Link href="/" className="mr-4 hidden items-center gap-2 md:flex">
        <Logo />
        <span className="font-bold text-xl text-primary">
          {APP_NAME}
        </span>
      </Link>

      {/* Desktop Primary Navigation */}
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
        {/* Desktop More Options Dropdown */}
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
                const navItem = findNavItemByTitleOrHref(link.href, 'href');
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
              <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2">
                <Sun className="h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2">
                <Moon className="h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2">
                <Laptop className="h-4 w-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Profile Icon */}
        <Button variant="ghost" size="icon" onClick={handleProfileClick} className="rounded-full">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">User Profile</span>
        </Button>
      </div>
    </header>
  );
}

