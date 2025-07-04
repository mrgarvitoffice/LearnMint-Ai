"use client";

import React from 'react';
import { useTheme } from "next-themes";
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Volume2, Volume1, VolumeX, Languages, CaseSensitive, Settings } from 'lucide-react';
import { APP_LANGUAGES } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '../ui/button';

export function Header() {
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
       <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="bottom" forceMount>
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
            </DropdownMenuContent>
          </DropdownMenu>
       </div>
    </header>
  );
}
