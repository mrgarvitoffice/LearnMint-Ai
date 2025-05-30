
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
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    console.log("TTS: populateVoiceList triggered. Current preference:", voicePreference);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.log("TTS: Voices not loaded yet by browser. Waiting for onvoiceschanged.");
      return; // Voices might not be loaded yet
    }
    
    console.log("TTS: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default, URI: v.voiceURI.substring(0,30) })));
    setSupportedVoices(voices);

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';

    if (voicePreference === 'megumin') {
      console.log("TTS: Attempting to select 'megumin' (female) preference.");
      // 1. Try "Megumin" specifically (English)
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('megumin') && voice.lang.startsWith(currentLangPrefix));
      if (preferredVoice) console.log("TTS: Found voice matching 'Megumin':", preferredVoice.name);

      // 2. Fallback: "Zia" (English)
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        if (preferredVoice) console.log("TTS: Found voice matching 'Zia':", preferredVoice.name);
      }
      
      // 3. Fallback: US Female (if Megumin/Zia not found)
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('female'));
        if (preferredVoice) console.log("TTS: Found 'en-US Female' voice:", preferredVoice.name);
      }
      
      // 4. Fallback: Other English Female (try to avoid specific ones like Google UK English Female if other options exist)
      if (!preferredVoice) {
          const otherEnglishFemaleVoices = voices.filter(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
          if (otherEnglishFemaleVoices.length > 0) {
              // Prefer non-Google UK if possible
              preferredVoice = otherEnglishFemaleVoices.find(v => !v.name.toLowerCase().includes('google uk english female')) || otherEnglishFemaleVoices[0];
              if (preferredVoice) console.log("TTS: Found other English Female (attempted to exclude UK Google first):", preferredVoice.name);
          }
      }

    } else if (voicePreference === 'kai') {
      console.log("TTS: Attempting to select 'kai' (male) preference.");
      // 1. Try "Kai" specifically (English)
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
      if (preferredVoice) console.log("TTS: Found voice matching 'Kai':", preferredVoice.name);
      
      // 2. Fallback: US Male
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('male'));
        if (preferredVoice) console.log("TTS: Found 'en-US Male' voice:", preferredVoice.name);
      }
      // 3. Fallback: Other English Male
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
        if (preferredVoice) console.log("TTS: Found other English Male voice:", preferredVoice.name);
      }
    }

    // General fallbacks if no preference or preferred not found by name/gender
    if (!preferredVoice) {
      console.log("TTS: No specific preference match or preference not set, trying general fallbacks.");
      // Try default English voice first
      const defaultEnVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default);
      if (defaultEnVoice) {
        preferredVoice = defaultEnVoice;
        console.log("TTS: Fallback to default English voice:", preferredVoice.name);
      }
      // Then try any US English voice
      if (!preferredVoice) {
        const usVoices = voices.filter(v => v.lang.startsWith('en-US'));
        if (usVoices.length > 0) {
            preferredVoice = usVoices[0]; // Could be male or female
            if (preferredVoice) console.log("TTS: Fallback to first available en-US voice:", preferredVoice.name);
        }
      }
      // Then any other English voice
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
         if (otherEnVoices.length > 0) {
            preferredVoice = otherEnVoices[0]; // Could be male or female
            if (preferredVoice) console.log("TTS: Fallback to first available other English voice:", preferredVoice.name);
         }
      }
    }
    
    // Final fallback: browser's overall default voice if no English match
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices.find(v => v.default) || voices[0];
      if (preferredVoice) console.log("TTS: Fallback to system default or first available voice:", preferredVoice.name);
    }
    
    if (preferredVoice) {
      // Only update if the voice is actually different to avoid re-renders
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
        console.log("TTS: Setting selected voice to:", preferredVoice.name, "| Lang:", preferredVoice.lang, "| URI snippet:", preferredVoice.voiceURI.substring(0,30));
        setSelectedVoice(preferredVoice);
      } else {
        console.log("TTS: Preferred voice already selected or no better match found:", selectedVoice.name);
      }
    } else {
      console.warn("TTS: No suitable voice found after all checks.");
      if (selectedVoice !== null) setSelectedVoice(null); // Clear if no voice is suitable
    }

  }, [voicePreference, selectedVoice]); // Removed setSupportedVoices, setSelectedVoice from deps as they are setters

  useEffect(() => {
    // `onvoiceschanged` event is crucial because voices can load asynchronously.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Call once initially, in case voices are already there
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (utteranceRef.current && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && text.trim() !== "") {
      window.speechSynthesis.cancel(); 
      setIsSpeaking(false); 
      setIsPaused(false); 

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log("TTS: Speaking with voice:", selectedVoice.name);
      } else {
        console.log("TTS: Speaking with browser default voice (no specific voice selected/found).");
      }
      
      utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { setIsSpeaking(true); setIsPaused(true); }; // isSpeaking should remain true if paused
      utterance.onresume = () => { setIsPaused(false); setIsSpeaking(true); };
      
      // Give browser a moment to process cancel()
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
      // isPaused will be set true by the onpause event
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) { 
      window.speechSynthesis.resume();
      // isPaused will be set false by the onresume event
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
      if (!selectedVoice || selectedVoice.voiceURI !== voice.voiceURI) {
        setSelectedVoice(voice);
        console.log("TTS: User explicitly selected voice:", voice.name);
        // Do NOT set voicePreference here, let UI dropdowns control that
      }
    }
  }, [supportedVoices, selectedVoice]); // Removed setSelectedVoice from deps

  const handleSetVoicePreference = useCallback((preference: 'megumin' | 'kai' | null) => {
    console.log("TTS: Setting voice preference to:", preference);
    setVoicePreference(preference);
  }, []); // Removed setVoicePreference from deps

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
