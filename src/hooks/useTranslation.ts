
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    setIsReady(false);

    const loadTranslations = async (lang: string) => {
      try {
        const module = await import(`@/locales/${lang}.json`);
        if (active) {
          setTranslations(module.default);
          setIsReady(true);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: ${lang}. Falling back to English.`, error);
        try {
          const fallbackModule = await import(`@/locales/en.json`);
          if (active) {
            setTranslations(fallbackModule.default);
            setIsReady(true);
          }
        } catch (fallbackError) {
          console.error("Failed to load fallback English translations.", fallbackError);
          if (active) {
            setTranslations({});
            setIsReady(true);
          }
        }
      }
    };

    const langCode = appLanguage.split('-')[0]; // Use base language code like 'en', 'es', 'hi'
    loadTranslations(langCode);

    return () => {
      active = false;
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    if (!translations) {
      return key; // Return key if translations are not loaded yet
    }
    let translation = translations[key] || key;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }

    return translation;
  }, [translations]);

  return { t, isReady };
}
