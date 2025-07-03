
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
    // Effect to pre-load browser voices
    const getAndSetVoices = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        }
    };
    getAndSetVoices(); // Initial attempt
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = getAndSetVoices;
    }
    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel(); // Also cancel on unmount
        }
    };
  }, []);

  const speakWithBrowserTTS = useCallback((text: string, requestId: number) => {
    if (requestId !== activeRequestIdRef.current) return; // Stale request, ignore.
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        toast({ title: "TTS Not Supported", description: "Your browser does not support text-to-speech.", variant: "destructive" });
        setIsSpeaking(false);
        setIsPaused(false);
        return;
    }
     if (voices.length === 0) {
        toast({ title: "TTS Voices Not Ready", description: "Speech synthesis voices are not yet loaded. Please try again in a moment.", variant: "default" });
        setIsSpeaking(false);
        setIsPaused(false);
        return;
    }
    
    window.speechSynthesis.cancel(); // Cancel any previous utterance

    const utterance = new SpeechSynthesisUtterance(text);
    
    const targetLang = appLanguage.split('-')[0]; // Use base language code e.g. 'en', 'es'

    let selectedVoice: SpeechSynthesisVoice | undefined;

    // Filter voices that match the base language (e.g., 'en' for 'en-US')
    const baseMatchVoices = voices.filter(v => v.lang.replace('_', '-').startsWith(targetLang));

    const getVoiceByPreference = (voicePool: SpeechSynthesisVoice[]) => {
        const isMale = voicePreference === 'gojo';
        // Try to find a voice that matches the gender preference
        const preferredVoice = voicePool.find(v => {
            const name = v.name.toLowerCase();
            const isMaleVoice = name.includes('male') || ['david', 'mark', 'james', 'tom', 'daniel', 'fred', 'alex'].some(maleName => name.includes(maleName));
            const isFemaleVoice = name.includes('female') || ['zira', 'susan', 'hazel', 'heather', 'samantha', 'fiona', 'eva'].some(femaleName => name.includes(femaleName));
            return isMale ? isMaleVoice : isFemaleVoice;
        });
        return preferredVoice || voicePool[0]; // Fallback to the first available voice in the pool
    };

    if (baseMatchVoices.length > 0) {
        selectedVoice = getVoiceByPreference(baseMatchVoices);
    }
    
    utterance.voice = selectedVoice || null;
    utterance.lang = appLanguage;
    
    if (!utterance.voice) {
        console.warn(`Browser TTS: No specific voice found for language '${appLanguage}'. Using browser default.`);
    }

    utterance.onstart = () => { if (requestId === activeRequestIdRef.current) { setIsSpeaking(true); setIsPaused(false); }};
    utterance.onend = () => { if (requestId === activeRequestIdRef.current) { setIsSpeaking(false); setIsPaused(false); }};
    utterance.onerror = (e) => {
      console.error("Browser TTS Error:", e);
      if (requestId === activeRequestIdRef.current) {
         toast({ title: "Voice Error", description: `Could not play audio. (${e.error})`, variant: "destructive" });
         setIsSpeaking(false); setIsPaused(false);
      }
    };

    window.speechSynthesis.speak(utterance);

  }, [appLanguage, voicePreference, toast, voices]);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    const { priority = 'optional' } = options;

    if (soundMode === 'muted' || !text.trim()) return;
    if (soundMode === 'essential' && priority !== 'essential') return;
    
    cancelTTS(); // Cancel any ongoing speech before starting a new one
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
