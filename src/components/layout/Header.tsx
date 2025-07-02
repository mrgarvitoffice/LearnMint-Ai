
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { APP_NAME, NAV_ITEMS } from '@/lib/constants';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutGrid, Palette, LogOut, UserCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React from 'react';
import { SidebarNav } from './SidebarNav';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import InstallPWAButton from '@/components/features/pwa/InstallPWAButton';

const primaryLinksSpec: { title: string; href: string }[] = [
  { title: 'Dashboard', href: '/' },
  { title: 'Generate', href: '/notes' },
  { title: 'Create Test', href: '/custom-test' },
  { title: 'Daily News', href: '/news' },
];

const dropdownLinksSpec: { title: string; href: string }[] = [
  { title: 'Quiz Creator', href: '/quiz' },
  { title: 'Flashcards', href: '/flashcards' },
  { title: 'Library', href: '/library' },
  { title: 'Calculator', href: '/calculator' },
  { title: 'Chatbot', href: '/chatbot' },
  { title: 'Arcade', href: '/arcade' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleThemeToggle = () => {
    playClickSound();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    playClickSound();
    try {
      await signOut(auth);
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
      router.push('/sign-in');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: 'Sign Out Failed', description: 'Could not sign out. Please try again.', variant: 'destructive' });
    }
  };
  
  const handleSignInRedirect = () => {
    playClickSound();
    router.push('/sign-in');
  }

  const handleDropdownItemClick = (action?: () => void) => {
    playClickSound();
    action?.();
  };

  const getUserFirstName = () => {
    if (!user) return null;
    if (user.isAnonymous) return "Guest";
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  };
  const userFirstName = getUserFirstName();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="rounded-lg p-0.5" onClick={() => playClickSound()}>
              <Logo size={28} />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col bg-card text-card-foreground">
              <div className="flex items-center border-b border-border p-4">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary" onClick={() => playClickSound()}>
                    <Logo size={28} />
                    <span>{APP_NAME}</span>
                  </Link>
                </SheetClose>
              </div>
              <div className="flex-1 overflow-y-auto">
                 <SidebarNav items={NAV_ITEMS} />
              </div>
               <div className="mt-auto border-t border-border p-4 space-y-2">
                    <SheetClose asChild>
                        <InstallPWAButton asDropdownItem />
                    </SheetClose>
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base text-foreground" onClick={handleThemeToggle}>
                            <Palette className="h-5 w-5" /> Toggle Theme
                        </Button>
                    </SheetClose>
                    {user && !user.isAnonymous && (
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base text-destructive" onClick={handleSignOut}>
                            <LogOut className="h-5 w-5" /> Sign Out
                        </Button>
                      </SheetClose>
                    )}
                    {user && user.isAnonymous && (
                       <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2.5 rounded-md text-base text-foreground" onClick={handleSignInRedirect}>
                            <LogIn className="h-5 w-5" /> Sign In / Sign Up
                        </Button>
                      </SheetClose>
                    )}
                </div>
          </SheetContent>
        </Sheet>
      </div>

      <Link href="/" className="mr-4 hidden items-center gap-2 md:flex" onClick={() => playClickSound()}>
        <Logo size={32} />
        <span className="font-bold text-xl text-primary">
          {APP_NAME}
        </span>
      </Link>

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

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {userFirstName && (
          <span className="hidden md:flex items-center text-sm text-muted-foreground font-medium">
            Hi, {userFirstName}!
          </span>
        )}

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
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
                  <InstallPWAButton asDropdownItem className="w-full" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDropdownItemClick(handleThemeToggle)} className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Toggle Theme
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {user ? (
          <Link href="/profile" passHref>
            <Button
              variant="ghost"
              className="rounded-full w-9 h-9 p-0 border-2 border-transparent hover:border-primary focus-visible:border-primary"
              onClick={() => playClickSound()}
              aria-label="View Profile"
              asChild 
            >
              <span className="flex items-center justify-center h-full w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User avatar"} />
                  <AvatarFallback>
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">View Profile</span>
              </span>
            </Button>
          </Link>
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
