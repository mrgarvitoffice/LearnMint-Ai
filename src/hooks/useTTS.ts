
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
  const ttsRequestRef = useRef(0); // Request invalidation ID

  // Load browser voices for fallback
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

  // Initialize and clean up the primary Audio element for AI voices
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    const handleAudioEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current();
        onEndCallbackRef.current = null;
      }
    };
    audio?.addEventListener('ended', handleAudioEnd);
    
    // Cleanup function
    return () => {
        audio?.removeEventListener('ended', handleAudioEnd);
        audio?.pause();
        if (audio?.src) {
            audio.src = '';
        }
    };
  }, []);

  const cancelTTS = useCallback(() => {
    ttsRequestRef.current++; // Invalidate any pending AI or browser TTS requests

    // Stop browser TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Stop HTML Audio element
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (audio.src) {
        audio.src = '';
      }
    }
    
    // Reset all state
    setIsSpeaking(false);
    setIsPaused(false);
    setIsLoading(false);
    setUsingFallback(false);
    onEndCallbackRef.current = null;
  }, []);

  const speakWithBrowserFallback = useCallback((text: string, requestId: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || browserVoices.length === 0) {
      onEndCallbackRef.current?.();
      return;
    }

    if (ttsRequestRef.current !== requestId) return; // Check if invalidated
    
    setUsingFallback(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    const lang = "en-US";
    const voicesForLang = browserVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    let targetVoice: SpeechSynthesisVoice | undefined;

    if (voicePreference === 'gojo') {
      const maleVoicePreferences = ['Daniel', 'Google US English', 'David', 'Alex'];
      targetVoice = voicesForLang.find(v => maleVoicePreferences.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'male');
    } else { // 'holo'
      const femaleVoicePreferences = ['Samantha', 'Google UK English Female', 'Zira', 'Fiona'];
      targetVoice = voicesForLang.find(v => femaleVoicePreferences.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'female');
    }
    utterance.voice = targetVoice || voicesForLang.find(v => v.default) || voicesForLang[0];

    utterance.onstart = () => {
        if (ttsRequestRef.current !== requestId) { window.speechSynthesis.cancel(); return; }
        setIsLoading(false); setIsSpeaking(true); setIsPaused(false);
    };
    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);
    utterance.onend = () => {
      setIsSpeaking(false); setIsPaused(false);
      if (onEndCallbackRef.current) { onEndCallbackRef.current(); onEndCallbackRef.current = null; }
    };
    utterance.onerror = (e) => {
      console.error("SpeechSynthesis Error:", e);
      toast({ title: "Browser Voice Error", description: `Could not play browser-based voice. (${e.error})`, variant: "destructive" });
      setIsSpeaking(false); setIsPaused(false); setIsLoading(false);
      if (onEndCallbackRef.current) { onEndCallbackRef.current(); onEndCallbackRef.current = null; }
    };
    
    window.speechSynthesis.speak(utterance);
  }, [browserVoices, voicePreference, toast]);


  const speak = useCallback(async (text: string, onEndCallback?: () => void) => {
    if (isMuted || !text.trim()) {
        onEndCallback?.();
        return;
    }

    cancelTTS(); // This is crucial: stop everything and invalidate old requests first.
    const currentRequestId = ++ttsRequestRef.current; // Create new request ID
    
    setIsLoading(true);
    onEndCallbackRef.current = onEndCallback || null;
    
    try {
        const result = await textToSpeech({ text, voice: voicePreference || 'holo' });

        if (ttsRequestRef.current !== currentRequestId) return; // Abort if invalidated while waiting

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
        if (ttsRequestRef.current !== currentRequestId) return; // Abort if invalidated

        console.warn("AI TTS failed, attempting browser fallback.", error);
        const errorMessage = error.message?.toLowerCase() || "";
        if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
          toast({ title: "AI Voice Notice", description: "AI voice quota might be exhausted. Using standard browser voice.", variant: "default" });
          speakWithBrowserFallback(text, currentRequestId);
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
          audio.play().catch(e => console.error("Error resuming audio:", e));
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
