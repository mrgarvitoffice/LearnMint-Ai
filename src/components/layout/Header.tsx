
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Sun, Moon, Newspaper, Bot, Calculator, Gamepad2, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from "next-themes";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useSettings } from '@/contexts/SettingsContext';


export function Header() {
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const { isMuted, toggleMute } = useSettings();


  const handleSignOut = async () => {
    playClickSound();
    try {
      await signOut(auth);
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
      router.push('/sign-in');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: 'Sign Out Failed', description: 'Could not sign out. Please try again.', variant: 'destructive' });
    }
  };

  const handleToggleMute = () => {
    playClickSound();
    toggleMute();
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5" onClick={() => playClickSound()}>
        <Logo size={32} className="text-primary"/>
        <span className="font-bold text-xl text-foreground">
          {APP_NAME}
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Desktop-only Quick Access Icons */}
        <div className="hidden md:flex items-center gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 px-3">
                    <Link href="/news">
                      <Newspaper className="h-4 w-4" />
                      <span>Newsly</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Daily News</p></TooltipContent>
              </Tooltip>

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

        {/* Settings Dropdown for all screen sizes */}
        {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Open Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground pt-0">Theme</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleMute}>
                  {isMuted ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
                  <span>{isMuted ? "Unmute App Sounds" : "Mute App Sounds"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
