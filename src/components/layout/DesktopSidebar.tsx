
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSound } from '@/hooks/useSound';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Pin, PinOff } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';

const navItemVariants = {
  expanded: { opacity: 1, x: 0 },
  collapsed: { opacity: 0, x: -10 },
};

function SidebarNavItem({ item, pathname, isExpanded }: { item: NavItem, pathname: string, isExpanded: boolean }) {
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const Icon = item.icon;
  const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              onClick={playClickSound}
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-muted",
                isActive && "bg-muted text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{item.title}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={playClickSound}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-5 w-5" />
      <motion.span variants={navItemVariants}>
        {item.title}
      </motion.span>
    </Link>
  );
}

export function DesktopSidebar() {
  const { open, setOpen, state } = useSidebar();
  const isExpanded = state === 'expanded';
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const [isPinned, setIsPinned] = useState(false);

  const handleMouseEnter = () => {
    if (!isPinned) setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) setOpen(false);
  };
  
  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsPinned(!isPinned);
    setOpen(true); // Keep it open when pinning
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 256 : 80 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed top-0 left-0 z-50 h-screen border-r bg-background flex-col hidden md:flex"
    >
      <div className="flex h-16 items-center border-b px-4 shrink-0 overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 font-semibold" onClick={playSound}>
          <Logo size={32} />
          {isExpanded && (
            <motion.span
              variants={navItemVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="font-bold text-xl text-foreground whitespace-nowrap"
            >
              {APP_NAME}
            </motion.span>
          )}
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start p-2 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href || item.title} item={item} pathname={pathname} isExpanded={isExpanded} />
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
                <button
                  onClick={togglePin}
                  className="flex items-center justify-center h-10 w-full rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-muted"
                >
                  {isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                  {isExpanded && (
                     <motion.span variants={navItemVariants} className="ml-3 whitespace-nowrap">
                       {isPinned ? "Unpin" : "Pin Sidebar"}
                     </motion.span>
                  )}
                  <span className="sr-only">{isPinned ? "Unpin sidebar" : "Pin sidebar"}</span>
                </button>
            </TooltipTrigger>
             {!isExpanded && (
                <TooltipContent side="right">
                    <p>{isPinned ? "Unpin Sidebar" : "Pin Sidebar"}</p>
                </TooltipContent>
             )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.aside>
  );
}
