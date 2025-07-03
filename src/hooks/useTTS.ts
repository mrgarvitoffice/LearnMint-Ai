
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
  setVoicePreference: (preference: 'holo' | 'gojo' | null) => void;
  voicePreference: 'holo' | 'gojo' | null;
}

let ttsRequestCounter = 0;
const browserTTSRequestCounter = 0;

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo' | null>('holo');
  
  const { soundMode, language } = useSettings();
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const cancelTTS = useCallback(() => {
    ttsRequestCounter++;
    cleanupAudio();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, [cleanupAudio]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
    }
    return cancelTTS;
  }, [cancelTTS]);


  const fallbackToBrowserTTS = useCallback((text: string) => {
    console.warn("AI TTS failed or quota exceeded. Falling back to browser TTS.");
    toast({ title: "AI Voice Unavailable", description: "Using standard browser voice as a fallback.", variant: "default" });

    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    cancelTTS();
    const currentRequestId = ++ttsRequestCounter;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.lang = language;
    const voicesForLang = voices.filter(v => v.lang.startsWith(language.split('-')[0]));
    
    let targetVoice: SpeechSynthesisVoice | undefined;
    const gojoVoiceNames = ['Google US English', 'Daniel', 'David', 'Alex', 'Fred'];
    const holoVoiceNames = ['Samantha', 'Google UK English Female', 'Fiona', 'Zira', 'Tessa', 'Allison'];

    if (voicePreference === 'gojo') {
      targetVoice = voicesForLang.find(v => gojoVoiceNames.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'male' && v.localService) || voicesForLang.find(v => v.gender === 'male');
    } else {
      targetVoice = voicesForLang.find(v => holoVoiceNames.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'female' && v.localService) || voicesForLang.find(v => v.gender === 'female');
    }
    utterance.voice = targetVoice || voicesForLang.find(v => v.default) || voicesForLang[0] || voices[0];
    
    utterance.onstart = () => { if(currentRequestId === ttsRequestCounter) setIsSpeaking(true); setIsPaused(false); };
    utterance.onend = () => { if(currentRequestId === ttsRequestCounter) setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = (e) => {
      console.error("Browser TTS Error:", e);
      if(currentRequestId === ttsRequestCounter) setIsSpeaking(false); setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);

  }, [language, voicePreference, toast, cancelTTS]);

  const speak = useCallback(async (text: string, options: SpeakOptions = { priority: 'optional' }) => {
    if (soundMode === 'muted' || !text.trim()) return;
    if (soundMode === 'essential' && options.priority !== 'essential') return;

    cancelTTS();
    const currentRequestId = ++ttsRequestCounter;
    setIsSpeaking(true);

    try {
      const response = await textToSpeech({ text, voice: voicePreference || 'holo' });
      if (currentRequestId === ttsRequestCounter && audioRef.current) {
        audioRef.current.src = response.audioDataUri;
        audioRef.current.play().catch(e => {
          console.error("Audio playback error:", e);
          fallbackToBrowserTTS(text);
        });
        audioRef.current.onended = () => {
          if (currentRequestId === ttsRequestCounter) setIsSpeaking(false);
        };
      }
    } catch (error: any) {
      console.error("AI TTS flow error:", error);
      if (currentRequestId === ttsRequestCounter) {
        fallbackToBrowserTTS(text);
      }
    }
  }, [soundMode, voicePreference, cancelTTS, fallbackToBrowserTTS]);

  const pauseTTS = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo' | null) => {
    cancelTTS();
    setVoicePreference(preference);
  }, [cancelTTS]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, setVoicePreference: handleSetVoicePreference, voicePreference };
}
