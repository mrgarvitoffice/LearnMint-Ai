
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QUICK_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function SecondaryNavBar() {
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Mobile view: Vertical icons with text below
  if (isMobile) {
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

  // Desktop view: Horizontal icons with tooltips/text
  return (
    <nav className="sticky top-16 z-20 flex h-14 items-center justify-around border-b bg-background/80 px-2 backdrop-blur-sm">
       {QUICK_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

        if (item.title === 'Newsly') {
          return (
            <Button key={item.href} asChild variant={isActive ? "default" : "secondary"} size="sm" className="h-9 gap-1.5 px-3" onClick={playSound}>
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </Button>
          );
        }

        return (
          <TooltipProvider key={item.href} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant={isActive ? "outline" : "ghost"} size="icon" onClick={playSound} className={isActive ? "ring-1 ring-primary/50" : ""}>
                  <Link href={item.href}>
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </nav>
  );
}
