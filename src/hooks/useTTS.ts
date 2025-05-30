
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
  const [voicePreference, setVoicePreference] = useState<'luma' | 'kai' | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // This can happen if voices are not yet loaded.
      // The onvoiceschanged event should handle this.
      console.log("TTS: No voices available yet. Waiting for onvoiceschanged.");
      return;
    }

    setSupportedVoices(voices);
    console.log("TTS: populateVoiceList triggered. Current preference:", voicePreference);
    console.log("TTS: Available voices in browser:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default, URI: v.voiceURI.substring(0,40) })));

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';

    if (voicePreference === 'luma') {
      console.log("TTS: Attempting to select 'luma' (female-implied) preference.");
      // 1. Exact "Luma" name match (en-US preferred)
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('luma') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('luma') && voice.lang.startsWith(currentLangPrefix));
      if (preferredVoice) console.log("TTS: Found voice matching 'Luma':", preferredVoice.name);

      // 2. Secondary "Zia" name match (en-US preferred)
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(enUSLangPrefix)) ||
                         voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        if (preferredVoice) console.log("TTS: Luma not found, found voice matching 'Zia':", preferredVoice.name);
      }
      
      // 3. Explicit "female" in en-US
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && voice.name.toLowerCase().includes('female'));
        if (preferredVoice) console.log("TTS: No Luma/Zia, found 'en-US Female' voice:", preferredVoice.name);
      }
      
      // 4. Explicit "female" in other English (try to avoid specific known non-preferred ones if others exist)
      if (!preferredVoice) {
        const otherEnglishFemaleVoices = voices.filter(voice => 
            voice.lang.startsWith(currentLangPrefix) && 
            voice.name.toLowerCase().includes('female') &&
            !voice.name.toLowerCase().includes('google uk english female') // Deprioritize
        );
        if (otherEnglishFemaleVoices.length > 0) {
            preferredVoice = otherEnglishFemaleVoices[0];
            if (preferredVoice) console.log("TTS: Fallback to other English Female (filtered):", preferredVoice.name);
        } else { // If only Google UK English Female is left, or none from the filtered list
           preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
           if (preferredVoice) console.log("TTS: Fallback to any English Female (could be UK Google Female):", preferredVoice.name);
        }
      }

      // 5. Any en-US voice that doesn't sound explicitly male by name
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && !/david|mark|kai|male/i.test(v.name));
        if(preferredVoice) console.log("TTS: No specific female found, fallback to first available non-explicitly-male en-US voice:", preferredVoice.name);
      }
      
      // 6. Any en-* voice that doesn't sound explicitly male by name
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !/david|mark|kai|male/i.test(v.name));
        if(preferredVoice) console.log("TTS: Still no match, fallback to first available non-explicitly-male other English voice:", preferredVoice.name);
      }

    } else if (voicePreference === 'kai') {
      console.log("TTS: Attempting to select 'kai' (male-implied) preference.");
      // 1. Exact "Kai" name match
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
      if (preferredVoice) console.log("TTS: Found voice matching 'Kai':", preferredVoice.name);
      
      // 2. Explicit "male" in en-US
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && voice.name.toLowerCase().includes('male'));
        if (preferredVoice) console.log("TTS: Kai not found, found 'en-US Male' voice:", preferredVoice.name);
      }
      // 3. Common male names for MS voices
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && (voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('mark')));
        if (preferredVoice) console.log("TTS: Kai/Male not found, found 'David' or 'Mark' en-US voice:", preferredVoice.name);
      }
      // 4. Explicit "male" in other English
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
        if (preferredVoice) console.log("TTS: Fallback to other English Male voice:", preferredVoice.name);
      }
    }

    // General fallbacks if no preference match or preference not set, or specific gendered search failed
    if (!preferredVoice) {
      console.log("TTS: No specific preference/gender match, trying general English fallbacks.");
      const defaultEnUSVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default);
      if (defaultEnUSVoice) {
        preferredVoice = defaultEnUSVoice;
        console.log("TTS: Fallback to default en-US voice:", preferredVoice.name);
      }
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default);
        if (preferredVoice) console.log("TTS: Fallback to default English (any region) voice:", preferredVoice.name);
      }
      if (!preferredVoice) {
        const usVoices = voices.filter(v => v.lang.startsWith(enUSLangPrefix));
        if (usVoices.length > 0) {
            preferredVoice = usVoices[0]; 
            if (preferredVoice) console.log("TTS: Fallback to first available en-US voice:", preferredVoice.name);
        }
      }
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
         if (otherEnVoices.length > 0) {
            preferredVoice = otherEnVoices[0];
            if (preferredVoice) console.log("TTS: Fallback to first available other English voice:", preferredVoice.name);
         }
      }
    }
    
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices.find(v => v.default) || voices[0]; 
      if (preferredVoice) console.log("TTS: Last resort - Fallback to system default or first available voice:", preferredVoice.name);
    }
    
    if (preferredVoice) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
        console.log("TTS: Setting selected voice to:", preferredVoice.name, "| Lang:", preferredVoice.lang, "| URI snippet:", preferredVoice.voiceURI.substring(0,40));
        setSelectedVoice(preferredVoice);
      } else {
        console.log("TTS: Preferred voice logic resulted in currently selected voice or no change needed:", selectedVoice.name);
      }
    } else {
      console.warn("TTS: No suitable voice found after all checks.");
      if (selectedVoice !== null) setSelectedVoice(null); 
    }

  }, [voicePreference, setSupportedVoices, setSelectedVoice, selectedVoice]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Initial population attempt
      populateVoiceList();
      // Event listener for when voices are loaded/changed
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (utteranceRef.current && window.speechSynthesis.speaking) {
          console.log("TTS: Component unmounting, cancelling speech.");
          window.speechSynthesis.cancel();
        }
      }
    };
  }, [populateVoiceList]); // populateVoiceList has selectedVoice in its deps, so this might run if selectedVoice changes.

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && text.trim() !== "") {
      console.log("TTS: Speak called for:", `"${text.substring(0, 30)}..."`, "With selected voice:", selectedVoice?.name || "Default");
      
      window.speechSynthesis.cancel(); // Always cancel previous before speaking new
      setIsSpeaking(false); 
      setIsPaused(false);   

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log("TTS: Utterance will use voice:", selectedVoice.name);
      } else {
        console.warn("TTS: No voice selected by hook, utterance will use browser default.");
      }
      
      utterance.onstart = () => { console.log("TTS: onstart event for:", `"${utterance.text.substring(0, 30)}..."`); setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { console.log("TTS: onend event for:", `"${utterance.text.substring(0, 30)}..."`); setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('TTS: Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        if(event.error === 'not-allowed'){
             console.warn("TTS: Speech was blocked by the browser. User interaction might be required to enable audio playback.");
        }
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { console.log("TTS: onpause event for:", `"${utterance.text.substring(0, 30)}..."`); setIsPaused(true); setIsSpeaking(true); };
      utterance.onresume = () => { console.log("TTS: onresume event for:", `"${utterance.text.substring(0, 30)}..."`); setIsPaused(false); setIsSpeaking(true);};
      
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis && utteranceRef.current === utterance) { 
           console.log("TTS: Calling window.speechSynthesis.speak now for:", `"${utterance.text.substring(0, 30)}..."`);
           window.speechSynthesis.speak(utterance);
        } else if (utteranceRef.current !== utterance) {
            console.log("TTS: Speak call aborted due to new utterance queued before timeout for:", `"${utterance.text.substring(0,30)}..."`);
        }
      }, 50); 
    } else {
      console.warn("TTS: Speak called but conditions not met. Text:", `"${text ? text.substring(0,30) : 'EMPTY' }..."`, "SelectedVoice:", selectedVoice?.name);
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

  const handleSetVoicePreference = useCallback((preference: 'luma' | 'kai' | null) => {
    console.log("TTS: Setting voice preference to:", preference);
    setVoicePreference(preference);
  }, [setVoicePreference]);

  useEffect(() => {
    console.log("TTS: voicePreference changed to:", voicePreference, "Triggering populateVoiceList.");
    populateVoiceList();
  }, [voicePreference, populateVoiceList]);

  return { 
    speak, 
    pauseTTS, 
    resumeTTS, 
    cancelTTS, 
    isSpeaking, 
    isPaused, 
    supportedVoices, 
    selectedVoice, 
    setSelectedVoiceURI: (uri: string) => { 
        const voice = supportedVoices.find(v => v.voiceURI === uri);
        if (voice) {
          if (!selectedVoice || selectedVoice.voiceURI !== voice.voiceURI) {
            setSelectedVoice(voice);
            console.log("TTS: User explicitly selected voice via URI:", voice.name);
          }
        }
      },
    setVoicePreference: handleSetVoicePreference, 
    voicePreference 
  };
}
