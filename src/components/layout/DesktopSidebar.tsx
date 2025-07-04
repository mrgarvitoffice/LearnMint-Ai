
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { ScrollArea } from '../ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '../ui/sidebar';

function SidebarNavItem({ item, pathname, isExpanded }: { item: NavItem, pathname: string, isExpanded: boolean }) {
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
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } }}
            exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
            className="whitespace-nowrap font-medium"
          >
            {t(item.title)}
          </motion.span>
        )}
      </AnimatePresence>
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
  const { user } = useAuth();
  const { open, setOpen } = useSidebar();
  
  return (
    <motion.aside
      className="fixed top-0 left-0 z-50 h-full border-r bg-background/80 backdrop-blur-md flex-col hidden md:flex"
      initial={false}
      animate={open ? "open" : "closed"}
      variants={{
        closed: { width: '5rem' },
        open: { width: '16rem' },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
    >
      <div className="flex h-16 items-center shrink-0 px-4 border-b overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 font-semibold w-full">
            <Logo size={32} />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.15 } }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className="font-bold text-xl text-foreground whitespace-nowrap"
                 >
                  LearnMint
                </motion.span>
              )}
            </AnimatePresence>
        </Link>
      </div>

      <ScrollArea className="flex-1 mt-2">
        <nav className="grid items-start p-2 text-sm">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href || item.title} item={item} pathname={pathname} isExpanded={open} />
          ))}
        </nav>
      </ScrollArea>
      
      <div className="mt-auto p-2 border-t overflow-hidden">
        {user && (
          <Link href="/profile" className="flex items-center w-full gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.isAnonymous ? undefined : user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback>
                  {user.isAnonymous ? <User className="h-5 w-5"/> : user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
              </AvatarFallback>
            </Avatar>
             <AnimatePresence>
              {open && (
                <motion.div
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } }}
                   exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
                   className="flex flex-col items-start text-left overflow-hidden"
                 >
                  <span className="font-semibold leading-tight whitespace-nowrap">{user.isAnonymous ? "Guest User" : user.displayName || "User"}</span>
                    {!user.isAnonymous && <span className="text-xs text-muted-foreground/80 leading-tight truncate">{user.email}</span>}
                </motion.div>
              )}
             </AnimatePresence>
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
