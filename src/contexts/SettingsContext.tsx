"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type SoundMode = 'full' | 'essential' | 'muted';
export type FontSize = 'small' | 'normal' | 'large';

interface SettingsContextType {
  soundMode: SoundMode;
  setSoundMode: (mode: SoundMode) => void;
  setFontSize: (size: FontSize) => void;
  setLanguage: (lang: string) => void;
  fontSize: FontSize;
  language: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundMode, setSoundModeState] = useState<SoundMode>('essential');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [language, setLanguage] = useState<string>('en-US');

  useEffect(() => {
    const savedSoundMode = localStorage.getItem('learnmint-soundMode') as SoundMode;
    const savedFontSize = localStorage.getItem('learnmint-fontSize') as FontSize;
    const savedLanguage = localStorage.getItem('learnmint-language');
    if (savedSoundMode && ['full', 'essential', 'muted'].includes(savedSoundMode)) {
      setSoundModeState(savedSoundMode);
    }
    if (savedFontSize && ['small', 'normal', 'large'].includes(savedFontSize)) {
      setFontSize(savedFontSize);
    }
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
    root.classList.add(`font-size-${fontSize}`);
    localStorage.setItem('learnmint-fontSize', fontSize);
  }, [fontSize]);

  const handleSetSoundMode = useCallback((mode: SoundMode) => {
    localStorage.setItem('learnmint-soundMode', mode);
    setSoundModeState(mode);
  }, []);

  const handleSetFontSize = useCallback((size: FontSize) => {
    setFontSize(size);
  }, []);
  
  const handleSetLanguage = useCallback((lang: string) => {
    localStorage.setItem('learnmint-language', lang);
    setLanguage(lang);
  }, []);

  const providerValue = {
    soundMode,
    setSoundMode: handleSetSoundMode,
    fontSize,
    setFontSize: handleSetFontSize,
    language,
    setLanguage: handleSetLanguage,
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
