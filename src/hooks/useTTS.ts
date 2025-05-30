"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

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
  setVoicePreference: (preference: 'megumin' | 'kai' | null) => void;
  voicePreference: 'megumin' | 'kai' | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'megumin' | 'kai' | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      setSupportedVoices(voices);

      let preferredVoice: SpeechSynthesisVoice | undefined;
      const currentLangPrefix = 'en'; // Prioritize English voices

      if (voicePreference === 'megumin') {
        // Try "Megumin" specifically
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('megumin') && voice.lang.startsWith(currentLangPrefix));
        // Fallback: "Zia" (previous female target name)
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        // Fallback: US Female
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('female'));
        // Fallback: Other English Female (excluding Google UK English Female if other options exist)
        if (!preferredVoice) {
            const otherEnglishFemaleVoices = voices.filter(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('google uk english female'));
            if (otherEnglishFemaleVoices.length > 0) preferredVoice = otherEnglishFemaleVoices[0];
        }
         // If still nothing, try Google UK English Female as a last resort for female English
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('google uk english female'));

      } else if (voicePreference === 'kai') {
        // Try "Kai" specifically
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
        // Fallback: US Male
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('male'));
        // Fallback: Other English Male
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
      }

      // General fallbacks if no preference or preferred not found by name/gender
      if (!preferredVoice) {
        const usVoices = voices.filter(v => v.lang.startsWith('en-US'));
        if (usVoices.length > 0) preferredVoice = usVoices[0];
      }
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix) && !v.name.toLowerCase().includes('google uk english female'));
         if (otherEnVoices.length > 0) preferredVoice = otherEnVoices[0];
      }
      if (!preferredVoice) {
        const anyEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
        if (anyEnVoices.length > 0) preferredVoice = anyEnVoices[0];
      }
      if (!preferredVoice && voices.length > 0) {
        preferredVoice = voices[0]; // Absolute fallback
      }
      
      if (preferredVoice && (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI)) {
        setSelectedVoice(preferredVoice);
      } else if (!selectedVoice && preferredVoice) {
        setSelectedVoice(preferredVoice);
      }
    }
  }, [voicePreference, selectedVoice]); // Removed setSupportedVoices, setSelectedVoice from deps as they are setters

  useEffect(() => {
    populateVoiceList();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (utteranceRef.current) window.speechSynthesis.cancel();
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      window.speechSynthesis.cancel();
      setIsPaused(false);

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
       utterance.onpause = () => { setIsSpeaking(false); setIsPaused(true); };
      utterance.onresume = () => { setIsPaused(false); setIsSpeaking(true); };
      
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
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, [setIsSpeaking, setIsPaused]);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    const voice = supportedVoices.find(v => v.voiceURI === uri);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, [supportedVoices]);

  const handleSetVoicePreference = useCallback((preference: 'megumin' | 'kai' | null) => {
    setVoicePreference(preference);
  }, []);

  return { 
    speak, 
    pauseTTS, 
    resumeTTS, 
    cancelTTS, 
    isSpeaking, 
    isPaused, 
    supportedVoices, 
    selectedVoice, 
    setSelectedVoiceURI, 
    setVoicePreference: handleSetVoicePreference, 
    voicePreference 
  };
}