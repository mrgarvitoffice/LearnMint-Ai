
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Logo } from '@/components/icons/Logo';
import { Settings, LogOut, Sun, Moon, Volume2, Volume1, VolumeX, Menu, Languages, CaseSensitive } from 'lucide-react';
import { APP_NAME, TTS_LANGUAGES } from '@/lib/constants';

import { useSidebar } from '../ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { DesktopSidebar } from './DesktopSidebar';
import { SidebarNav } from './SidebarNav';
import { NAV_ITEMS } from '@/lib/constants';

export function Header() {
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { soundMode, cycleSoundMode, fontSize, setFontSize, language, setLanguage } = useSettings();
  const { openMobile, setOpenMobile } = useSidebar();


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

  const handleCycleSoundMode = () => {
    playClickSound();
    cycleSoundMode();
  };
  
  const getSoundModeIconAndText = () => {
    switch (soundMode) {
      case 'full': return { icon: <Volume2 className="mr-2 h-4 w-4" />, text: "Sound: Full" };
      case 'essential': return { icon: <Volume1 className="mr-2 h-4 w-4" />, text: "Sound: Essential" };
      case 'muted': return { icon: <VolumeX className="mr-2 h-4 w-4" />, text: "Sound: Muted" };
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 md:justify-end">
        <div className="flex items-center gap-2 md:hidden">
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                   <DesktopSidebar />
                </SheetContent>
            </Sheet>
             <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => playClickSound()}>
                <Logo size={28}/>
                <span className="font-bold text-lg">{APP_NAME}</span>
            </Link>
        </div>


      <div className="flex items-center gap-2">
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
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CaseSensitive className="mr-2 h-4 w-4" />
                    <span>Font Size</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as any)}>
                        <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>Language</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
                         {TTS_LANGUAGES.map(lang => (
                           <DropdownMenuRadioItem key={lang.value} value={lang.value}>{lang.label}</DropdownMenuRadioItem>
                         ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={handleCycleSoundMode}>
                  {getSoundModeIconAndText().icon}
                  <span>{getSoundModeIconAndText().text}</span>
                </DropdownMenuItem>
                
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
