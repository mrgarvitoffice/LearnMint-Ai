
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
  setVoicePreference: (preference: 'zia' | 'kai' | null) => void;
  voicePreference: 'zia' | 'kai' | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.log("TTS: No voices available yet. Waiting for onvoiceschanged.");
      // Attempt to re-trigger voice loading if it's empty and onvoiceschanged hasn't fired
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
      }
      return;
    }

    setSupportedVoices(voices);
    console.log("TTS: populateVoiceList triggered. Current preference:", voicePreference);
    console.log("TTS: Available voices in browser:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default, URI: v.voiceURI.substring(0,40) })));

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';

    if (voicePreference === 'zia') {
      console.log("TTS: Attempting to select 'zia' (female-implied) preference.");
      // 1. Exact "Zia" name match (en-US preferred)
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
      if (preferredVoice) console.log("TTS: Found voice matching 'Zia':", preferredVoice.name);

      // 2. Explicit "female" in en-US
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && voice.name.toLowerCase().includes('female'));
        if (preferredVoice) console.log("TTS: Zia not found, found 'en-US Female' voice:", preferredVoice.name);
      }
      
      // 3. Explicit "female" in other English (try to avoid specific known non-preferred ones if others exist)
      if (!preferredVoice) {
        const otherEnglishFemaleVoices = voices.filter(voice => 
            voice.lang.startsWith(currentLangPrefix) && 
            voice.name.toLowerCase().includes('female') &&
            !voice.name.toLowerCase().includes('google uk english female') 
        );
        if (otherEnglishFemaleVoices.length > 0) {
            preferredVoice = otherEnglishFemaleVoices.find(v => !/david|mark|kai|male/i.test(v.name)) || otherEnglishFemaleVoices[0]; 
            if (preferredVoice) console.log("TTS: Fallback to other English Female (filtered):", preferredVoice.name);
        } else { 
           preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
           if (preferredVoice) console.log("TTS: Fallback to any English Female (could be UK Google Female if only one):", preferredVoice.name);
        }
      }

      // 4. Any en-US voice that doesn't sound explicitly male by name
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && !/david|mark|kai|male|google uk english male/i.test(v.name.toLowerCase()));
        if(preferredVoice) console.log("TTS: No specific female found, fallback to first available non-explicitly-male en-US voice:", preferredVoice.name);
      }
      
      // 5. Any en-* voice that doesn't sound explicitly male by name
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !/david|mark|kai|male|google uk english male/i.test(v.name.toLowerCase()));
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
      // 3. Common male names for MS voices like David, Mark
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && (voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('mark')));
        if (preferredVoice) console.log("TTS: Kai/Male not found, found 'David' or 'Mark' en-US voice:", preferredVoice.name);
      }
      // 4. Explicit "male" in other English
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
        if (preferredVoice) console.log("TTS: Fallback to other English Male voice:", preferredVoice.name);
      }
       // 5. Any en-US voice that doesn't sound explicitly female by name
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && !/zia|luma|female|google uk english female/i.test(v.name.toLowerCase()));
        if(preferredVoice) console.log("TTS: No specific male found, fallback to first available non-explicitly-female en-US voice:", preferredVoice.name);
      }
      // 6. Any en-* voice that doesn't sound explicitly female by name
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !/zia|luma|female|google uk english female/i.test(v.name.toLowerCase()));
        if(preferredVoice) console.log("TTS: Still no match, fallback to first available non-explicitly-female other English voice:", preferredVoice.name);
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

  }, [voicePreference, selectedVoice, setSelectedVoice, setSupportedVoices]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Initial attempt
      window.speechSynthesis.onvoiceschanged = populateVoiceList; // Handler for async voice loading
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
  }, [populateVoiceList]);

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
             console.warn("TTS: Speech was blocked by the browser. User interaction might be required to enable audio playback. Try clicking somewhere on the page first.");
        }
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { console.log("TTS: onpause event for:", `"${utterance.text.substring(0, 30)}..."`); setIsPaused(true); setIsSpeaking(true); }; // isSpeaking remains true
      utterance.onresume = () => { console.log("TTS: onresume event for:", `"${utterance.text.substring(0, 30)}..."`); setIsPaused(false); setIsSpeaking(true);}; // isSpeaking remains true
      
      // Small delay to allow cancel to process fully before speaking
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
      // onpause event handler will set isPaused to true
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) { 
      console.log("TTS: resumeTTS called");
      window.speechSynthesis.resume();
      // onresume event handler will set isPaused to false
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

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | null) => {
    console.log("TTS: Setting voice preference to:", preference);
    setVoicePreference(preference);
  }, [setVoicePreference]);

  // Effect to re-populate/re-select voice when preference changes and voices are already loaded
  useEffect(() => {
    console.log("TTS: voicePreference changed to:", voicePreference, ". Triggering populateVoiceList if supportedVoices available.");
    if(supportedVoices.length > 0){
        populateVoiceList();
    }
  }, [voicePreference, supportedVoices.length, populateVoiceList]);


  return { 
    speak, 
    pauseTTS, 
    resumeTTS, 
    cancelTTS, 
    isSpeaking, 
    isPaused, 
    supportedVoices, 
    selectedVoice, 
    setSelectedVoiceURI: useCallback((uri: string) => { 
        const voice = supportedVoices.find(v => v.voiceURI === uri);
        if (voice) {
          if (!selectedVoice || selectedVoice.voiceURI !== voice.voiceURI) {
            setSelectedVoice(voice);
            console.log("TTS: User explicitly selected voice via URI:", voice.name);
          }
        }
      }, [supportedVoices, selectedVoice, setSelectedVoice]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
