
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
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.log("TTS: Voices not loaded yet by browser. Waiting for onvoiceschanged.");
      return;
    }

    setSupportedVoices(voices);
    console.log("TTS: Available voices in browser:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default, URI: v.voiceURI.substring(0,30) })));
    console.log("TTS: Current voicePreference to apply:", voicePreference);

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // Focus on English voices

    if (voicePreference === 'megumin') {
      console.log("TTS: Attempting to select 'megumin' (female-implied) preference.");
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
              preferredVoice = otherEnglishFemaleVoices.find(v => !v.name.toLowerCase().includes('google uk english female')) || otherEnglishFemaleVoices[0];
              if (preferredVoice) console.log("TTS: Found other English Female (attempted to exclude UK Google first):", preferredVoice.name);
          }
      }
       // 5. Last resort for English female: pick any 'female' English voice if previous failed
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
        if (preferredVoice) console.log("TTS: Fallback to any English Female voice:", preferredVoice.name);
      }


    } else if (voicePreference === 'kai') {
      console.log("TTS: Attempting to select 'kai' (male-implied) preference.");
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
      const defaultEnUSVoice = voices.find(v => v.lang.startsWith('en-US') && v.default);
      if (defaultEnUSVoice) {
        preferredVoice = defaultEnUSVoice;
        console.log("TTS: Fallback to default en-US voice:", preferredVoice.name);
      }
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default);
        if (preferredVoice) console.log("TTS: Fallback to default English (any region) voice:", preferredVoice.name);
      }
      if (!preferredVoice) {
        const usVoices = voices.filter(v => v.lang.startsWith('en-US'));
        if (usVoices.length > 0) {
            preferredVoice = usVoices.find(v => v.name.toLowerCase().includes('female') && voicePreference === 'megumin') || // Try female US if megumin pref
                             usVoices.find(v => v.name.toLowerCase().includes('male') && voicePreference === 'kai') ||   // Try male US if kai pref
                             usVoices[0]; // Fallback to first US voice
            if (preferredVoice) console.log("TTS: Fallback to first available en-US voice (gender preferred if possible):", preferredVoice.name);
        }
      }
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
         if (otherEnVoices.length > 0) {
            preferredVoice = otherEnVoices.find(v => v.name.toLowerCase().includes('female') && voicePreference === 'megumin') ||
                             otherEnVoices.find(v => v.name.toLowerCase().includes('male') && voicePreference === 'kai') ||
                             otherEnVoices[0];
            if (preferredVoice) console.log("TTS: Fallback to first available other English voice (gender preferred if possible):", preferredVoice.name);
         }
      }
    }
    
    // Final fallback: browser's overall default voice if no English match
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices.find(v => v.default) || voices[0];
      if (preferredVoice) console.log("TTS: Fallback to system default or first available voice:", preferredVoice.name);
    }
    
    if (preferredVoice) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
        console.log("TTS: Setting selected voice to:", preferredVoice.name, "| Lang:", preferredVoice.lang, "| URI snippet:", preferredVoice.voiceURI.substring(0,30));
        setSelectedVoice(preferredVoice);
      } else {
        console.log("TTS: Preferred voice already selected or no better match found for preference. Current:", selectedVoice.name);
      }
    } else {
      console.warn("TTS: No suitable voice found after all checks.");
      if (selectedVoice !== null) setSelectedVoice(null);
    }

  }, [voicePreference, selectedVoice, setSupportedVoices, setSelectedVoice]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList();
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
      console.log("TTS: Speak called for:", `"${text.substring(0, 30)}..."`, "With selected voice:", selectedVoice?.name || "Default");
      window.speechSynthesis.cancel();
      setIsSpeaking(false); 
      setIsPaused(false);

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => { console.log("TTS: onstart event"); setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { console.log("TTS: onend event"); setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('TTS: Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { console.log("TTS: onpause event"); setIsSpeaking(true); setIsPaused(true); };
      utterance.onresume = () => { console.log("TTS: onresume event"); setIsPaused(false); setIsSpeaking(true); };
      
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
           console.log("TTS: Calling window.speechSynthesis.speak now for:", `"${utterance.text.substring(0, 30)}..."`);
           window.speechSynthesis.speak(utterance);
        }
      }, 50);
    } else {
      console.warn("TTS: Speak called but conditions not met (no window, no speech synth, or empty text). Text was:", text);
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused]);

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      console.log("TTS: pauseTTS called");
      window.speechSynthesis.pause();
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) { 
      console.log("TTS: resumeTTS called");
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log("TTS: cancelTTS called");
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
        console.log("TTS: User explicitly selected voice via URI:", voice.name);
      }
    }
  }, [supportedVoices, selectedVoice, setSelectedVoice]);

  const handleSetVoicePreference = useCallback((preference: 'megumin' | 'kai' | null) => {
    console.log("TTS: Setting voice preference to:", preference);
    setVoicePreference(preference);
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
    setVoicePreference: handleSetVoicePreference, 
    voicePreference 
  };
}

    