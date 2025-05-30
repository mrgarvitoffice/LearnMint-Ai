"use client";

import { useState, useEffect, useCallback } from 'react';

interface TTSHook {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void;
  setVoicePreference: (preference: 'male' | 'female' | null) => void;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'male' | 'female' | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      setSupportedVoices(voices);
      if (voices.length > 0) {
        // Attempt to set a default voice based on preference or just the first available
        const preferred = voices.find(voice => 
          voicePreference === 'female' && voice.name.toLowerCase().includes('female') ||
          voicePreference === 'male' && voice.name.toLowerCase().includes('male')
        );
        setSelectedVoice(preferred || voices.find(v => v.lang.startsWith('en')) || voices[0]);
      }
    }
  }, [voicePreference]);

  useEffect(() => {
    populateVoiceList();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel(); // Cancel any ongoing speech on unmount
      }
    };
  }, [populateVoiceList]);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Cancel previous speech if any
      }
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedVoice]);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    const voice = supportedVoices.find(v => v.voiceURI === uri);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, [supportedVoices]);

  return { speak, cancel, isSpeaking, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference };
}
