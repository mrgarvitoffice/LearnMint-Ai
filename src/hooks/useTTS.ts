
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
    // console.log("TTS: populateVoiceList. Preference:", voicePreference, "Voices count:", voices.length);

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // General English
    const enUSLangPrefix = 'en-US'; // Specifically US English

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady'];

    if (voicePreference === 'kai') { // Explicitly for Kazuma (male)
      console.log("TTS: Attempting to select 'kai' (male) preference.");
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) || // en-US non-female
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));    // en non-female
    } else if (voicePreference === 'luma' || voicePreference === 'zia') { // Explicitly for Megumin or Zia (female)
      const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
      console.log(`TTS: Attempting to select '${primaryNameMatch}' (female) preference.`);
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||   // en-US non-male
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));      // en non-male
    }


    // Fallback if no preference-specific voice found
    if (!preferredVoice) {
      console.log("TTS: No specific preference/gender match, trying general English fallbacks.");
      preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                       voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                       voices.find(v => v.lang.startsWith(enUSLangPrefix)) || // Any en-US voice
                       voices.find(v => v.lang.startsWith(currentLangPrefix)) || // Any en voice
                       voices.find(v => v.default) || // Browser default
                       (voices.length > 0 ? voices[0] : undefined); // Absolute fallback
    }
    
    if (preferredVoice) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
        console.log("TTS: Setting selected voice to:", preferredVoice.name, "| Lang:", preferredVoice.lang);
        setSelectedVoice(preferredVoice);
      }
    } else {
      console.warn("TTS: No suitable voice found after all checks.");
      if (selectedVoice !== null) setSelectedVoice(null); 
    }
  }, [voicePreference, selectedVoice, setSelectedVoice, setSupportedVoices]); // Removed populateVoiceList from dependencies to avoid potential loops

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Initial call
      window.speechSynthesis.onvoiceschanged = populateVoiceList; // Listener for subsequent changes
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
  }, []); // Removed populateVoiceList from here as well, it's called internally now.

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && text.trim() !== "") {
      // console.log("TTS: Speak called for:", `"${text.substring(0, 30)}..."`, "With selected voice:", selectedVoice?.name || "Browser Default");
      
      window.speechSynthesis.cancel(); // Cancel any ongoing speech before starting new
      setIsSpeaking(false); // Reset states
      setIsPaused(false);   

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn("TTS: Speaking with browser default voice as no specific voice is selected/matched.");
      }
      
      utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('TTS: Speech synthesis error:', event.error, event);
        if(event.error === 'not-allowed') {
            console.warn("TTS: Speech was blocked by the browser (not-allowed). This often occurs if there hasn't been a recent user interaction (like a click) on the page, or if the page is in an iframe with restrictions. Ensure user interacts with the page before speech is initiated.");
        } else if (event.error === 'voice-unavailable' && selectedVoice) {
            console.warn(`TTS: Selected voice "${selectedVoice.name}" is unavailable. Trying to repopulate and speak with fallback.`);
            populateVoiceList(); // Attempt to repopulate and get a new default
            // Potentially re-attempt speak with a timeout or a flag? For now, just log.
        }
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { setIsPaused(true); setIsSpeaking(true); }; 
      utterance.onresume = () => { setIsPaused(false); setIsSpeaking(true);}; 
      
      // Short delay before speaking - can sometimes help with "not-allowed" or voice initialization issues
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis && utteranceRef.current === utterance) { 
           window.speechSynthesis.speak(utterance);
        } else if (utteranceRef.current !== utterance) {
            console.log("TTS: Speak call aborted due to new utterance queued or component unmounted.");
        }
      }, 50); 
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused, populateVoiceList]);

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
    console.log("TTS: Setting voice preference to:", preference);
    setVoicePreference(preference);
  }, [setVoicePreference]);

  // Effect to re-run voice selection when preference changes and voices are available
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

