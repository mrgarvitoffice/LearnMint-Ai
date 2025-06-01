
"use client"; // This hook is client-side only due to browser's SpeechSynthesis API.

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @interface TTSHook
 * Defines the return type of the useTTS hook.
 */
interface TTSHook {
  speak: (text: string, lang?: string) => void;      // Function to initiate speech, accepts optional BCP 47 language tag.
  pauseTTS: () => void;                               // Function to pause ongoing speech.
  resumeTTS: () => void;                              // Function to resume paused speech.
  cancelTTS: () => void;                              // Function to stop and clear speech.
  isSpeaking: boolean;                                // True if speech is currently active (speaking or paused).
  isPaused: boolean;                                  // True if speech is paused.
  supportedVoices: SpeechSynthesisVoice[];            // Array of available voices in the browser.
  selectedVoice: SpeechSynthesisVoice | null;         // The currently selected voice object for general UI or fallback.
  setSelectedVoiceURI: (uri: string) => void;         // Function to select a voice by its URI.
  setVoicePreference: (preference: 'zia' | 'kai' | 'luma' | null) => void; // Function to set a preferred voice type for general UI.
  voicePreference: 'zia' | 'kai' | 'luma' | null;     // The current voice preference for general UI.
}

/**
 * `useTTS` Hook
 * 
 * A custom React hook for Text-To-Speech (TTS) functionality using the browser's SpeechSynthesis API.
 * Manages speech state, voice selection, and provides controls for speech playback.
 * Now supports attempting to use language-specific voices if a BCP 47 language tag is provided to `speak`.
 */
export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null); // General purpose voice
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
        // console.log("TTS: Voices not loaded yet, setting up onvoiceschanged listener.");
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
      }
      return;
    }
    // console.log(`TTS: Populating voice list, ${voices.length} voices found.`);
    setSupportedVoices(voices);
    
    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; 
    const enUSLangPrefix = 'en-US'; 

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady'];

    if (voicePreference === 'kai') {
      preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));    
    } else if (voicePreference === 'luma' || voicePreference === 'zia') {
      const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
      preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||   
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));      
    }

    if (!preferredVoiceForUI) {
      preferredVoiceForUI = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                       voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                       voices.find(v => v.lang.startsWith(enUSLangPrefix)) || 
                       voices.find(v => v.lang.startsWith(currentLangPrefix)) || 
                       voices.find(v => v.default) || 
                       (voices.length > 0 ? voices[0] : undefined); 
    }
    
    if (preferredVoiceForUI) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI) {
        // console.log(`TTS: Setting general UI voice to: ${preferredVoiceForUI.name} (${preferredVoiceForUI.lang}) based on preference: ${voicePreference}`);
        setSelectedVoice(preferredVoiceForUI);
      }
    } else {
      if (selectedVoice !== null) {
        // console.log("TTS: No suitable general UI voice found, clearing selectedVoice.");
        setSelectedVoice(null);
      }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 

  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && text.trim() !== "") {
      window.speechSynthesis.cancel(); 
      setIsSpeaking(false); 
      setIsPaused(false);   

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      let voiceToUse: SpeechSynthesisVoice | null = null; 
      let usedSpecificLangVoice = false;

      if (lang && supportedVoices.length > 0) {
        const langBase = lang.split('-')[0]; // e.g., "hi" from "hi-IN"
        console.log(`TTS: Attempting to find voice for lang="${lang}" (base: "${langBase}") among ${supportedVoices.length} voices.`);

        voiceToUse = supportedVoices.find(v => v.lang === lang) || // Exact match
                     supportedVoices.find(v => v.lang.startsWith(langBase + "-")) || // Match like "hi-IN"
                     supportedVoices.find(v => v.lang === langBase); // Broader match like "hi"
        
        if (voiceToUse) {
          console.log(`TTS: Found language-specific voice for "${lang}": ${voiceToUse.name} (${voiceToUse.lang})`);
          utterance.voice = voiceToUse;
          utterance.lang = voiceToUse.lang; // Explicitly set lang on utterance
          usedSpecificLangVoice = true;
        } else {
          // If no specific voice for the language is found,
          // set the utterance's lang attribute to the requested language.
          // Do NOT set utterance.voice, allowing the browser to use its default for that language.
          utterance.lang = lang;
          console.warn(`TTS: No specific voice found for requested language "${lang}". Browser will attempt to use its default for this language if available. Text: "${text.substring(0, 50)}..."`);
        }
      } else if (selectedVoice) { // No specific lang requested, use general selectedVoice (UI preference)
        voiceToUse = selectedVoice; // Note: voiceToUse is for logging/error handling, actual voice set below
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        // console.log(`TTS: Speaking with general preferred UI voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      } else {
        // No specific lang, no selected UI voice, let browser use its absolute default
        utterance.lang = lang || 'en-US'; // Fallback lang hint if none provided, or if lang was undefined.
        console.warn(`TTS: Speaking with browser default voice (no specific lang requested, no UI preference set, or no voices available). Lang hint: ${utterance.lang}. Text: "${text.substring(0,50)}..."`);
      }
      
      utterance.onstart = () => { console.log(`TTS: Speech started. Text: "${text.substring(0,30)}...", Voice: ${utterance.voice?.name || 'Browser Default'}, Lang: ${utterance.lang}`); setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('TTS: Speech synthesis error:', event.error, `Details: ${event.toString()}`, `Text: "${text.substring(0,30)}..."`, `Voice: ${utterance.voice?.name || 'Browser Default'}`, `Lang: ${utterance.lang}`);
        if(event.error === 'not-allowed') {
            console.warn("TTS: Speech was blocked by the browser (not-allowed). User might need to interact with the page first.");
        } else if (event.error === 'voice-unavailable' && voiceToUse && usedSpecificLangVoice) {
            console.warn(`TTS: Specific voice "${voiceToUse.name}" for lang "${lang}" became unavailable. Repopulating voice list.`);
            populateVoiceList(); 
        } else if (event.error === 'language-unavailable') {
            console.warn(`TTS: Browser reported language "${utterance.lang}" is unavailable for synthesis. The browser may not have a voice pack for this language, or it's not installed/enabled.`);
        } else if (event.error === 'synthesis-failed') {
            console.warn(`TTS: Synthesis failed. This can happen if the text is too long, contains unsupported characters for the selected voice/engine, or an internal browser error.`);
        }
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { setIsPaused(true); setIsSpeaking(true); }; 
      utterance.onresume = () => { setIsPaused(false); setIsSpeaking(true);}; 
      
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis && utteranceRef.current === utterance) { 
           window.speechSynthesis.speak(utterance);
        } else if (utteranceRef.current !== utterance) {
            console.log("TTS: Speak call aborted due to new utterance queued or component unmounted.");
        }
      }, 50); 
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused, populateVoiceList, supportedVoices]);

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

