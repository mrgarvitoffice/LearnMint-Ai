
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
  
  const { soundMode, voiceLanguage } = useSettings();
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
        window.speechSynthesis.onvoiceschanged = getAndSetVoices;
    }
    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = null;
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
        if(voices.length === 0) console.error("Browser TTS fallback failed: No voices loaded.");
        setIsSpeaking(false);
        setIsPaused(false);
        return;
    }
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    const targetLang = voiceLanguage.replace('_', '-');
    const targetLangBase = targetLang.split('-')[0];

    let selectedVoice: SpeechSynthesisVoice | undefined;

    // Filter voices that match the language code exactly
    const perfectMatchVoices = voices.filter(v => v.lang.replace('_', '-') === targetLang);
    // Filter voices that match the base language (e.g., 'en' for 'en-US')
    const baseMatchVoices = voices.filter(v => v.lang.replace('_', '-').startsWith(targetLangBase));

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

    if (perfectMatchVoices.length > 0) {
        selectedVoice = getVoiceByPreference(perfectMatchVoices);
    } else if (baseMatchVoices.length > 0) {
        selectedVoice = getVoiceByPreference(baseMatchVoices);
    }
    
    utterance.voice = selectedVoice || null;
    utterance.lang = targetLang;
    
    if (!utterance.voice) {
        console.warn(`Browser TTS: No specific voice found for language '${targetLang}'. Using browser default.`);
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

  }, [voiceLanguage, voicePreference, toast, voices]);

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
