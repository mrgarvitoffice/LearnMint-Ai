
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
      if (voices.length === 0) {
        // console.log("TTS: Voices not loaded yet.");
        return;
      }
      // console.log("TTS: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
      setSupportedVoices(voices);

      let preferredVoice: SpeechSynthesisVoice | undefined;
      const currentLangPrefix = 'en'; // Prioritize English voices

      console.log(`TTS: Current voicePreference: ${voicePreference}`);

      if (voicePreference === 'megumin') {
        console.log("TTS: Attempting to select 'megumin' (female) voice.");
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
        
        // 4. Fallback: Other English Female (try to avoid specific ones if other options exist)
        if (!preferredVoice) {
            const otherEnglishFemaleVoices = voices.filter(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('google uk english female'));
            if (otherEnglishFemaleVoices.length > 0) {
                preferredVoice = otherEnglishFemaleVoices[0];
                console.log("TTS: Found other English Female (excluding UK Google):", preferredVoice.name);
            } else {
                 // If the only English female is Google UK, then use it
                preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
                if (preferredVoice) console.log("TTS: Found any English Female (could be UK Google):", preferredVoice.name);
            }
        }

      } else if (voicePreference === 'kai') {
        console.log("TTS: Attempting to select 'kai' (male) voice.");
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
        console.log("TTS: No specific preference match, trying general fallbacks.");
        const usVoices = voices.filter(v => v.lang.startsWith('en-US'));
        if (usVoices.length > 0) {
            preferredVoice = usVoices.find(v => v.name.toLowerCase().includes('female')) || usVoices.find(v => v.name.toLowerCase().includes('male')) || usVoices[0];
            if (preferredVoice) console.log("TTS: Fallback to en-US voice:", preferredVoice.name);
        }
      }
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
         if (otherEnVoices.length > 0) {
            preferredVoice = otherEnVoices.find(v => v.name.toLowerCase().includes('female')) || otherEnVoices.find(v => v.name.toLowerCase().includes('male')) || otherEnVoices[0];
            if (preferredVoice) console.log("TTS: Fallback to other English voice:", preferredVoice.name);
         }
      }
      if (!preferredVoice && voices.length > 0) {
        preferredVoice = voices.find(v => v.default) || voices[0]; // Try default system voice first
        if (preferredVoice) console.log("TTS: Fallback to system default or first available voice:", preferredVoice.name);
      }
      
      if (preferredVoice) {
        if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
          // console.log("TTS: Setting selected voice to:", preferredVoice.name, preferredVoice.lang);
          setSelectedVoice(preferredVoice);
        }
      } else if (!selectedVoice && voices.length > 0) {
        // If absolutely no preference could be matched, but we didn't have a selected voice before,
        // pick the browser's default or the first available English voice to ensure something is selected.
        const defaultEnglish = voices.find(v => v.lang.startsWith('en') && v.default) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
        setSelectedVoice(defaultEnglish || voices[0]);
        console.log("TTS: No preferred voice found, selecting a default/first English voice:", (defaultEnglish || voices[0])?.name);
      }
    }
  }, [voicePreference, setSupportedVoices, setSelectedVoice, selectedVoice]); // Added selectedVoice to dep array for stability

  useEffect(() => {
    populateVoiceList(); // Initial population
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList; // Repopulate if voices change
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (utteranceRef.current) window.speechSynthesis.cancel();
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && text.trim() !== "") {
      window.speechSynthesis.cancel(); // Cancel any ongoing or queued speech immediately
      setIsPaused(false); // Reset pause state

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
      utterance.onpause = () => { setIsSpeaking(true); setIsPaused(true); };
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
      // When user explicitly selects a voice, infer preference
      if (voice.name.toLowerCase().includes('kai') || voice.name.toLowerCase().includes('male')) {
        setVoicePreference('kai');
      } else if (voice.name.toLowerCase().includes('megumin') || voice.name.toLowerCase().includes('zia') || voice.name.toLowerCase().includes('female')) {
        setVoicePreference('megumin');
      } else {
        setVoicePreference(null); // Or keep current if no strong match
      }
    }
  }, [supportedVoices, setSelectedVoice, setVoicePreference]);

  const handleSetVoicePreference = useCallback((preference: 'megumin' | 'kai' | null) => {
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
