
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from './use-toast';

interface TTSHook {
  speak: (text: string, onEndCallback?: () => void) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isLoading: boolean;
  setVoicePreference: (preference: 'holo' | 'gojo' | null) => void;
  voicePreference: 'holo' | 'gojo' | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo' | null>('holo');
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  
  const { isMuted } = useSettings();
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => setBrowserVoices(window.speechSynthesis.getVoices());
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

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    const handleAudioEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onEndCallbackRef.current?.();
      onEndCallbackRef.current = null;
    };
    audio?.addEventListener('ended', handleAudioEnd);
    return () => {
        audio?.removeEventListener('ended', handleAudioEnd);
        audio?.pause();
    };
  }, []);

  const speakWithBrowserFallback = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    let targetVoice: SpeechSynthesisVoice | undefined;
    const lang = "en-US";
    const voicesForLang = browserVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    
    if (voicePreference === 'gojo') {
      const maleVoicePreferences = ['Daniel', 'Google US English', 'David', 'Alex'];
      targetVoice = voicesForLang.find(v => maleVoicePreferences.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'male');
    } else { // 'holo'
      const femaleVoicePreferences = ['Samantha', 'Google UK English Female', 'Zira', 'Fiona'];
      targetVoice = voicesForLang.find(v => femaleVoicePreferences.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'female');
    }
    utterance.voice = targetVoice || voicesForLang.find(v => v.default) || voicesForLang[0];

    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onEndCallbackRef.current?.();
      onEndCallbackRef.current = null;
    };
    utterance.onerror = () => {
      toast({ title: "Browser Voice Error", description: "Could not play browser-based voice.", variant: "destructive" });
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [browserVoices, voicePreference, toast]);

  const cancelTTS = useCallback(() => {
    setUsingFallback(false);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (audio.src) audio.src = '';
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsLoading(false);
    onEndCallbackRef.current = null;
  }, []);

  const speak = useCallback(async (text: string, onEndCallback?: () => void) => {
    if (isMuted || !text.trim()) {
        onEndCallback?.();
        return;
    }

    cancelTTS();
    setIsLoading(true);
    setUsingFallback(false);
    onEndCallbackRef.current = onEndCallback || null;
    
    try {
        const result = await textToSpeech({
            text,
            voice: voicePreference || 'holo',
        });

        setIsLoading(false);
        const audio = audioRef.current;
        if (audio && result.audioDataUri) {
            audio.src = result.audioDataUri;
            await audio.play();
            setIsSpeaking(true);
            setIsPaused(false);
        } else {
            throw new Error("Audio element not available or no audio data returned.");
        }
    } catch (error: any) {
        console.warn("AI TTS failed, attempting browser fallback.", error);
        const errorMessage = error.message?.toLowerCase() || "";
        if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
          toast({
              title: "AI Voice Notice",
              description: "AI voice quota might be exhausted. Using standard browser voice as a backup.",
              variant: "default"
          });
          setIsLoading(false);
          setUsingFallback(true);
          speakWithBrowserFallback(text);
        } else {
          toast({ title: "Voice Generation Failed", description: "Could not generate speech.", variant: "destructive" });
          setIsLoading(false);
          onEndCallbackRef.current?.();
        }
    }
  }, [isMuted, voicePreference, cancelTTS, toast, speakWithBrowserFallback]);

  const pauseTTS = useCallback(() => {
    if (usingFallback) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    } else {
        const audio = audioRef.current;
        if (audio && !audio.paused) {
          audio.pause();
          setIsPaused(true);
        }
    }
  }, [usingFallback]);

  const resumeTTS = useCallback(() => {
    if (usingFallback) {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    } else {
        const audio = audioRef.current;
        if (audio && audio.paused) {
          audio.play();
          setIsPaused(false);
        }
    }
  }, [usingFallback]);

  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo' | null) => {
    cancelTTS();
    setVoicePreference(preference);
  }, [cancelTTS]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, isLoading, setVoicePreference: handleSetVoicePreference, voicePreference };
}
