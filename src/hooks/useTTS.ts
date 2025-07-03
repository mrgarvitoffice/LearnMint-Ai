
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
  isLoading: boolean;
  setVoicePreference: (preference: 'holo' | 'gojo') => void;
  voicePreference: 'holo' | 'gojo';
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voicePreference, setVoicePreferenceState] = useState<'holo' | 'gojo'>('holo');
  
  const { soundMode } = useSettings();
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeRequestIdRef = useRef(0);

  const cancelTTS = useCallback(() => {
    activeRequestIdRef.current += 1; // Invalidate previous requests
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current && typeof window !== 'undefined') {
        audioRef.current = new Audio();
        
        audioRef.current.onplay = () => {
            setIsSpeaking(true);
            setIsPaused(false);
            setIsLoading(false);
        };
        audioRef.current.onpause = () => {
            // Differentiate between natural end of audio and manual pause
            if (audioRef.current && audioRef.current.duration > 0 && audioRef.current.currentTime < audioRef.current.duration) {
                setIsPaused(true);
            } else {
                setIsPaused(false);
            }
            setIsSpeaking(false);
        };
        audioRef.current.onended = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            if (audioRef.current) audioRef.current.src = "";
        };
        audioRef.current.onstalled = () => {
          if (isLoading) {
            toast({ title: "Audio Stalled", description: "The audio stream is having trouble loading.", variant: "default"});
            setIsLoading(false);
          }
        };
    }

    // Cleanup function to cancel any speech when the component unmounts
    return () => {
      cancelTTS();
    };
  }, [cancelTTS, isLoading, toast]);

  const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
    const { priority = 'optional' } = options;

    if (!text.trim()) return;
    
    // Sound mode check
    if (soundMode === 'muted' || (soundMode === 'essential' && priority === 'optional')) {
      return;
    }
    
    // Invalidate any ongoing request and start a new one
    const currentRequestId = activeRequestIdRef.current += 1;
    cancelTTS(); // Cancel previous sounds before starting a new one
    setIsLoading(true);

    try {
        const result = await textToSpeech({ text, voice: voicePreference });
        
        // If another request has started while we were waiting, do nothing.
        if (currentRequestId !== activeRequestIdRef.current) {
          setIsLoading(false);
          return;
        }

        if (result.audioDataUri && audioRef.current) {
            audioRef.current.src = result.audioDataUri;
            await audioRef.current.play();
        } else {
            throw new Error("Received no audio data from the server.");
        }
    } catch (error: any) {
        console.error("TTS Generation Error:", error);
        toast({ title: "Voice Error", description: `Could not generate audio: ${error.message}`, variant: "destructive" });
        if (currentRequestId === activeRequestIdRef.current) {
           setIsLoading(false);
        }
    }
  }, [soundMode, cancelTTS, toast, voicePreference]);

  const pauseTTS = useCallback(() => {
    if (isSpeaking && !isPaused) {
      audioRef.current?.pause();
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (isPaused) {
      audioRef.current?.play().catch(e => console.error("Resume TTS failed", e));
    }
  }, [isPaused]);
  
  const setVoicePreference = useCallback((preference: 'holo' | 'gojo') => {
    cancelTTS();
    setVoicePreferenceState(preference);
  }, [cancelTTS]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, isLoading, setVoicePreference, voicePreference };
}
