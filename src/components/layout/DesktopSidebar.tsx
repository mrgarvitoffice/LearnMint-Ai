
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { ScrollArea } from '../ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function SidebarNavItem({ item, pathname }: { item: NavItem, pathname: string }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all duration-200 hover:text-primary group relative",
        isActive ? "text-primary" : "hover:bg-muted/50"
      )}
    >
      <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span className="whitespace-nowrap font-medium">
        {t(item.title)}
      </span>
       {isActive && (
        <motion.div
          layoutId="active-sidebar-indicator"
          className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
          initial={false}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();
  
  return (
    <aside
      className="fixed top-0 left-0 z-50 h-full w-64 border-r bg-background/80 backdrop-blur-md flex-col hidden md:flex"
    >
      <div className="flex h-16 items-center shrink-0 px-4 border-b">
         <motion.div whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center gap-2.5 font-semibold w-full">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Logo size={32} />
                </motion.div>
                <span className="font-bold text-xl text-foreground whitespace-nowrap">
                  LearnMint
                </span>
            </Link>
         </motion.div>
      </div>

      <ScrollArea className="flex-1 mt-2">
        <nav className="grid items-start p-2 text-sm">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href || item.title} item={item} pathname={pathname} />
          ))}
        </nav>
      </ScrollArea>
      
      <div className="mt-auto p-2 border-t">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className="flex items-center w-full gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={user.isAnonymous ? undefined : user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>
                       {user.isAnonymous ? <User className="h-5 w-5"/> : user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="font-semibold leading-tight">{user.isAnonymous ? "Guest User" : user.displayName || "User"}</span>
                     {!user.isAnonymous && <span className="text-xs text-muted-foreground/80 leading-tight truncate max-w-32">{user.email}</span>}
                  </div>
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
               {!user.isAnonymous && (
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={signOutUser} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
