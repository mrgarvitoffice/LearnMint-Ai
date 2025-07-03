
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from './use-toast';

interface SpeakOptions {
  priority?: 'essential' | 'optional';
}

interface TTSHook {
  speak: (text: string, options?: SpeakOptions) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  setVoicePreference: (preference: 'holo' | 'gojo') => void;
  voicePreference: 'holo' | 'gojo';
}

// Helper functions to check for gender keywords in voice names
const isMaleVoice = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  const maleKeywords = ['male', 'david', 'mark', 'james', 'tom', 'daniel', 'fred', 'alex', 'john', 'paul', 'michael', 'man'];
  return maleKeywords.some(kw => lowerName.includes(kw));
};

const isFemaleVoice = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  const femaleKeywords = ['female', 'zira', 'susan', 'hazel', 'heather', 'samantha', 'fiona', 'eva', 'kate', 'linda', 'sarah', 'emily', 'woman', 'girl'];
  return femaleKeywords.some(kw => lowerName.includes(kw));
};


export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo'>('holo');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const { soundMode, appLanguage } = useSettings();
  const { toast } = useToast();

  const activeRequestIdRef = useRef(0);
  
  const cancelTTS = useCallback(() => {
    activeRequestIdRef.current += 1; // Invalidate previous requests
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    const getAndSetVoices = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        }
    };
    getAndSetVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = getAndSetVoices;
    }
    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = null;
            cancelTTS();
        }
    };
  }, [cancelTTS]);

  const speakWithBrowserTTS = useCallback((text: string, requestId: number) => {
    if (requestId !== activeRequestIdRef.current) return;
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        toast({ title: "TTS Not Supported", description: "Your browser does not support text-to-speech.", variant: "destructive" });
        return;
    }
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = appLanguage.split('-')[0];
    const langMatchingVoices = voices.filter(v => v.lang.replace('_', '-').startsWith(targetLang));

    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (langMatchingVoices.length > 0) {
      const isMaleRequired = voicePreference === 'gojo';
      
      const genderAppropriateVoices = langMatchingVoices.filter(v => 
          isMaleRequired ? isMaleVoice(v.name) : isFemaleVoice(v.name)
      );

      const nonConflictingVoices = langMatchingVoices.filter(v =>
          isMaleRequired ? !isFemaleVoice(v.name) : !isMaleVoice(v.name)
      );
      
      if (genderAppropriateVoices.length > 0) {
          selectedVoice = genderAppropriateVoices[0]; // Use the first matching gendered voice
      } else if (nonConflictingVoices.length > 0) {
          selectedVoice = nonConflictingVoices[0]; // Fallback to a voice that doesn't conflict
      } else {
          selectedVoice = langMatchingVoices[0]; // Last resort: use any voice for the language
      }
    }
    
    utterance.voice = selectedVoice || null;
    utterance.lang = selectedVoice?.lang || appLanguage;
    
    if (!selectedVoice && voices.length > 0) {
      console.warn(`Browser TTS: No specific voice found for language '${appLanguage}' and preference '${voicePreference}'. Using browser default.`);
    }

    utterance.onstart = () => { if (requestId === activeRequestIdRef.current) { setIsSpeaking(true); setIsPaused(false); }};
    utterance.onend = () => { if (requestId === activeRequestIdRef.current) { setIsSpeaking(false); setIsPaused(false); }};
    utterance.onerror = (e) => {
      console.error("Browser TTS Error:", e.error);
      if (requestId === activeRequestIdRef.current) {
         toast({ title: "Voice Error", description: `Could not play audio. (${e.error})`, variant: "destructive" });
         setIsSpeaking(false); setIsPaused(false);
      }
    };

    window.speechSynthesis.speak(utterance);

  }, [appLanguage, voicePreference, toast, voices]);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    const { priority = 'optional' } = options;

    if (!text.trim()) return;
    
    if (priority === 'optional' && soundMode !== 'full') {
      return;
    }
    
    cancelTTS();
    const currentRequestId = activeRequestIdRef.current += 1;
    speakWithBrowserTTS(text, currentRequestId);

  }, [soundMode, cancelTTS, speakWithBrowserTTS]);

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo') => {
    cancelTTS();
    setVoicePreference(preference);
  }, [cancelTTS]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, setVoicePreference: handleSetVoicePreference, voicePreference };
}
