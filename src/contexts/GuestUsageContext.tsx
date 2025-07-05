
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

const GUEST_USAGE_LS_KEY = 'learnmint-guest-usage';

interface GuestUsageState {
  notesGenerated: number;
  testsCreated: number;
  newsSearches: number;
  date: string; // To reset daily
}

interface GuestUsageContextType {
  usage: GuestUsageState;
  incrementNotesGenerated: () => void;
  incrementTestsCreated: () => void;
  incrementNewsSearches: () => void;
  isNotesAllowed: boolean;
  isTestAllowed: boolean;
  isNewsAllowed: boolean;
  resetUsage: () => void;
}

const GuestUsageContext = createContext<GuestUsageContextType | undefined>(undefined);

const getTodayString = () => new Date().toISOString().split('T')[0];

const initialUsageState: GuestUsageState = {
  notesGenerated: 0,
  testsCreated: 0,
  newsSearches: 0,
  date: getTodayString(),
};

export function GuestUsageProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<GuestUsageState>(initialUsageState);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.isAnonymous) {
      const todayStr = getTodayString();
      let storedUsage: GuestUsageState | null = null;
      try {
        const item = localStorage.getItem(GUEST_USAGE_LS_KEY);
        if (item) {
          storedUsage = JSON.parse(item);
        }
      } catch (e) {
        console.error("Failed to parse guest usage data", e);
        localStorage.removeItem(GUEST_USAGE_LS_KEY);
      }

      if (storedUsage && storedUsage.date === todayStr) {
        setUsage(storedUsage);
      } else {
        localStorage.setItem(GUEST_USAGE_LS_KEY, JSON.stringify(initialUsageState));
        setUsage(initialUsageState);
      }
    } else {
        // If user is not a guest or logs in, reset the state (local state, not localStorage)
        setUsage(initialUsageState);
    }
  }, [user]);

  const updateUsage = useCallback((updater: (prevUsage: GuestUsageState) => GuestUsageState) => {
    if (!user?.isAnonymous) return;

    setUsage(prevUsage => {
      const newUsage = updater(prevUsage);
      localStorage.setItem(GUEST_USAGE_LS_KEY, JSON.stringify(newUsage));
      return newUsage;
    });
  }, [user]);

  const incrementNotesGenerated = useCallback(() => updateUsage(prev => ({...prev, notesGenerated: prev.notesGenerated + 1})), [updateUsage]);
  const incrementTestsCreated = useCallback(() => updateUsage(prev => ({...prev, testsCreated: prev.testsCreated + 1})), [updateUsage]);
  const incrementNewsSearches = useCallback(() => updateUsage(prev => ({...prev, newsSearches: prev.newsSearches + 1})), [updateUsage]);
  const resetUsage = useCallback(() => {
    localStorage.setItem(GUEST_USAGE_LS_KEY, JSON.stringify(initialUsageState));
    setUsage(initialUsageState);
  }, []);

  const providerValue: GuestUsageContextType = {
    usage,
    incrementNotesGenerated,
    incrementTestsCreated,
    incrementNewsSearches,
    resetUsage,
    isNotesAllowed: usage.notesGenerated < 1,
    isTestAllowed: usage.testsCreated < 1,
    isNewsAllowed: usage.newsSearches < 2,
  };

  return (
    <GuestUsageContext.Provider value={providerValue}>
      {children}
    </GuestUsageContext.Provider>
  );
}

export const useGuestUsage = () => {
  const context = useContext(GuestUsageContext);
  if (context === undefined) {
    throw new Error('useGuestUsage must be used within a GuestUsageProvider');
  }
  return context;
};
