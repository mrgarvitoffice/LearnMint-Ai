
"use client";

// This component is no longer used in the main application layout.
// It is being kept temporarily for reference but can be safely deleted.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QUICK_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/constants';

export function BottomNavBar() {
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/30 backdrop-blur-lg md:hidden">
      <div className="grid h-16 grid-cols-5 items-center justify-around px-2">
        {QUICK_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary",
                isActive && "text-primary [text-shadow:0_0_8px_hsl(var(--primary))]"
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
