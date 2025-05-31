
"use client"; // This hook is client-side only due to browser's SpeechSynthesis API.

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @interface TTSHook
 * Defines the return type of the useTTS hook.
 */
interface TTSHook {
  speak: (text: string) => void;                     // Function to initiate speech.
  pauseTTS: () => void;                               // Function to pause ongoing speech.
  resumeTTS: () => void;                              // Function to resume paused speech.
  cancelTTS: () => void;                              // Function to stop and clear speech.
  isSpeaking: boolean;                                // True if speech is currently active (speaking or paused).
  isPaused: boolean;                                  // True if speech is paused.
  supportedVoices: SpeechSynthesisVoice[];            // Array of available voices in the browser.
  selectedVoice: SpeechSynthesisVoice | null;         // The currently selected voice object.
  setSelectedVoiceURI: (uri: string) => void;         // Function to select a voice by its URI.
  setVoicePreference: (preference: 'zia' | 'kai' | 'luma' | null) => void; // Function to set a preferred voice type.
  voicePreference: 'zia' | 'kai' | 'luma' | null;     // The current voice preference.
}

/**
 * `useTTS` Hook
 * 
 * A custom React hook for Text-To-Speech (TTS) functionality using the browser's SpeechSynthesis API.
 * Manages speech state, voice selection, and provides controls for speech playback.
 */
export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | 'luma' | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
      }
      return;
    }

    setSupportedVoices(voices);
    console.log("TTS: populateVoiceList. Preference:", voicePreference, "Voices count:", voices.length);

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';

    if (voicePreference === 'zia' || voicePreference === 'luma') { // Handle 'zia' and 'luma' similarly for female voices
      console.log(`TTS: Attempting to select female-implied preference ('${voicePreference}').`);
      const primaryNameMatch = voicePreference === 'zia' ? 'zia' : 'luma';
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix));
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && voice.name.toLowerCase().includes('female'));
      if (!preferredVoice) {
         const otherEnglishFemaleVoices = voices.filter(voice => 
            voice.lang.startsWith(currentLangPrefix) && 
            voice.name.toLowerCase().includes('female') &&
            !voice.name.toLowerCase().includes('google uk english female') 
        );
        if (otherEnglishFemaleVoices.length > 0) preferredVoice = otherEnglishFemaleVoices.find(v => !/david|mark|kai|male/i.test(v.name)) || otherEnglishFemaleVoices[0];
      }
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && !/david|mark|kai|male|google uk english male/i.test(v.name.toLowerCase()));
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !/david|mark|kai|male|google uk english male/i.test(v.name.toLowerCase()));
    
    } else if (voicePreference === 'kai') {
      console.log("TTS: Attempting to select 'kai' (male-implied) preference.");
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && voice.name.toLowerCase().includes('male'));
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && (voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('mark')));
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && !/zia|luma|female|google uk english female/i.test(v.name.toLowerCase()));
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !/zia|luma|female|google uk english female/i.test(v.name.toLowerCase()));
    }

    if (!preferredVoice) {
      console.log("TTS: No specific preference/gender match, trying general English fallbacks.");
      const defaultEnUSVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default);
      if (defaultEnUSVoice) preferredVoice = defaultEnUSVoice;
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default);
      if (!preferredVoice) {
        const usVoices = voices.filter(v => v.lang.startsWith(enUSLangPrefix));
        if (usVoices.length > 0) preferredVoice = usVoices[0];
      }
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
         if (otherEnVoices.length > 0) preferredVoice = otherEnVoices[0];
      }
    }
    
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices.find(v => v.default) || voices[0]; 
    }
    
    if (preferredVoice) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
        console.log("TTS: Setting selected voice to:", preferredVoice.name, "| Lang:", preferredVoice.lang, "| URI:", preferredVoice.voiceURI.substring(0,30));
        setSelectedVoice(preferredVoice);
      }
    } else {
      console.warn("TTS: No suitable voice found after all checks.");
      if (selectedVoice !== null) setSelectedVoice(null); 
    }
  }, [voicePreference, selectedVoice, setSelectedVoice, setSupportedVoices]);

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
      console.log("TTS: Speak called for:", `"${text.substring(0, 30)}..."`, "With selected voice:", selectedVoice?.name || "Browser Default");
      
      window.speechSynthesis.cancel();
      setIsSpeaking(false); 
      setIsPaused(false);   

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('TTS: Speech synthesis error:', event.error, event);
        if(event.error === 'not-allowed') {
            console.warn("TTS: Speech was blocked by the browser (not-allowed). This often occurs if there hasn't been a recent user interaction (like a click) on the page, or if the page is in an iframe with restrictions. Ensure user interacts with the page before speech is initiated.");
        }
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { setIsPaused(true); setIsSpeaking(true); }; // isSpeaking should remain true if paused
      utterance.onresume = () => { setIsPaused(false); setIsSpeaking(true);}; // isSpeaking remains true
      
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis && utteranceRef.current === utterance) { 
           window.speechSynthesis.speak(utterance);
        } else if (utteranceRef.current !== utterance) {
            console.log("TTS: Speak call aborted due to new utterance queued or component unmounted.");
        }
      }, 50); 
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused]);

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) { 
      window.speechSynthesis.resume();
    }
  }, []);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, [setIsSpeaking, setIsPaused]);

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(preference);
  }, [setVoicePreference]);

  useEffect(() => {
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
          }
        }
      }, [supportedVoices, selectedVoice, setSelectedVoice]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
