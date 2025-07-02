
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Calculator, Gamepad2, ListChecks, Newspaper } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const secondaryNavItems = [
  { href: '/chatbot', icon: Bot, label: 'Chatbot' },
  { href: '/calculator', icon: Calculator, label: 'Calculator' },
  { href: '/news', icon: Newspaper, label: 'Newsly', isCenter: true },
  { href: '/flashcards', icon: ListChecks, label: 'Flashcards' },
  { href: '/arcade', icon: Gamepad2, label: 'Arcade' },
];

export function SecondaryNavBar() {
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);

  return (
    <nav className="sticky top-16 z-20 flex h-14 items-center justify-around border-b bg-background/80 px-2 backdrop-blur-sm md:hidden">
       {secondaryNavItems.map((item) => {
        const Icon = item.icon;
        if (item.isCenter) {
          return (
            <Button key={item.href} asChild size="sm" className="h-9 gap-1.5 px-3" onClick={playSound}>
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        }
        return (
          <TooltipProvider key={item.href} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" onClick={playSound}>
                  <Link href={item.href}>
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </nav>
  );
}
