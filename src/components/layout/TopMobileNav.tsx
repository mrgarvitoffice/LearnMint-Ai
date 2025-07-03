
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOP_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { NewslyIcon } from '../icons/NewslyIcon';
import { Header } from './Header';
import { useTranslation } from '@/hooks/useTranslation';

export function TopMobileNav() {
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden">
      <Header onSidebarToggle={() => {}} sidebarState="collapsed" />
      <nav className="grid h-16 grid-cols-5 items-center justify-around border-b bg-background/90 px-1 backdrop-blur-sm">
        {TOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;
          const title = t(item.title);
          
          if (item.title === 'sidebar.dailyNews') {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 rounded-md p-1 text-center text-muted-foreground transition-colors group",
                  isActive ? "text-primary" : "hover:text-primary"
                )}
                onClick={playSound}
              >
                <div className="flex flex-col items-center justify-center -mt-1">
                  <NewslyIcon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-[10px] font-bold leading-tight mt-0.5">{title}</span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 rounded-md p-1 text-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary group",
                isActive && "text-primary [text-shadow:0_0_8px_hsl(var(--primary))]"
              )}
              onClick={playSound}
            >
              <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[10px] font-medium leading-tight">{title}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
