
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

/**
 * `useTTS` Hook
 *
 * A custom React hook for Text-To-Speech (TTS) functionality using a server-side
 * AI model for consistent, high-quality voice generation across all devices.
 */
export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo' | null>(null);
  
  const { isMuted } = useSettings();
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  // Effect to manage the audio element lifecycle
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleEnded = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onEndCallbackRef.current?.();
        onEndCallbackRef.current = null; // Clear callback after execution
    };
    const handlePlay = () => setIsSpeaking(true);
    const handlePause = () => setIsPaused(true);

    audio?.addEventListener('ended', handleEnded);
    audio?.addEventListener('play', handlePlay);
    audio?.addEventListener('pause', handlePause);

    return () => {
        audio?.removeEventListener('ended', handleEnded);
        audio?.removeEventListener('play', handlePlay);
        audio?.removeEventListener('pause', handlePause);
        audio?.pause();
        audioRef.current = null;
    };
  }, []);

  const cancelTTS = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = ''; // Detach the source
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

    cancelTTS(); // Stop any currently playing audio
    setIsLoading(true);
    onEndCallbackRef.current = onEndCallback || null;
    
    try {
        const result = await textToSpeech({
            text,
            voice: voicePreference || 'holo', // Default to Holo if not set
        });

        const audio = audioRef.current;
        if (audio && result.audioDataUri) {
            audio.src = result.audioDataUri;
            await audio.play();
            setIsPaused(false);
        } else {
            throw new Error("Audio element not available or no audio data returned.");
        }
    } catch (error: any) {
        console.error("Error in TTS generation:", error);
        toast({
            title: "Voice Generation Failed",
            description: error.message || "Could not generate speech.",
            variant: "destructive"
        });
        onEndCallbackRef.current?.(); // Ensure callback is called on error
    } finally {
        setIsLoading(false);
    }
  }, [isMuted, voicePreference, cancelTTS, toast]);

  const pauseTTS = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
    }
  }, []);

  const resumeTTS = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.play();
      setIsPaused(false);
    }
  }, []);

  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo' | null) => {
    cancelTTS();
    setVoicePreference(preference);
  }, [cancelTTS]);

  return {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    isLoading,
    setVoicePreference: handleSetVoicePreference,
    voicePreference,
  };
}
