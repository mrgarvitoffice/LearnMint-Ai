"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useSidebar } from '../ui/sidebar';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { SidebarFooter } from './SidebarFooter';

const navItemVariants = {
  expanded: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } },
  collapsed: { opacity: 0, x: -15, transition: { duration:0.2 } },
};

function SidebarNavItem({ item, pathname, isExpanded }: { item: NavItem, pathname: string, isExpanded: boolean }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all duration-200 hover:text-primary group relative",
        isActive ? "text-primary" : "hover:bg-muted/50",
        isExpanded ? "justify-start" : "justify-center"
      )}
    >
      <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <motion.span 
        variants={navItemVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        initial="collapsed"
        className={cn("whitespace-nowrap", !isExpanded && "sr-only")}
      >
        {t(item.title)}
      </motion.span>
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

  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right"><p>{t(item.title)}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export function DesktopSidebar() {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed top-0 left-0 z-50 h-full border-r bg-background/80 backdrop-blur-md flex-col hidden md:flex"
    >
      <div className="flex h-16 items-center shrink-0 px-4 border-b">
         <Link href="/" className={cn("flex items-center gap-2.5 font-semibold", isExpanded ? 'justify-start w-full pl-1' : 'justify-center w-full')}>
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Logo size={32} />
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ delay: isExpanded ? 0.1 : 0, duration: 0.2 }}
              className={cn("font-bold text-xl text-foreground whitespace-nowrap", !isExpanded && "sr-only")}
            >
              LearnMint
            </motion.span>
        </Link>
      </div>

      <ScrollArea className="flex-1 mt-2">
        <nav className="grid items-start p-2 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href || item.title} item={item} pathname={pathname} isExpanded={isExpanded} />
          ))}
        </nav>
      </ScrollArea>
      
      <div className="mt-auto p-2 border-t border-border/20">
        <SidebarFooter isExpanded={isExpanded} />
      </div>
    </motion.aside>
  );
}