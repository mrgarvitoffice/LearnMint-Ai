
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Calculator, Gamepad2, UserCircle } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const router = useRouter();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const { user } = useAuth();

  const handleProfileClick = () => {
    playClickSound();
    router.push('/profile');
  };

  const QuickAccessIcons = () => (
    <div className="flex items-center gap-1">
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
  );


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5" onClick={() => playClickSound()}>
        <Logo size={32} className="text-primary"/>
        <span className="font-bold text-xl text-foreground">
          {APP_NAME}
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex">
          <QuickAccessIcons />
        </div>
        {user && (
          <Button
            variant="ghost"
            className="relative rounded-full w-9 h-9 p-0"
            onClick={handleProfileClick}
            aria-label="View Profile"
          >
            <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary transition-colors">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User avatar"} data-ai-hint="profile picture" />
              <AvatarFallback>
                <UserCircle className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">View Profile</span>
          </Button>
        )}
      </div>
    </header>
  );
}
