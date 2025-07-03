
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
  setVoicePreference: (preference: 'holo' | 'gojo' | null) => void;
  voicePreference: 'holo' | 'gojo' | null;
}

// A simple request tracking system to prevent race conditions
let ttsRequestCounter = 0;

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo' | null>('holo');
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const { soundMode } = useSettings();
  const { toast } = useToast();

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            setBrowserVoices(voices);
        }
    };
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      ttsRequestCounter++; // Invalidate any pending requests
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const speak = useCallback((text: string, options: SpeakOptions = { priority: 'optional' }) => {
    if (soundMode === 'muted' || !text.trim()) return;
    if (soundMode === 'essential' && options.priority !== 'essential') return;
    if (browserVoices.length === 0) {
        return;
    }

    cancelTTS(); // Cancel previous speech and invalidate old requests
    const currentRequestId = ++ttsRequestCounter;

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    const lang = "en-US";
    const voicesForLang = browserVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    let targetVoice: SpeechSynthesisVoice | undefined;

    const gojoVoiceNames = ['Google US English', 'Daniel', 'David', 'Alex', 'Fred'];
    const holoVoiceNames = ['Samantha', 'Google UK English Female', 'Fiona', 'Zira', 'Tessa', 'Allison'];

    if (voicePreference === 'gojo') {
        targetVoice = voicesForLang.find(v => gojoVoiceNames.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'male' && v.localService) || voicesForLang.find(v => v.gender === 'male');
    } else { // 'holo' or null default
        targetVoice = voicesForLang.find(v => holoVoiceNames.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'female' && v.localService) || voicesForLang.find(v => v.gender === 'female');
    }
    
    utterance.voice = targetVoice || voicesForLang.find(v => v.default) || voicesForLang[0] || browserVoices[0];
    if (!utterance.voice) {
        console.error("TTS: No suitable voice found on this device.");
        toast({ title: "Voice Error", description: "No suitable voice found on this device.", variant: "destructive" });
        return;
    }

    const onEndOrError = () => {
      if(currentRequestId === ttsRequestCounter) { // Only update state if this is the most recent request
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    utterance.onstart = () => { if(currentRequestId === ttsRequestCounter) setIsSpeaking(true); setIsPaused(false); };
    utterance.onpause = () => { if(currentRequestId === ttsRequestCounter) setIsPaused(true); };
    utterance.onresume = () => { if(currentRequestId === ttsRequestCounter) setIsPaused(false); };
    utterance.onend = onEndOrError;
    utterance.onerror = (e) => {
      console.error("SpeechSynthesis Error:", e);
      toast({ title: "Voice Error", description: `Could not play audio. (${e.error})`, variant: "destructive" });
      onEndOrError();
    };
    
    window.speechSynthesis.speak(utterance);
  }, [soundMode, browserVoices, voicePreference, cancelTTS, toast]);

  const pauseTTS = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }
  }, []);

  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo' | null) => {
    cancelTTS();
    setVoicePreference(preference);
  }, [cancelTTS]);
  
  // Cleanup on unmount
  useEffect(() => cancelTTS, [cancelTTS]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, setVoicePreference: handleSetVoicePreference, voicePreference };
}
