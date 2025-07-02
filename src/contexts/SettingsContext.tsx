
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SettingsContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return (
    <SettingsContext.Provider value={{ isMuted, toggleMute }}>
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
