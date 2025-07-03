
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from './use-toast';
import { APP_LANGUAGES } from '@/lib/constants';

interface SpeakOptions {
  priority?: 'essential' | 'optional';
  lang?: string; // e.g., 'en', 'es', 'hi'
}

interface TTSHook {
  speak: (text: string, options?: SpeakOptions) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isLoading: boolean; // Represents voices loading
  setVoicePreference: (preference: 'holo' | 'gojo') => void;
  voicePreference: 'holo' | 'gojo';
}

// Browser's built-in Speech Synthesis (Free, no AI quota)
let synth: SpeechSynthesis | null = null;
if (typeof window !== 'undefined') {
  synth = window.speechSynthesis;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicePreference, setVoicePreferenceState] = useState<'holo' | 'gojo'>('holo');
  
  const { soundMode, appLanguage } = useSettings();
  const { toast } = useToast();

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const populateVoiceList = useCallback(() => {
    if (!synth) return;
    const availableVoices = synth.getVoices();
    if (availableVoices.length > 0) {
      setVoices(availableVoices);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!synth) {
      setIsLoading(false);
      return;
    }
    populateVoiceList();
    // Some browsers load voices asynchronously.
    synth.onvoiceschanged = populateVoiceList;

    return () => {
      if (synth) synth.onvoiceschanged = null;
      cancelTTS();
    };
  }, [populateVoiceList]);
  
  const cancelTTS = useCallback(() => {
    if (synth?.speaking) {
      synth.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    const { priority = 'optional', lang = appLanguage } = options;

    if (!text.trim() || !synth) return;
    
    // Respect sound mode settings
    if (soundMode === 'muted' || (soundMode === 'essential' && priority === 'optional')) {
      return;
    }
    
    cancelTTS(); // Stop any current speech

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const bcp47Lang = APP_LANGUAGES.find(l => l.value === lang)?.bcp47 || 'en-US';
    utterance.lang = bcp47Lang;
    
    // Voice selection logic
    const potentialVoices = voices.filter(v => v.lang.startsWith(lang) && !v.localService);
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (voicePreference === 'holo') { // Female
      selectedVoice = potentialVoices.find(v => v.name.toLowerCase().includes('female')) || potentialVoices.find(v => !v.name.toLowerCase().includes('male')) || null;
    } else { // 'gojo' -> Male
      selectedVoice = potentialVoices.find(v => v.name.toLowerCase().includes('male')) || null;
    }
    
    // Fallback if preferred gender not found
    if (!selectedVoice && potentialVoices.length > 0) {
      selectedVoice = potentialVoices[0];
    }
    // Final fallback to any available voice
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
        if (voices.length > 0) { // If no language match, just use the first available voice
            utterance.voice = voices[0];
        } else {
            console.warn("TTS: No synthesis voices available.");
            toast({ title: "Voice Error", description: "No text-to-speech voices were found on your browser.", variant: "destructive" });
            return;
        }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onpause = () => {
      setIsSpeaking(true);
      setIsPaused(true);
    };
    utterance.onresume = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance.onerror", event);
      toast({ title: "Voice Error", description: `An error occurred during speech synthesis: ${event.error}`, variant: "destructive" });
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
  }, [voices, voicePreference, soundMode, appLanguage, cancelTTS, toast]);

  const pauseTTS = useCallback(() => {
    if (synth?.speaking && !synth.paused) {
      synth.pause();
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (synth?.paused) {
      synth.resume();
    }
  }, []);
  
  const setVoicePreference = useCallback((preference: 'holo' | 'gojo') => {
    cancelTTS();
    setVoicePreferenceState(preference);
  }, [cancelTTS]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, isLoading, setVoicePreference, voicePreference };
}
