
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSound } from '@/hooks/useSound';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useSidebar } from '../ui/sidebar';
import { Button } from '../ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
                "flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-muted group",
                isActive && "bg-muted text-primary"
              )}
            >
              <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary group",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
      <motion.span variants={navItemVariants}>
        {item.title}
      </motion.span>
    </Link>
  );
}

export function DesktopSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === 'expanded';
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);

  const brandTextVariants = {
    expanded: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } },
    collapsed: { opacity: 0, x: -10, transition: { duration: 0.2 } },
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 256 : 80 }}
      className="fixed top-0 left-0 z-50 h-screen border-r bg-background flex-col hidden md:flex"
    >
      <div className="flex h-16 items-center border-b px-4 shrink-0 overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 font-semibold" onClick={playSound}>
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
             <Logo size={32} />
          </motion.div>
          <motion.div
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
            variants={brandTextVariants}
          >
            <span className="font-bold text-xl text-foreground whitespace-nowrap">
              {APP_NAME}
            </span>
          </motion.div>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start p-2 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href || item.title} item={item} pathname={pathname} isExpanded={isExpanded} />
          ))}
        </nav>
      </ScrollArea>
       <div className="mt-auto flex h-16 items-center justify-center border-t p-2">
         <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-10 w-10">
                  {isExpanded ? <PanelLeftClose className="h-5 w-5"/> : <PanelLeftOpen className="h-5 w-5"/>}
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}</p>
              </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </motion.aside>
  );
}
