
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';

import { cn } from '@/lib/utils';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LogOut, UserCircle, ShieldQuestion } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useSidebar } from '../ui/sidebar';

function SidebarNavItem({ item, pathname }: { item: NavItem, pathname: string }) {
    const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
    const { setOpenMobile, isMobile } = useSidebar();
    
    const handleItemClick = () => {
      playClickSound();
      if (isMobile) {
        setOpenMobile(false);
      }
    };

    const Icon = item.icon;
    const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

    return (
        <Link
            href={item.href}
            onClick={handleItemClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50",
                isActive && "bg-muted text-primary"
            )}
        >
            <Icon className="h-4 w-4" />
            {item.title}
        </Link>
    );
}

function SidebarNavGroup({ item, pathname }: { item: NavItem, pathname: string }) {
    const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
    const Icon = item.icon;
    const isGroupActive = item.children?.some(child => pathname.startsWith(child.href)) ?? false;

    return (
        <Accordion type="single" collapsible className="w-full" defaultValue={isGroupActive ? item.title : undefined}>
            <AccordionItem value={item.title} className="border-b-0">
                <AccordionTrigger
                    onClick={playClickSound}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:no-underline hover:text-primary hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180",
                        isGroupActive && "text-primary bg-muted"
                    )}
                >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.title}</span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-4">
                        {item.children?.map((child) => <SidebarNavItem key={child.href} item={child} pathname={pathname} />)}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}


export function DesktopSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);

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
  
  const getUserFirstName = () => {
    if (!user) return "User";
    if (user.isAnonymous) return "Guest User";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };
  const userName = getUserFirstName();

  return (
    <aside className="w-64 border-r bg-background/95 flex-col h-screen sticky top-0 hidden md:flex">
        <div className="flex h-16 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
                <Logo size={32} />
                <span className="font-bold text-xl text-foreground">{APP_NAME}</span>
            </Link>
        </div>
        <ScrollArea className="flex-1">
            <nav className="grid items-start p-2 text-sm font-medium">
                {NAV_ITEMS.map((item) => (
                    item.children?.length 
                        ? <SidebarNavGroup key={item.title} item={item} pathname={pathname} />
                        : <SidebarNavItem key={item.href} item={item} pathname={pathname} />
                ))}
            </nav>
        </ScrollArea>
        <div className="mt-auto p-4 border-t">
            {user ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
                            <AvatarFallback>
                                {user.isAnonymous ? <ShieldQuestion /> : user.displayName ? user.displayName.charAt(0) : <UserCircle />}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">{userName}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button asChild className="w-full">
                    <Link href="/sign-in">Sign In</Link>
                </Button>
            )}
        </div>
    </aside>
  );
}
