
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

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
 * A custom React hook for client-side Text-To-Speech (TTS) functionality using the browser's
 * native Web Speech API. This approach avoids server-side API calls to conserve quota.
 * Note: Voice availability and quality will vary based on the user's browser and OS.
 */
export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo' | null>(null);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { isMuted } = useSettings();
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setSupportedVoices(voices);
      }
    };

    // `getVoices` can be asynchronous, so we listen for the `voiceschanged` event.
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices(); // Initial attempt

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clean up on unmount
      }
    };
  }, []);

  const cancelTTS = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    onEndCallbackRef.current = null;
  }, []);

  const speak = useCallback((text: string, onEndCallback?: () => void) => {
    if (isMuted || !text.trim() || typeof window === 'undefined' || !window.speechSynthesis || supportedVoices.length === 0) {
      onEndCallback?.();
      return;
    }

    cancelTTS(); // Stop anything currently speaking

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    onEndCallbackRef.current = onEndCallback || null;
    
    // --- Voice Selection Logic ---
    let selectedVoice: SpeechSynthesisVoice | null = null;
    const englishVoices = supportedVoices.filter(v => v.lang.startsWith('en'));

    // Find the best match for the preference
    if (voicePreference === 'holo') { // Prefers Female
        selectedVoice = englishVoices.find(v => /female/i.test(v.name) && !/google/i.test(v.name) && !/microsoft/i.test(v.name)) // Prioritize system voices
                     || englishVoices.find(v => /female/i.test(v.name)) 
                     || null;
    } else if (voicePreference === 'gojo') { // Prefers Male
        selectedVoice = englishVoices.find(v => /male/i.test(v.name) && !/google/i.test(v.name) && !/microsoft/i.test(v.name))
                     || englishVoices.find(v => /male/i.test(v.name))
                     || null;
    }
    
    // Fallback if preferred gender not found
    if (!selectedVoice) {
      selectedVoice = englishVoices[0] || supportedVoices[0];
    }
    
    utterance.voice = selectedVoice;
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      // This event can fire briefly when `cancel` is called, so check `isSpeaking`
      if(isSpeaking) {
        setIsPaused(true);
      }
    };

    utterance.onresume = () => {
      setIsPaused(false);
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onEndCallbackRef.current?.();
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
      setIsPaused(false);
      onEndCallbackRef.current?.();
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  }, [isMuted, supportedVoices, voicePreference, cancelTTS, isSpeaking]);

  const pauseTTS = useCallback(() => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isPaused]);
  
  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo' | null) => {
    cancelTTS();
    setVoicePreference(preference);
  }, [cancelTTS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    isLoading: false, // isLoading is not relevant for client-side TTS
    setVoicePreference: handleSetVoicePreference,
    voicePreference,
  };
}
