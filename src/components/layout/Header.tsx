
"use client"; // This component uses client-side hooks (pathname, router, theme, auth)

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Hooks for routing and path info
import { APP_NAME, NAV_ITEMS } from '@/lib/constants'; // App constants and navigation items
import { Logo } from '@/components/icons/Logo'; // App logo component
import { Button } from '@/components/ui/button'; // Button component
// Dropdown menu components from ShadCN UI
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
// Sheet components (for mobile sidebar) from ShadCN UI
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Avatar component
// Lucide icons for UI elements
import { LayoutGrid, PanelLeft, Palette, LogOut, UserCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils'; // Utility for conditional class names
import { useTheme } from 'next-themes'; // Hook for theme management
import React from 'react';
import { SidebarNav } from './SidebarNav'; // Navigation component for the sidebar
import { useSound } from '@/hooks/useSound'; // Hook for playing sound effects
import { useAuth } from '@/contexts/AuthContext'; // Authentication context hook
import { signOut } from 'firebase/auth'; // Firebase sign-out function
import { auth } from '@/lib/firebase/config'; // Firebase auth instance
import { useToast } from '@/hooks/use-toast'; // Hook for displaying toast notifications
import InstallPWAButton from '@/components/features/pwa/InstallPWAButton';

// Primary navigation links displayed directly in the header on larger screens
const primaryLinksSpec: { title: string; href: string }[] = [
  { title: 'Dashboard', href: '/' },
  { title: 'Generate', href: '/notes' }, // Link to the main content generation page
  { title: 'Create Test', href: '/custom-test' },
];

// Links that appear in the "More options" (LayoutGrid icon) dropdown
const dropdownLinksSpec: { title: string; href: string }[] = [
  { title: 'Library', href: '/library' },
  { title: 'Calculator', href: '/calculator' },
  { title: 'Chatbot', href: '/chatbot' },
  { title: 'Arcade', href: '/arcade' },
];

/**
 * Header Component
 *
 * Displays the application's header, including the logo, navigation links,
 * theme toggle, and user profile actions. It adapts for mobile and desktop views.
 */
export function Header() {
  const pathname = usePathname(); // Gets the current URL path
  const router = useRouter(); // Next.js router for navigation
  const { theme, setTheme } = useTheme(); // Hook for managing light/dark theme
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2); // Sound for clicks
  const { user } = useAuth(); // Current authenticated user information
  const { toast } = useToast(); // For displaying notifications

  /**
   * Toggles the color theme between 'dark' and 'light'.
   */
  const handleThemeToggle = () => {
    playClickSound();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  /**
   * Handles user sign-out.
   */
  const handleSignOut = async () => {
    playClickSound();
    try {
      await signOut(auth); // Firebase sign-out
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
      router.push('/sign-in'); // Redirect to sign-in page
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: 'Sign Out Failed', description: 'Could not sign out. Please try again.', variant: 'destructive' });
    }
  };

  /**
   * Redirects guest users to the sign-in page.
   */
  const handleSignInRedirect = () => {
    playClickSound();
    router.push('/sign-in');
  }

  /**
   * Plays a click sound and executes an optional action.
   * Used for dropdown menu items.
   * @param action - An optional function to execute.
   */
  const handleDropdownItemClick = (action?: () => void) => {
    playClickSound();
    action?.(); // Execute the action if provided
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Mobile Menu Trigger (Hamburger Icon) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="rounded-lg" onClick={() => playClickSound()}>
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
              {/* Mobile Sidebar Header */}
              <div className="flex items-center border-b border-sidebar-border p-4">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-primary" onClick={() => playClickSound()}>
                    <Logo size={28} />
                    <span>{APP_NAME}</span>
                  </Link>
                </SheetClose>
              </div>
              {/* Mobile Sidebar Navigation */}
              <div className="flex-1 overflow-y-auto">
                 <SidebarNav items={NAV_ITEMS} />
              </div>
              {/* Mobile Sidebar Footer Actions */}
               <div className="mt-auto border-t border-sidebar-border p-4 space-y-2">
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground" onClick={handleThemeToggle}>
                            <Palette className="h-5 w-5" /> Toggle Theme
                        </Button>
                    </SheetClose>
                    {/* InstallPWAButton will conditionally render itself */}
                    {/* Wrapping in SheetClose asChild ensures the sheet closes after interaction if the button itself doesn't (e.g. if it only shows a toast) */}
                    <SheetClose asChild>
                        <InstallPWAButton />
                    </SheetClose>

                    {user && !user.isAnonymous && (
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground" onClick={handleSignOut}>
                            <LogOut className="h-5 w-5" /> Sign Out
                        </Button>
                      </SheetClose>
                    )}
                    {user && user.isAnonymous && (
                       <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground" onClick={handleSignInRedirect}>
                            <LogIn className="h-5 w-5" /> Sign In / Sign Up
                        </Button>
                      </SheetClose>
                    )}
                </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Logo and App Name */}
      <Link href="/" className="mr-4 hidden items-center gap-2 md:flex" onClick={() => playClickSound()}>
        <Logo size={32} />
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
          )} onClick={() => playClickSound()}>
            <Link href={link.href}>{link.title}</Link>
          </Button>
        ))}
      </nav>

      {/* Right-aligned Header Items */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* InstallPWAButton was here, now removed for desktop header bar */}
        {/* It remains in the SheetContent for mobile */}

        {/* "More Options" Dropdown on desktop */}
        <div className="hidden md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => playClickSound()}>
                <LayoutGrid className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {dropdownLinksSpec.map(link => {
                const navItem = NAV_ITEMS.flatMap(item => item.children ? item.children : [item]).find(i => i.href === link.href);
                const Icon = navItem?.icon;
                return (
                  <DropdownMenuItem key={link.href} asChild onClick={() => handleDropdownItemClick()}>
                    <Link href={link.href} className={cn("flex items-center gap-2", pathname === link.href && "bg-accent")}>
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      {link.title}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDropdownItemClick(handleThemeToggle)} className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Toggle Theme
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full w-9 h-9 p-0 border-2 border-transparent hover:border-primary focus-visible:border-primary" onClick={() => playClickSound()}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User avatar"} />
                  <AvatarFallback>
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 p-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User avatar"} />
                    <AvatarFallback>
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-none truncate max-w-[150px]">
                      {user.isAnonymous ? "Guest User" : (user.displayName || user.email?.split('@')[0] || "User")}
                    </p>
                    {!user.isAnonymous && user.email && (
                      <p className="text-xs leading-none text-muted-foreground truncate max-w-[150px]">
                        {user.email}
                      </p>
                    )}
                     {user.isAnonymous && (
                       <p className="text-xs leading-none text-muted-foreground">Anonymous Session</p>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.isAnonymous ? (
                <DropdownMenuItem onClick={() => handleDropdownItemClick(handleSignInRedirect)} className="text-primary focus:bg-accent focus:text-accent-foreground">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In / Sign Up
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleDropdownItemClick(handleSignOut)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild onClick={() => playClickSound()}>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button variant="default" size="sm" asChild onClick={() => playClickSound()}>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
