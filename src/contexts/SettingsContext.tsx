
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type SoundMode = 'full' | 'essential' | 'muted';
export type FontSize = 'small' | 'normal' | 'large';

interface SettingsContextType {
  soundMode: SoundMode;
  setSoundMode: (mode: SoundMode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  appLanguage: string;
  setAppLanguage: (lang: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundMode, setSoundModeState] = useState<SoundMode>('essential');
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [appLanguage, setAppLanguageState] = useState<string>('en');

  useEffect(() => {
    const savedSoundMode = localStorage.getItem('learnmint-soundMode') as SoundMode;
    const savedFontSize = localStorage.getItem('learnmint-fontSize') as FontSize;
    const savedLanguage = localStorage.getItem('learnmint-appLanguage');
    if (savedSoundMode && ['full', 'essential', 'muted'].includes(savedSoundMode)) {
      setSoundModeState(savedSoundMode);
    }
    if (savedFontSize && ['small', 'normal', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
    if (savedLanguage) setAppLanguageState(savedLanguage);
  }, []);

  const handleSetFontSize = useCallback((size: FontSize) => {
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
    root.classList.add(`font-size-${size}`);
    localStorage.setItem('learnmint-fontSize', size);
    setFontSizeState(size);
  }, []);

  useEffect(() => {
    handleSetFontSize(fontSize);
  }, [fontSize, handleSetFontSize]);

  const handleSetSoundMode = useCallback((mode: SoundMode) => {
    localStorage.setItem('learnmint-soundMode', mode);
    setSoundModeState(mode);
  }, []);
  
  const handleSetAppLanguage = useCallback((lang: string) => {
    localStorage.setItem('learnmint-appLanguage', lang);
    setAppLanguageState(lang);
  }, []);

  const providerValue = {
    soundMode,
    setSoundMode: handleSetSoundMode,
    fontSize,
    setFontSize: handleSetFontSize,
    appLanguage,
    setAppLanguage: handleSetAppLanguage,
  };

  return (
    <SettingsContext.Provider value={providerValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
