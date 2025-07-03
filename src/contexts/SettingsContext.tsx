
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type SoundMode = 'full' | 'essential' | 'muted';
export type FontSize = 'small' | 'normal' | 'large';

interface SettingsContextType {
  soundMode: SoundMode;
  cycleSoundMode: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundMode, setSoundMode] = useState<SoundMode>('essential');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [language, setLanguage] = useState<string>('en-US');

  useEffect(() => {
    const savedSoundMode = localStorage.getItem('learnmint-soundMode') as SoundMode;
    const savedFontSize = localStorage.getItem('learnmint-fontSize') as FontSize;
    const savedLanguage = localStorage.getItem('learnmint-language');
    if (savedSoundMode && ['full', 'essential', 'muted'].includes(savedSoundMode)) {
      setSoundMode(savedSoundMode);
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

  const cycleSoundMode = useCallback(() => {
    setSoundMode(prev => {
      const newMode = prev === 'full' ? 'essential' : prev === 'essential' ? 'muted' : 'full';
      localStorage.setItem('learnmint-soundMode', newMode);
      return newMode;
    });
  }, []);

  const handleSetFontSize = useCallback((size: FontSize) => {
    setFontSize(size);
  }, []);
  
  const handleSetLanguage = useCallback((lang: string) => {
    localStorage.setItem('learnmint-language', lang);
    setLanguage(lang);
  }, []);

  return (
    <SettingsContext.Provider value={{ soundMode, cycleSoundMode, fontSize, setFontSize: handleSetFontSize, language, setLanguage: handleSetLanguage }}>
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
