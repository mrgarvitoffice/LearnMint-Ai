"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from "next-themes";
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
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
import { Sun, Moon, Volume2, Volume1, VolumeX, Languages, CaseSensitive, User, LogOut, Loader2, Settings, ChevronsRightLeft } from 'lucide-react';
import { APP_LANGUAGES } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const textVariants = {
  expanded: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  collapsed: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

export function SidebarFooter({ isExpanded }: { isExpanded: boolean }) {
  const { t } = useTranslation();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { theme, setTheme } = useTheme();
  const { soundMode, setSoundMode, fontSize, setFontSize, appLanguage, setAppLanguage } = useSettings();
  const { user, signOutUser, loading } = useAuth();
  const { toggleSidebar } = useSidebar();

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

  if (loading) {
    return (
        <div className="flex items-center justify-center p-2">
            <Loader2 className="h-5 w-5 animate-spin" />
        </div>
    );
  }

  if (!user) {
    return (
        <Link href="/sign-in">
            <Button variant="ghost" className="w-full justify-start p-2">
                <LogOut className="h-5 w-5 mr-3"/>
                <motion.span variants={textVariants} initial="collapsed" animate={isExpanded ? "expanded" : "collapsed"} className={cn(!isExpanded && "sr-only")}>
                  Sign In
                </motion.span>
            </Button>
        </Link>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full flex justify-start items-center gap-2 p-2 h-auto text-left">
             <Avatar className="h-8 w-8">
                <AvatarImage src={user.isAnonymous ? undefined : user.photoURL || undefined} alt={user.displayName || "User"} />
                <AvatarFallback>
                  {user.isAnonymous ? <User className="h-5 w-5"/> : user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                </AvatarFallback>
              </Avatar>
              <motion.div variants={textVariants} initial="collapsed" animate={isExpanded ? "expanded" : "collapsed"} className={cn("flex flex-col items-start truncate", !isExpanded && "sr-only")}>
                <span className="text-sm font-semibold leading-tight truncate">{user.isAnonymous ? "Guest User" : user.displayName || "User"}</span>
                <span className="text-xs text-muted-foreground leading-tight truncate">{user.isAnonymous ? "Limited Access" : user.email}</span>
              </motion.div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56 mb-2 ml-2">
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
                <DropdownMenuSubContent className="mb-1">
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

       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }}>
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("transition-transform data-[state=expanded]:rotate-180")} data-state={isExpanded ? 'expanded' : 'collapsed'} onClick={toggleSidebar}>
                        <ChevronsRightLeft className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
}
