"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/icons/Logo';
import { LogOut, Sun, Moon, Volume2, Volume1, VolumeX, Languages, CaseSensitive, UserCircle, ShieldQuestion, Settings } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { soundMode, setSoundMode, fontSize, setFontSize, language, setLanguage } = useSettings();

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
  
  const handleSoundModeChange = (value: string) => {
    playClickSound();
    setSoundMode(value as any);
  };
  
  const handleFontSizeChange = (value: string) => {
    playClickSound();
    setFontSize(value as any);
  };
  
  const handleThemeChange = (value: string) => {
    playClickSound();
    setTheme(value);
  }

  const getUserFirstName = () => {
    if (!user) return "User";
    if (user.isAnonymous) return "Guest";
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  };
  const firstName = getUserFirstName();

  // A reusable settings dropdown content component
  const SettingsMenuContent = () => (
    <>
      <DropdownMenuLabel>Settings</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {soundMode === 'full' && <Volume2 className="mr-2 h-4 w-4" />}
          {soundMode === 'essential' && <Volume1 className="mr-2 h-4 w-4" />}
          {soundMode === 'muted' && <VolumeX className="mr-2 h-4 w-4" />}
          <span>Sound Mode</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={soundMode} onValueChange={handleSoundModeChange}>
            <DropdownMenuRadioItem value="full">Full</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="essential">Essential</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="muted">Muted</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <CaseSensitive className="mr-2 h-4 w-4" />
          <span>Font Size</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={fontSize} onValueChange={handleFontSizeChange}>
            <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          <span>Theme</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-4 md:hidden">
         <Link href="/" className="flex items-center gap-2 font-semibold text-lg" onClick={() => playClickSound()}>
          <Logo size={28} />
          <span className="hidden sm:inline-block">{APP_NAME}</span>
        </Link>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden md:flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                       <SettingsMenuContent />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent><p>Settings</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
        
        {/* Settings button on mobile */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <SettingsMenuContent />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                     <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} data-ai-hint="profile picture" />
                        <AvatarFallback className="bg-muted">
                        {user.isAnonymous ? <ShieldQuestion className="h-5 w-5" /> :
                            firstName ? firstName.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                        </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <p className="font-semibold">{firstName}</p>
                    {!user.isAnonymous && <p className="text-xs text-muted-foreground font-normal">{user.email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
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
