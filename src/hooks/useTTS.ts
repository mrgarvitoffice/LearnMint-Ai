
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from './use-toast';
import { textToSpeech } from '@/ai/flows/text-to-speech';

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

let ttsRequestCounter = 0;

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo'>('holo');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const { soundMode, language } = useSettings();
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isUsingAITtsRef = useRef(false);
  const activeRequestIdRef = useRef(0);
  
  const cancelTTS = useCallback(() => {
    activeRequestIdRef.current += 1; // Invalidate previous requests
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    isUsingAITtsRef.current = false;
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
        window.speechSynthesis.addEventListener('voiceschanged', getAndSetVoices);
    }
    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.removeEventListener('voiceschanged', getAndSetVoices);
        }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
    }
    return cancelTTS; // Cleanup on unmount
  }, [cancelTTS]);

  const fallbackToBrowserTTS = useCallback((text: string, requestId: number) => {
    if (requestId !== activeRequestIdRef.current) return; // Stale request, ignore.
    
    isUsingAITtsRef.current = false;
    console.warn("AI TTS failed or was bypassed. Using browser TTS as fallback.");

    if (typeof window === 'undefined' || !window.speechSynthesis || voices.length === 0) {
        setIsSpeaking(false);
        setIsPaused(false);
        if (voices.length === 0) console.warn("Browser TTS fallback failed: No voices loaded.");
        return;
    }
    
    window.speechSynthesis.cancel(); // Ensure any previous speech is stopped.

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    let suitableVoices = voices.filter(v => v.lang === language);
    if (suitableVoices.length === 0 && language.includes('-')) {
      suitableVoices = voices.filter(v => v.lang.startsWith(language.split('-')[0]));
    }

    let selectedVoice: SpeechSynthesisVoice | undefined;
    if (suitableVoices.length > 0) {
      const isMale = voicePreference === 'gojo';
      selectedVoice = suitableVoices.find(v => {
        const name = v.name.toLowerCase();
        if (isMale) {
          return name.includes('male') || ['david', 'mark', 'james', 'tom', 'daniel', 'fred'].some(maleName => name.includes(maleName));
        } else {
          return name.includes('female') || ['zira', 'susan', 'hazel', 'heather', 'samantha', 'fiona'].some(femaleName => name.includes(femaleName));
        }
      });
      if (!selectedVoice) {
        selectedVoice = suitableVoices[0];
      }
    }
    
    utterance.voice = selectedVoice || voices.find(v => v.default) || null;
    if (!utterance.voice) console.warn(`Browser TTS: No voice found for language '${language}'. Using browser default.`);
    
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
  }, [language, voicePreference, toast, voices]);

  const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
    const { priority = 'optional' } = options;

    if (soundMode === 'muted' || !text.trim()) return;
    if (soundMode === 'essential' && priority !== 'essential') return;
    
    cancelTTS(); // Cancel any ongoing speech before starting a new one
    const currentRequestId = activeRequestIdRef.current += 1;
    
    setIsSpeaking(true);
    setIsPaused(false);
    isUsingAITtsRef.current = true;
    
    try {
      const response = await textToSpeech({ text, voice: voicePreference });
      if (currentRequestId === activeRequestIdRef.current && audioRef.current) {
        audioRef.current.src = response.audioDataUri;
        audioRef.current.play().catch(e => {
          console.error("AI Audio playback error, falling back:", e);
          fallbackToBrowserTTS(text, currentRequestId);
        });
        audioRef.current.onended = () => {
          if (currentRequestId === activeRequestIdRef.current) setIsSpeaking(false);
        };
        audioRef.current.onerror = (e) => {
          if (currentRequestId === activeRequestIdRef.current) {
             console.error("AI Audio element error, falling back.", e);
             fallbackToBrowserTTS(text, currentRequestId);
          }
        };
      }
    } catch (error: any) {
      console.error("AI TTS flow error, falling back:", error);
      if (currentRequestId === activeRequestIdRef.current) {
        fallbackToBrowserTTS(text, currentRequestId);
      }
    }
  }, [soundMode, voicePreference, cancelTTS, fallbackToBrowserTTS]);

  const pauseTTS = useCallback(() => {
    if (isUsingAITtsRef.current && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (typeof window !== 'undefined' && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (isUsingAITtsRef.current && audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (typeof window !== 'undefined' && window.speechSynthesis.paused) {
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
