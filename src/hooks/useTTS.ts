
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from './use-toast';
import { textToSpeech } from '@/ai/flows/text-to-speech';

interface SpeakOptions {
  priority?: 'essential' | 'optional';
  useBrowserTTS?: boolean;
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
  
  const { soundMode, language } = useSettings();
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isUsingAITtsRef = useRef(false);
  
  const cancelTTS = useCallback(() => {
    ttsRequestCounter++;
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
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
    }
    return cancelTTS;
  }, [cancelTTS]);

  const fallbackToBrowserTTS = useCallback((text: string, currentRequestId: number) => {
    if (currentRequestId !== ttsRequestCounter) return;
    isUsingAITtsRef.current = false;
    
    console.warn("Using browser TTS as fallback.");
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    const voices = window.speechSynthesis.getVoices();
    utterance.lang = language;
    
    const gojoVoiceNames = ['Google US English', 'Daniel', 'David', 'Alex', 'Fred'];
    const holoVoiceNames = ['Samantha', 'Google UK English Female', 'Fiona', 'Tessa', 'Allison'];
    
    let targetVoices = (voicePreference === 'gojo' ? gojoVoiceNames : holoVoiceNames);
    const voicesForLang = voices.filter(v => v.lang.startsWith(language.split('-')[0]));
    
    let selectedVoice = voicesForLang.find(v => targetVoices.some(name => v.name.includes(name))) ||
                        voicesForLang.find(v => v.localService) ||
                        voicesForLang[0];

    utterance.voice = selectedVoice || voices.find(v => v.default) || null;
    
    utterance.onstart = () => { if (currentRequestId === ttsRequestCounter) { setIsSpeaking(true); setIsPaused(false); }};
    utterance.onend = () => { if (currentRequestId === ttsRequestCounter) { setIsSpeaking(false); setIsPaused(false); }};
    utterance.onerror = (e) => {
      console.error("Browser TTS Error:", e);
      if (currentRequestId === ttsRequestCounter) {
         toast({ title: "Voice Error", description: `Could not play audio. (${e.error})`, variant: "destructive" });
         setIsSpeaking(false); setIsPaused(false);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }, [language, voicePreference, toast]);

  const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
    const { priority = 'optional', useBrowserTTS = false } = options;

    if (soundMode === 'muted' || !text.trim()) return;
    if (soundMode === 'essential' && priority !== 'essential') return;
    
    cancelTTS();
    const currentRequestId = ++ttsRequestCounter;
    
    if (useBrowserTTS) {
        fallbackToBrowserTTS(text, currentRequestId);
        return;
    }

    setIsSpeaking(true);
    isUsingAITtsRef.current = true;
    try {
      const response = await textToSpeech({ text, voice: voicePreference });
      if (currentRequestId === ttsRequestCounter && audioRef.current) {
        audioRef.current.src = response.audioDataUri;
        audioRef.current.play().catch(e => {
          console.error("AI Audio playback error:", e);
          fallbackToBrowserTTS(text, currentRequestId);
        });
        audioRef.current.onended = () => {
          if (currentRequestId === ttsRequestCounter) setIsSpeaking(false);
        };
        audioRef.current.onerror = () => {
          if (currentRequestId === ttsRequestCounter) {
             console.error("AI Audio element error, falling back.");
             fallbackToBrowserTTS(text, currentRequestId);
          }
        };
      }
    } catch (error: any) {
      console.error("AI TTS flow error:", error);
      if (currentRequestId === ttsRequestCounter) {
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
