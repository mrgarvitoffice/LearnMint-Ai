
"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from "next-themes";
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Logo } from '@/components/icons/Logo';
import { Sun, Moon, Volume2, Volume1, VolumeX, Languages, CaseSensitive, UserCircle, Settings, ChevronRight } from 'lucide-react';
import { APP_NAME, APP_LANGUAGES } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarState: 'expanded' | 'collapsed';
}

export function Header({ onSidebarToggle, sidebarState }: HeaderProps) {
  const { t } = useTranslation();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { theme, setTheme } = useTheme();
  const { soundMode, setSoundMode, fontSize, setFontSize, appLanguage, setAppLanguage } = useSettings();
  
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

  const SettingsMenuContent = () => (
    <React.Fragment>
      <DropdownMenuLabel>{t('header.settings')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <Popover>
        <PopoverTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-between cursor-pointer">
            <div className="flex items-center">
              <Languages className="mr-2 h-4 w-4" />
              <span>{t('header.appLanguage')}</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </DropdownMenuItem>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" side="bottom" align="end">
          <DropdownMenuRadioGroup value={appLanguage} onValueChange={handleLanguageChange}>
            {APP_LANGUAGES.map(lang => (
              <DropdownMenuRadioItem key={lang.value} value={lang.value}>{lang.label}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-between cursor-pointer">
            <div className="flex items-center">
              {soundMode === 'full' && <Volume2 className="mr-2 h-4 w-4" />}
              {soundMode === 'essential' && <Volume1 className="mr-2 h-4 w-4" />}
              {soundMode === 'muted' && <VolumeX className="mr-2 h-4 w-4" />}
              <span>{t('header.soundMode')}</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </DropdownMenuItem>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" side="bottom" align="end">
          <DropdownMenuRadioGroup value={soundMode} onValueChange={handleSoundModeChange}>
            <DropdownMenuRadioItem value="full">Full</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="essential">Essential</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="muted">Muted</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-between cursor-pointer">
            <div className="flex items-center">
              <CaseSensitive className="mr-2 h-4 w-4" />
              <span>{t('header.fontSize')}</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </DropdownMenuItem>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" side="bottom" align="end">
           <DropdownMenuRadioGroup value={fontSize} onValueChange={handleFontSizeChange}>
            <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-between cursor-pointer">
            <div className="flex items-center">
              {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              <span>{t('header.theme')}</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </DropdownMenuItem>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" side="bottom" align="end">
          <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </PopoverContent>
      </Popover>
    </React.Fragment>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
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
      
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={onSidebarToggle}>
              {/* This button is only for mobile sheet, but header is used on desktop too. Logic handled in AppLayout. */}
            </Button>
        </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 sm:gap-2">
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

        <Button variant="outline" size="sm" asChild>
          <Link href="/sign-in">
            <UserCircle className="mr-2 h-4 w-4" />
            Sign In
          </Link>
        </Button>
      </div>
    </header>
  );
}
