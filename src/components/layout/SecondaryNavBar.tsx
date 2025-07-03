"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QUICK_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function SecondaryNavBar() {
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 z-20 hidden h-14 items-center justify-around bg-background/80 px-2 backdrop-blur-sm md:flex">
       {QUICK_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        // Special styling for the center item, 'Newsly'
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

        // Standard styling for other items
        return (
          <TooltipProvider key={item.href} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" onClick={playSound}>
                  <Link href={item.href}>
                    <Icon className="h-5 w-5" />
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
