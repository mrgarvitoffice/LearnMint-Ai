
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarNav } from './SidebarNav';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/constants';

export function BottomNavBar() {
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="grid h-16 grid-cols-5 items-center justify-around px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

          if (item.title === 'Menu') {
            return (
              <Sheet key={item.title}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex h-auto flex-col items-center justify-center gap-1 p-2 text-muted-foreground"
                    onClick={playSound}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{item.title}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                  <ScrollArea className="flex-1 py-4">
                    <SidebarNav items={NAV_ITEMS} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary",
                isActive && "text-primary"
              )}
              onClick={playSound}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
