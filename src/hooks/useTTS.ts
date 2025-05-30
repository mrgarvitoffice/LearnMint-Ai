
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
  setVoicePreference: (preference: 'luma' | 'kai' | null) => void;
  voicePreference: 'luma' | 'kai' | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'luma' | 'kai' | null>(null); // 'luma' for female-implied, 'kai' for male-implied
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
    console.log("TTS: populateVoiceList triggered. Current preference:", voicePreference);
    console.log("TTS: Available voices in browser:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default, URI: v.voiceURI.substring(0,40) })));

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // Target English voices

    if (voicePreference === 'luma') {
      console.log("TTS: Attempting to select 'luma' (female-implied) preference.");
      // 1. Try "Luma" specifically (en-US then en-*)
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('luma') && voice.lang.startsWith('en-US')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('luma') && voice.lang.startsWith(currentLangPrefix));
      if (preferredVoice) console.log("TTS: Found voice matching 'Luma':", preferredVoice.name);

      // 2. Fallback: "Zia" (en-US then en-*)
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith('en-US')) ||
                         voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        if (preferredVoice) console.log("TTS: Fallback to 'Zia':", preferredVoice.name);
      }
      
      // 3. Fallback: US English Female
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('female'));
        if (preferredVoice) console.log("TTS: Fallback to 'en-US Female' voice:", preferredVoice.name);
      }
      
      // 4. Fallback: Other English Female (try to avoid specific undesired ones if other options exist)
      if (!preferredVoice) {
          const otherEnglishFemaleVoices = voices.filter(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
          if (otherEnglishFemaleVoices.length > 0) {
              preferredVoice = otherEnglishFemaleVoices.find(v => !v.name.toLowerCase().includes('google uk english female')) || otherEnglishFemaleVoices[0];
              if (preferredVoice) console.log("TTS: Fallback to other English Female (attempted to exclude UK Google first):", preferredVoice.name);
          }
      }

      // 5. Fallback: Any English Female (last resort for female if not already found)
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
        if (preferredVoice) console.log("TTS: Last resort fallback to any English Female voice:", preferredVoice.name);
      }

    } else if (voicePreference === 'kai') {
      console.log("TTS: Attempting to select 'kai' (male-implied) preference.");
      // 1. Try "Kai" specifically (en-US then en-*)
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith('en-US')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
      if (preferredVoice) console.log("TTS: Found voice matching 'Kai':", preferredVoice.name);
      
      // 2. Fallback: US English Male
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('male'));
        if (preferredVoice) console.log("TTS: Fallback to 'en-US Male' voice:", preferredVoice.name);
      }
      // 3. Fallback: Other English Male
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
        if (preferredVoice) console.log("TTS: Fallback to other English Male voice:", preferredVoice.name);
      }
    }

    // General fallbacks if no preference match or preference not set
    if (!preferredVoice) {
      console.log("TTS: No specific preference match, or preference not set, trying general English fallbacks.");
      const defaultEnUSVoice = voices.find(v => v.lang.startsWith('en-US') && v.default);
      if (defaultEnUSVoice) {
        preferredVoice = defaultEnUSVoice;
        console.log("TTS: Fallback to default en-US voice:", preferredVoice.name);
      }
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default);
        if (preferredVoice) console.log("TTS: Fallback to default English (any region) voice:", preferredVoice.name);
      }

      // Try any US English voice not explicitly male if 'luma' was preferred and no female found
      if (!preferredVoice && voicePreference === 'luma') {
        const usNonMaleVoices = voices.filter(v => v.lang.startsWith('en-US') && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('kai'));
        if (usNonMaleVoices.length > 0) {
            preferredVoice = usNonMaleVoices[0];
            console.log("TTS: For 'luma' preference, fallback to first available non-male en-US voice:", preferredVoice.name);
        }
      }
      // Or any other English voice not explicitly male
      if (!preferredVoice && voicePreference === 'luma') {
         const otherEnNonMaleVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix) && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('kai'));
         if (otherEnNonMaleVoices.length > 0) {
            preferredVoice = otherEnNonMaleVoices[0];
            console.log("TTS: For 'luma' preference, fallback to first available non-male other English voice:", preferredVoice.name);
         }
      }

      // Fallback to any US English voice if still nothing
      if (!preferredVoice) {
        const usVoices = voices.filter(v => v.lang.startsWith('en-US'));
        if (usVoices.length > 0) {
            preferredVoice = usVoices[0];
            if (preferredVoice) console.log("TTS: Fallback to first available en-US voice:", preferredVoice.name);
        }
      }
      // Fallback to any other English voice
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
         if (otherEnVoices.length > 0) {
            preferredVoice = otherEnVoices[0];
            if (preferredVoice) console.log("TTS: Fallback to first available other English voice:", preferredVoice.name);
         }
      }
    }
    
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices.find(v => v.default) || voices[0]; // Browser's absolute default or just the first voice
      if (preferredVoice) console.log("TTS: Last resort - Fallback to system default or first available voice:", preferredVoice.name);
    }
    
    if (preferredVoice) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
        console.log("TTS: Setting selected voice to:", preferredVoice.name, "| Lang:", preferredVoice.lang, "| URI snippet:", preferredVoice.voiceURI.substring(0,40));
        setSelectedVoice(preferredVoice);
      } else {
        console.log("TTS: Preferred voice logic resulted in currently selected voice. No change:", selectedVoice.name);
      }
    } else {
      console.warn("TTS: No suitable voice found after all checks.");
      if (selectedVoice !== null) setSelectedVoice(null);
    }

  }, [voicePreference, selectedVoice, setSupportedVoices, setSelectedVoice]); // Added selectedVoice

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Initial call
      window.speechSynthesis.onvoiceschanged = populateVoiceList; // Listen for changes
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (utteranceRef.current && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel(); // Cancel speech on unmount if active
        }
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && text.trim() !== "") {
      console.log("TTS: Speak called for:", `"${text.substring(0, 30)}..."`, "With selected voice:", selectedVoice?.name || "Default");
      
      window.speechSynthesis.cancel(); // Always cancel previous speech
      setIsSpeaking(false); // Reset speaking state immediately
      setIsPaused(false);   // Reset paused state

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn("TTS: No voice selected, using browser default for this utterance.");
      }
      
      utterance.onstart = () => { console.log("TTS: onstart event for:", `"${utterance.text.substring(0, 30)}..."`); setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { console.log("TTS: onend event for:", `"${utterance.text.substring(0, 30)}..."`); setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('TTS: Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { console.log("TTS: onpause event for:", `"${utterance.text.substring(0, 30)}..."`); setIsPaused(true); /* isSpeaking should remain true */ };
      utterance.onresume = () => { console.log("TTS: onresume event for:", `"${utterance.text.substring(0, 30)}..."`); setIsPaused(false); setIsSpeaking(true);}; // Make sure isSpeaking becomes true
      
      // Using a small timeout can sometimes help with "interrupted" errors or race conditions
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis && utteranceRef.current === utterance) { // Ensure this utterance is still the one we want to speak
           console.log("TTS: Calling window.speechSynthesis.speak now for:", `"${utterance.text.substring(0, 30)}..."`);
           window.speechSynthesis.speak(utterance);
        } else if (utteranceRef.current !== utterance) {
            console.log("TTS: Speak call aborted due to new utterance queued before timeout for:", `"${utterance.text.substring(0,30)}..."`);
        }
      }, 50); 
    } else {
      console.warn("TTS: Speak called but conditions not met (no window, no speech synth, or empty text). Text was:", `"${text ? text.substring(0,30) : 'EMPTY' }..."`);
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused]); 

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      console.log("TTS: pauseTTS called");
      window.speechSynthesis.pause();
      // onpause event should handle setIsPaused(true)
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) { 
      console.log("TTS: resumeTTS called");
      window.speechSynthesis.resume();
      // onresume event should handle setIsPaused(false) and setIsSpeaking(true)
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
        // Do NOT change voicePreference here; let UI drive preference changes
      }
    }
  }, [supportedVoices, selectedVoice, setSelectedVoice]);

  const handleSetVoicePreference = useCallback((preference: 'luma' | 'kai' | null) => {
    console.log("TTS: Setting voice preference to:", preference);
    setVoicePreference(preference);
    // populateVoiceList will be triggered by useEffect due to voicePreference change (or selectedVoice)
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

    