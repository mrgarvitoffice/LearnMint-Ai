
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
  setVoicePreference: (preference: 'kai' | 'zia' | null) => void;
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
      if (voices.length === 0) {
        // Voices might not be loaded yet, common issue.
        // The onvoiceschanged event will handle this.
        return;
      }
      setSupportedVoices(voices);

      let preferredVoice: SpeechSynthesisVoice | undefined;
      const currentLangPrefix = 'en'; // Prioritize English voices

      if (voicePreference === 'zia') {
        // Try "Zia" specifically
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        // Fallback: US Female
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('female'));
        // Fallback: Other English Female (excluding Google UK English Female if other options exist)
        if (!preferredVoice) {
            const otherEnglishFemaleVoices = voices.filter(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('google uk english female'));
            if (otherEnglishFemaleVoices.length > 0) preferredVoice = otherEnglishFemaleVoices[0];
        }
        // Fallback: Any English Female (if the above didn't find anything, this might pick Google UK English Female)
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));

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
      
      // Only update selectedVoice if it changes or wasn't set
      if (preferredVoice && (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI)) {
        setSelectedVoice(preferredVoice);
      } else if (!selectedVoice && preferredVoice) {
        // Handles initial selection if selectedVoice was null
        setSelectedVoice(preferredVoice);
      }
    }
  }, [voicePreference, selectedVoice]); // Added selectedVoice to prevent re-setting if already optimal

  useEffect(() => {
    // Initial population
    populateVoiceList();
    // Event listener for when voices change
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (utteranceRef.current) {
          window.speechSynthesis.cancel(); // Cancel any ongoing speech on unmount
        }
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      window.speechSynthesis.cancel(); // Always cancel previous before speaking new
      setIsPaused(false);   // Reset paused state

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      // You can set other utterance properties here if needed (rate, pitch)

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
        // Note: isSpeaking should become false when paused, isPaused true
        setIsSpeaking(false); 
        setIsPaused(true);
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
  }, [selectedVoice, setIsSpeaking, setIsPaused]); // setIsPaused added

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      // onpause handler will set isPaused=true, isSpeaking=false
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) { // Check isPaused not isSpeaking
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
      // Do NOT try to infer and setVoicePreference here.
      // voicePreference is user's intent (Zia/Kai), selectedVoice is actual.
    }
  }, [supportedVoices]);

  const handleSetVoicePreference = useCallback((preference: 'kai' | 'zia' | null) => {
    setVoicePreference(preference);
    // populateVoiceList will be triggered by the change in voicePreference
  }, [setVoicePreference]);


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
    setVoicePreference: handleSetVoicePreference, // Use the wrapped version
    voicePreference 
  };
}
