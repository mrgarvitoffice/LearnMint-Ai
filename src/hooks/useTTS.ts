
"use client";

import { useState, useEffect, useCallback } from 'react';

interface TTSHook {
  speak: (text: string) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void;
  setVoicePreference: (preference: 'male' | 'female' | 'kai' | 'zia' | null) => void;
  voicePreference: 'male' | 'female' | 'kai' | 'zia' | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'male' | 'female' | 'kai' | 'zia' | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices might not be loaded yet, wait for onvoiceschanged
        return;
      }
      setSupportedVoices(voices);

      let preferredVoice: SpeechSynthesisVoice | undefined;
      const currentLangPrefix = 'en'; // Prioritize English voices

      // Determine target gender from preference
      const isZiaPreference = voicePreference === 'zia';
      const isKaiPreference = voicePreference === 'kai';
      const isFemalePreference = voicePreference === 'female' || isZiaPreference;
      const isMalePreference = voicePreference === 'male' || isKaiPreference;

      // 1. Try specific names if preference is set
      if (isZiaPreference) {
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
      }
      if (!preferredVoice && isKaiPreference) {
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
      }

      // 2. If specific name not found, try general gender preference for English voices
      if (!preferredVoice && isFemalePreference) {
        // Try US English Female first
        preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('female'));
        // Then try other English Female (excluding UK Google Female initially as per user feedback)
        if (!preferredVoice) {
          preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('google uk english female'));
        }
        // If still nothing, try any English Female (including UK Google Female as a last resort for this category)
        if (!preferredVoice) {
          preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
        }
      }

      if (!preferredVoice && isMalePreference) {
        preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('male'));
        if (!preferredVoice) {
          preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
        }
      }
      
      // 3. Absolute fallbacks if no gender preference or if all gendered searches fail
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith('en-US'));
      }
      if (!preferredVoice) { // Deprioritize Google UK Female as a general fallback too
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !v.name.toLowerCase().includes('google uk english female'));
      }
      if (!preferredVoice) { // Last resort any English voice
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix));
      }
      
      if (preferredVoice) {
        // Only update if it's different to prevent potential re-renders
        if (selectedVoice?.voiceURI !== preferredVoice.voiceURI) {
          setSelectedVoice(preferredVoice);
        }
      } else if (voices.length > 0 && !selectedVoice) { 
        setSelectedVoice(voices[0]); // Fallback to the very first available voice
      }
    }
  }, [voicePreference, selectedVoice]); // Include selectedVoice to potentially re-evaluate if it changes externally

  useEffect(() => {
    populateVoiceList(); // Initial attempt
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel(); // Clean up speech on unmount
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      window.speechSynthesis.cancel(); // Always cancel previous speech first
      setIsPaused(false); // Reset paused state

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onpause = () => { 
        // isSpeaking is set to true by onstart, so if onpause is hit, it means it was speaking then paused
        // It's important that isSpeaking becomes false *after* isPaused becomes true for UI logic
        setIsPaused(true);
        setIsSpeaking(false);
      };
      utterance.onresume = () => {
        setIsPaused(false);
        setIsSpeaking(true);
      };

      // Brief delay to allow cancel to process and avoid "interrupted" error
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.speak(utterance);
        }
      }, 50); 
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused]); // Dependencies for useCallback

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      // State updates (isPaused, isSpeaking) are handled by utterance.onpause
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      // State updates (isPaused, isSpeaking) are handled by utterance.onresume
    }
  }, [isPaused]);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    const voice = supportedVoices.find(v => v.voiceURI === uri);
    if (voice) {
      setSelectedVoice(voice);
      // Do NOT automatically set voicePreference here. Let UI drive that.
    }
  }, [supportedVoices]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference, voicePreference };
}
