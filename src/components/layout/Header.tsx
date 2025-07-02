
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Bot, Calculator, Gamepad2 } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5" onClick={() => playClickSound()}>
        <Logo size={32} className="text-primary"/>
        <span className="font-bold text-xl text-foreground">
          {APP_NAME}
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/chatbot"><Bot className="h-5 w-5" /></Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>AI Chatbot</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/calculator"><Calculator className="h-5 w-5" /></Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Calculator</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/arcade"><Gamepad2 className="h-5 w-5" /></Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Arcade</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
