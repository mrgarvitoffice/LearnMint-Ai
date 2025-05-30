
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface TTSHook {
  speak: (text: string) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void; // Renamed from stopTTS for clarity with API
  isSpeaking: boolean;
  isPaused: boolean;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void; // Allows direct selection if needed
  setVoicePreference: (preference: 'kai' | 'zia' | null) => void; // Simplified to specific names
  voicePreference: 'kai' | 'zia' | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'kai' | 'zia' | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      setSupportedVoices(voices);

      let preferredVoice: SpeechSynthesisVoice | undefined;
      const currentLangPrefix = 'en'; // Prioritize English voices

      // Determine target voice from preference
      const isZiaPreference = voicePreference === 'zia';
      const isKaiPreference = voicePreference === 'kai';

      if (isZiaPreference) {
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('female'));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('google uk english female'));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female')); // Last resort for female
      } else if (isKaiPreference) {
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('male'));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
      }

      // General fallbacks if preference doesn't yield a specific match or no preference set
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith('en-US'));
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !v.name.toLowerCase().includes('google uk english female'));
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix));
      if (!preferredVoice && voices.length > 0) preferredVoice = voices[0];

      if (preferredVoice && selectedVoice?.voiceURI !== preferredVoice.voiceURI) {
        setSelectedVoice(preferredVoice);
      } else if (!selectedVoice && preferredVoice) {
        setSelectedVoice(preferredVoice);
      }
    }
  }, [voicePreference, selectedVoice]); // Added selectedVoice to deps

  useEffect(() => {
    populateVoiceList();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [populateVoiceList]);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      window.speechSynthesis.cancel(); // Always cancel previous before speaking new
      setIsSpeaking(false); // Reset speaking state
      setIsPaused(false);   // Reset paused state

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

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
        utteranceRef.current = null;
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };
      utterance.onpause = () => {
        setIsPaused(true);
        setIsSpeaking(false); // Keep speaking as false when paused, true only when actively outputting
      };
      utterance.onresume = () => {
        setIsPaused(false);
        setIsSpeaking(true);
      };
      
      // Small delay to allow cancel to process fully
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
             window.speechSynthesis.speak(utterance);
        }
      }, 50);
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused]);

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      // onpause handler will set isPaused=true, isSpeaking=false
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      // onresume handler will set isPaused=false, isSpeaking=true
    }
  }, [isPaused]);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, []);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    const voice = supportedVoices.find(v => v.voiceURI === uri);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, [supportedVoices]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference, voicePreference };
}
