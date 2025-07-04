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
import { LogOut, Sun, Moon, Volume2, Volume1, VolumeX, Languages, CaseSensitive, UserCircle, Settings, LogIn, PanelLeftOpen, PanelLeftClose, UserPlus } from 'lucide-react';
import { APP_NAME, APP_LANGUAGES } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarState: 'expanded' | 'collapsed';
}

export function Header({ onSidebarToggle, sidebarState }: HeaderProps) {
  const { t } = useTranslation();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { soundMode, setSoundMode, fontSize, setFontSize, appLanguage, setAppLanguage } = useSettings();
  
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

  const handleLanguageChange = (value: string) => {
    playClickSound();
    setAppLanguage(value);
  };

  const getUserFirstName = () => {
    if (!user) return "User";
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  };
  const firstName = getUserFirstName();
  const isGuest = user?.isAnonymous;

  const SettingsMenuContent = () => (
    <>
      <DropdownMenuLabel>{t('header.settings')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Languages className="mr-2 h-4 w-4" />
          <span>{t('header.appLanguage')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={appLanguage} onValueChange={handleLanguageChange}>
            {APP_LANGUAGES.map(lang => (
              <DropdownMenuRadioItem key={lang.value} value={lang.value}>{lang.label}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {soundMode === 'full' && <Volume2 className="mr-2 h-4 w-4" />}
          {soundMode === 'essential' && <Volume1 className="mr-2 h-4 w-4" />}
          {soundMode === 'muted' && <VolumeX className="mr-2 h-4 w-4" />}
          <span>{t('header.soundMode')}</span>
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
          <span>{t('header.fontSize')}</span>
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
          <span>{t('header.theme')}</span>
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
       {/* Pinned Logo and Brand Name */}
       <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold" onClick={() => playClickSound()}>
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Logo size={32} />
              </motion.div>
              <span className="hidden sm:inline-block font-bold text-xl text-foreground whitespace-nowrap">
                {APP_NAME}
              </span>
          </Link>
        </div>
      
        {/* Mobile: Hamburger/Sidebar Toggle */}
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={onSidebarToggle}>
                {sidebarState === 'expanded' ? <PanelLeftClose className="h-5 w-5"/> : <PanelLeftOpen className="h-5 w-5"/>}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden md:flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="group">
                            <Settings className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-45"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" collisionPadding={10}>
                       <SettingsMenuContent />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent><p>{t('header.settings')}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
        
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="group">
                    <Settings className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-45" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" collisionPadding={10}>
                <SettingsMenuContent />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full group">
                  <Avatar className="h-9 w-9 transition-transform duration-200 group-hover:scale-110">
                     <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} data-ai-hint="profile picture" />
                        <AvatarFallback className="bg-muted">
                          {isGuest ? <UserCircle className="h-5 w-5" /> : firstName ? firstName.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                        </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" collisionPadding={10}>
                <DropdownMenuLabel>
                    <p className="font-semibold">{isGuest ? 'Guest User' : t('header.profile.greeting', { name: firstName })}</p>
                    {user.email && <p className="text-xs text-muted-foreground font-normal">{user.email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {isGuest ? (
                    <>
                        <DropdownMenuItem onClick={() => router.push('/sign-up')}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Create Account</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/sign-in')}>
                            <LogIn className="mr-2 h-4 w-4" />
                            <span>Sign In</span>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>{t('header.profile.profile')}</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isGuest ? 'Exit Guest Session' : t('header.profile.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
