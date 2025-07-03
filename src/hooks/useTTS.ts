
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

// --- Enhanced Voice Selection Logic ---
// Prioritized lists of keywords found in higher-quality system voices.
const PREFERRED_FEMALE_VOICES = ['Samantha', 'Tessa', 'Fiona', 'Moira', 'Karen', 'Susan', 'Zira'];
const PREFERRED_MALE_VOICES = ['Daniel', 'Alex', 'Oliver', 'Rishi', 'Fred', 'Aaron'];

function findBestVoice(
  voices: SpeechSynthesisVoice[], 
  preference: 'holo' | 'gojo' | null
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const targetGender = preference === 'holo' ? 'female' : 'male';
  const preferredNames = preference === 'holo' ? PREFERRED_FEMALE_VOICES : PREFERRED_MALE_VOICES;

  const scoredVoices = voices
    .filter(v => v.lang.startsWith('en')) // Only consider English voices
    .map(voice => {
      let score = 0;
      const name = voice.name.toLowerCase();

      // Highest priority for preferred names
      if (preferredNames.some(pName => name.includes(pName.toLowerCase()))) {
        score += 100;
      }
      // High priority for being a local system voice
      if (voice.localService) {
        score += 50;
      }
      // Deprioritize generic cloud voices if better local ones exist
      if (name.includes('google') || name.includes('microsoft')) {
        score -= 20;
      }
      // Generic gender match
      if (name.includes(targetGender)) {
        score += 10;
      }

      return { voice, score, name };
    });

  // Filter for the target gender and sort by score
  const potentialMatches = scoredVoices
    .filter(v => v.name.includes(targetGender))
    .sort((a, b) => b.score - a.score);

  // If we have a match for the target gender, return the best one
  if (potentialMatches.length > 0) {
    return potentialMatches[0].voice;
  }

  // Fallback: If no voice of the target gender is found, return the best overall English voice
  const allEnglishSorted = scoredVoices.sort((a, b) => b.score - a.score);
  if (allEnglishSorted.length > 0) {
    return allEnglishSorted[0].voice;
  }
  
  // Final fallback: any available voice
  return voices[0] || null;
}

/**
 * `useTTS` Hook
 *
 * A custom React hook for client-side Text-To-Speech (TTS) functionality using the browser's
 * native Web Speech API. This approach avoids server-side API calls to conserve quota.
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

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices(); // Initial attempt

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
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

    cancelTTS();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    onEndCallbackRef.current = onEndCallback || null;
    
    utterance.voice = findBestVoice(supportedVoices, voicePreference);
    
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onpause = () => {
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
    isLoading: supportedVoices.length === 0,
    setVoicePreference: handleSetVoicePreference,
    voicePreference,
  };
}
