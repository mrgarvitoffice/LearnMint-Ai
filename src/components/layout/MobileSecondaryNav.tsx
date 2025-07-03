
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QUICK_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileSecondaryNav() {
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // This component now only renders for mobile view
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="sticky top-16 z-20 grid h-16 grid-cols-5 items-center justify-around border-b bg-background/90 px-1 backdrop-blur-sm">
      {QUICK_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 rounded-md p-1 text-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary",
              isActive && "text-primary [text-shadow:0_0_8px_hsl(var(--primary))]"
            )}
            onClick={playSound}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
