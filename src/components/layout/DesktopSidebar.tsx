
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSound } from '@/hooks/useSound';

import { cn } from '@/lib/utils';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from '../ui/scroll-area';
import { useSidebar } from '../ui/sidebar';

function SidebarNavItem({ item, pathname }: { item: NavItem, pathname: string }) {
    const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
    
    const handleItemClick = () => {
      playClickSound();
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
            <Icon className="h-5 w-5" />
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
                        isGroupActive && "text-primary"
                    )}
                >
                    <Icon className="h-5 w-5" />
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
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);

  return (
    <aside className="w-64 border-r bg-background/95 flex-col h-screen sticky top-0 hidden md:flex">
        <div className="flex h-16 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2.5 font-semibold" onClick={playSound}>
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
    </aside>
  );
}
