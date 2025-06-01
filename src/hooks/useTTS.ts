
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
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
      }
      return;
    }
    setSupportedVoices(voices);
    // console.log("TTS: Voices loaded:", voices.length, voices.map(v => ({name: v.name, lang: v.lang, default: v.default, uri: v.voiceURI })));

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
      // console.log(`TTS: UI Preferred voice set to: ${preferredVoiceForUI.name} (${preferredVoiceForUI.lang}) based on preference: ${voicePreference || 'auto-selected'}`);
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI) {
        setSelectedVoice(preferredVoiceForUI);
      }
    } else {
      // console.warn("TTS: No suitable UI voice found after all checks.");
      if (selectedVoice !== null) {
        setSelectedVoice(null);
      }
    }
  }, [voicePreference, selectedVoice]); 

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList();
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel(); 
        }
      }
    };
  }, [populateVoiceList]); 


  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      // console.log("TTS: Speak aborted. No text, or synth not available, or window undefined.");
      return;
    }

    // Forcefully cancel any ongoing or pending speech.
    // And immediately reset speaking/paused state and utteranceRef before setting up new utterance.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      // console.log("TTS: Cancelling existing speech for new request...");
      window.speechSynthesis.cancel();
    }
    // Reset state here to ensure clean start for the new utterance.
    // The onstart of the new utterance will set isSpeaking back to true.
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;


    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Store reference to the *new* utterance.

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US'; // Default to English if no lang specified

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0];
      voiceToUse = supportedVoices.find(v => v.lang === lang) ||
                   supportedVoices.find(v => v.lang.startsWith(langBase + "-")) ||
                   supportedVoices.find(v => v.lang === langBase);
      if (voiceToUse) {
        utterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang;
        // console.log(`TTS: For requested lang "${lang}", using specific voice: ${voiceToUse.name} (${voiceToUse.lang})`);
      } else {
        // console.log(`TTS: No specific voice found for lang "${lang}". Browser will use default for lang tag: ${finalLangTag}`);
      }
    } else if (selectedVoice) {
      utterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
      // console.log(`TTS: No specific lang. Using general selected UI voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
      // console.log(`TTS: No specific lang, no UI voice. Using browser default. Lang hint: ${finalLangTag}`);
    }
    
    utterance.lang = finalLangTag;
    utterance.pitch = 1;
    utterance.rate = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      // console.log(`TTS: Speech started. Text: "${text.substring(0,30)}...", Voice: ${utterance.voice?.name || 'Browser Default'}, Lang: ${utterance.lang}`);
      if (utteranceRef.current === utterance) {
        setIsSpeaking(true);
        setIsPaused(false);
      } else {
        // console.log("TTS: onstart fired for an old/mismatched utterance. Ignoring state update.");
      }
    };

    utterance.onend = () => {
      // console.log(`TTS: Speech ended. Text: "${text.substring(0,30)}..."`);
      if (utteranceRef.current === utterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      } else {
         // console.log("TTS: onend fired for an old/mismatched utterance. Ignoring state update.");
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      // The console.error below is the line (179) from the user's error report.
      console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${utterance.voice?.name || 'Browser Default'}`, `Lang: ${utterance.lang}`);
      if (event.error === "interrupted") {
        // console.warn("TTS: Utterance was reported as 'interrupted'. This usually means speech.cancel() was called, or a new speak() request pre-empted this one. Check for rapid speak() calls or external interruptions.");
      } else if (event.error === "audio-busy") {
        // console.warn("TTS: Speech synthesis error: 'audio-busy'. The audio output device is busy. Try again shortly.");
      } else if (event.error === "language-unavailable" || event.error === "voice-unavailable") {
        // console.warn(`TTS: Speech synthesis error: '${event.error}'. The language or voice specified may not be supported by the browser or OS on this device for the given text.`);
      }

      if (utteranceRef.current === utterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      } else {
        // console.log("TTS: onerror fired for an old/mismatched utterance. Ignoring state update.");
      }
    };

    utterance.onpause = () => {
      // console.log(`TTS: Speech paused. Text: "${text.substring(0,30)}..."`);
      if (utteranceRef.current === utterance) {
        setIsPaused(true); 
      }
    };

    utterance.onresume = () => {
      // console.log(`TTS: Speech resumed. Text: "${text.substring(0,30)}..."`);
      if (utteranceRef.current === utterance) {
        setIsPaused(false); 
      }
    };
    
    // console.log(`TTS: Attempting to speak. Text: "${text.substring(0,30)}...", Voice: ${utterance.voice?.name || 'Browser Default'}, Lang: ${utterance.lang}`);
    window.speechSynthesis.speak(utterance);

  }, [selectedVoice, supportedVoices, setIsSpeaking, setIsPaused]); // Removed isSpeaking, isPaused from deps

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
      // console.log("TTS: cancelTTS called. Current utteranceRef:", utteranceRef.current?.text.substring(0,30));
      window.speechSynthesis.cancel(); 
      utteranceRef.current = null; 
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [setIsSpeaking, setIsPaused]);

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(preference);
  }, []); 

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
      }, [supportedVoices, selectedVoice]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}

