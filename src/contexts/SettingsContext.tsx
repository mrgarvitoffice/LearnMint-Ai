
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type SoundMode = 'full' | 'essential' | 'muted';

interface SettingsContextType {
  soundMode: SoundMode;
  cycleSoundMode: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundMode, setSoundMode] = useState<SoundMode>('full');

  const cycleSoundMode = useCallback(() => {
    setSoundMode(prev => {
      if (prev === 'full') return 'essential';
      if (prev === 'essential') return 'muted';
      return 'full';
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ soundMode, cycleSoundMode }}>
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
