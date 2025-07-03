
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { generateSpeechAction } from '@/lib/actions';

/**
 * @interface TTSHook
 * Defines the return type of the useTTS hook.
 */
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
 * A custom React hook for robust, server-side Text-To-Speech (TTS) functionality.
 * This hook calls a Genkit flow to generate high-quality, consistent audio on the server,
 * which is then played on the client. It replaces the unreliable browser-native SpeechSynthesis API.
 */
export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo' | null>(null);
  const { isMuted } = useSettings();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsLoading(false);
  }, []);

  const cancelTTS = useCallback(() => {
    onEndCallbackRef.current = null; // Clear any pending callback
    cleanupAudio();
  }, [cleanupAudio]);

  const speak = useCallback(async (text: string, onEndCallback?: () => void) => {
    if (isMuted || !text.trim()) {
      onEndCallback?.();
      return;
    }
    
    cancelTTS(); // Stop any currently playing audio
    setIsLoading(true);
    onEndCallbackRef.current = onEndCallback || null;

    try {
      const response = await generateSpeechAction({
        text,
        voice: voicePreference || 'holo',
      });
      
      if (response?.audioDataUri) {
        const audio = new Audio(response.audioDataUri);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsSpeaking(true);
          setIsPaused(false);
        };
        audio.onpause = () => {
          // Differentiate between natural end and manual pause
          if (audio.ended) return;
          setIsPaused(true);
        };
        audio.onended = () => {
          onEndCallbackRef.current?.();
          cleanupAudio();
        };
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          onEndCallbackRef.current?.();
          cleanupAudio();
        };

        audio.play().catch(e => {
            console.error("Failed to start audio playback:", e);
            cleanupAudio();
        });
      } else {
        throw new Error("Received no audio data from server");
      }
    } catch (error) {
      console.error("TTS Generation Error:", error);
      onEndCallbackRef.current?.();
      cleanupAudio();
    }
  }, [isMuted, cancelTTS, voicePreference, cleanupAudio]);
  
  const pauseTTS = useCallback(() => {
    if (audioRef.current && isSpeaking && !isPaused) {
      audioRef.current.pause();
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play().catch(e => {
          console.error("Failed to resume audio playback:", e);
          cleanupAudio();
      });
      setIsPaused(false);
    }
  }, [isPaused, cleanupAudio]);

  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo' | null) => {
    cancelTTS();
    setVoicePreference(preference);
  }, [cancelTTS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelTTS();
    };
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
