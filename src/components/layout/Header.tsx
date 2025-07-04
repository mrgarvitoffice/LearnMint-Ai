"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from "next-themes";
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Volume2, Volume1, VolumeX, Languages, CaseSensitive, User, LogOut, Loader2, Settings } from 'lucide-react';
import { APP_LANGUAGES } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarState: 'expanded' | 'collapsed';
}

export function Header({ onSidebarToggle, sidebarState }: HeaderProps) {
  const { t } = useTranslation();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { theme, setTheme } = useTheme();
  const { soundMode, setSoundMode, fontSize, setFontSize, appLanguage, setAppLanguage } = useSettings();
  const { user, signOutUser, loading } = useAuth();
  
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

  const handleSignOut = () => {
    playClickSound();
    signOutUser();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
       <div className="flex items-center gap-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.isAnonymous ? undefined : user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>
                       {user.isAnonymous ? <User className="h-5 w-5"/> : user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.isAnonymous ? "Guest User" : user.displayName || "User"}</p>
                    {!user.isAnonymous && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('header.settings')}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Languages className="mr-2 h-4 w-4" />
                            <span>{t('header.appLanguage')}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup value={appLanguage} onValueChange={handleLanguageChange}>
                                {APP_LANGUAGES.map(lang => (
                                  <DropdownMenuRadioItem key={lang.value} value={lang.value}>{lang.label}</DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                            {soundMode === 'full' && <Volume2 className="mr-2 h-4 w-4" />}
                            {soundMode === 'essential' && <Volume1 className="mr-2 h-4 w-4" />}
                            {soundMode === 'muted' && <VolumeX className="mr-2 h-4 w-4" />}
                            <span>{t('header.soundMode')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={soundMode} onValueChange={handleSoundModeChange}>
                                <DropdownMenuRadioItem value="full">Full</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="essential">Essential</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="muted">Muted</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                            <CaseSensitive className="mr-2 h-4 w-4" />
                            <span>{t('header.fontSize')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={fontSize} onValueChange={handleFontSizeChange}>
                                <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                            {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                            <span>{t('header.theme')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
                                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />

                {!user.isAnonymous && (
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
       </div>
    </header>
  );
}
