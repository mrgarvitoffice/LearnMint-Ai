
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
      // If voices are not immediately available, they might load asynchronously.
      // The onvoiceschanged event will trigger this function again when they are.
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        // console.log("TTS: No voices loaded yet, onvoiceschanged listener is being attached or already attached.");
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
      } else if (!('onvoiceschanged' in window.speechSynthesis)) {
        // console.warn("TTS: No voices found and onvoiceschanged event not supported. Speech may not work as expected.");
      }
      return;
    }
    setSupportedVoices(voices);
    // console.log("TTS: Voices loaded/re-evaluated:", voices.length);

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // Prioritize general English
    const enUSLangPrefix = 'en-US'; // Specifically US English

    // Expanded keywords for better matching common system voice names
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena'];

    if (voicePreference === 'kai') { // Male preference
        preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                           voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                           voices.find(voice => voice.lang.startsWith(currentLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                           voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) || // Generic US male
                           voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))); // Generic English male
    } else if (voicePreference === 'luma' || voicePreference === 'zia') { // Female preference
        const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
        preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                           voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                           voices.find(voice => voice.lang.startsWith(currentLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                           voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) || // Generic US female
                           voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))); // Generic English female
    }

    // Fallback if preference-based selection fails
    if (!preferredVoiceForUI) {
        // console.log("TTS: Preference-based voice not found, attempting fallbacks for UI voice.");
        preferredVoiceForUI = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) || // US default
                           voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) || // Any English default
                           voices.find(v => v.lang.startsWith(enUSLangPrefix)) ||                 // Any US English
                           voices.find(v => v.lang.startsWith(currentLangPrefix)) ||                // Any English
                           voices.find(v => v.default) ||                                       // Any default system voice
                           (voices.length > 0 ? voices[0] : undefined);                         // First available voice
    }
    
    if (preferredVoiceForUI) {
      // Only update state if the voice actually changed to prevent unnecessary re-renders
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI) {
        setSelectedVoice(preferredVoiceForUI);
        // console.log(`TTS: UI Preferred voice set to: ${preferredVoiceForUI.name} (${preferredVoiceForUI.lang}) based on preference: ${voicePreference || 'auto-selected'}`);
      }
    } else {
      // console.warn("TTS: No suitable UI voice found after all checks.");
      if (selectedVoice !== null) { // Only update if it needs to be nulled
        setSelectedVoice(null);
      }
    }
  }, [voicePreference, selectedVoice]); // Added selectedVoice as it's used in the comparison

  // Effect to initialize and clean up speech synthesis and voice list
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Initial call to populate voices
      // Set up the event listener for when the list of voices changes
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    // Cleanup function
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null; // Remove the event listener
        // Clean up the current utterance's event handlers
        if (utteranceRef.current) {
            utteranceRef.current.onstart = null;
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
            utteranceRef.current.onpause = null;
            utteranceRef.current.onresume = null;
        }
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        utteranceRef.current = null;     // Clean up the ref
        setIsSpeaking(false);            // Reset speaking state
        setIsPaused(false);              // Reset paused state
      }
    };
  }, [populateVoiceList]); // populateVoiceList is stable due to useCallback


  // Function to speak text
  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      console.warn("TTS: Speak called with no text or speech synthesis not available/ready.");
      return;
    }

    // 1. Detach event handlers from any PREVIOUS utterance stored in utteranceRef
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onpause = null;
      utteranceRef.current.onresume = null;
    }

    // 2. Cancel any currently speaking or pending utterances in the browser's queue.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    
    // 3. Immediately reset utteranceRef and related React states.
    utteranceRef.current = null;
    setIsSpeaking(false); 
    setIsPaused(false);

    // 4. Create and configure the new utterance
    const newUtterance = new SpeechSynthesisUtterance(text);
    
    // --- Voice and Language Selection Logic ---
    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US'; 

    if (lang && supportedVoices.length > 0) { 
        const langBase = lang.split('-')[0].toLowerCase();
        voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ||
                     supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
                     supportedVoices.find(v => v.lang.toLowerCase() === langBase);

        if (voiceToUse) {
            newUtterance.voice = voiceToUse;
            finalLangTag = voiceToUse.lang; 
        } else {
            if (selectedVoice) newUtterance.voice = selectedVoice; 
        }
    } else if (selectedVoice) { 
        newUtterance.voice = selectedVoice;
        finalLangTag = selectedVoice.lang;
    }
    // --- End Voice and Language Selection Logic ---

    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    newUtterance.rate = 1.5; // Speech rate
    newUtterance.volume = 1;

    // 5. Assign the newly created and configured utterance to utteranceRef.
    utteranceRef.current = newUtterance;

    // 6. Set up event handlers for the NEW utterance.
    newUtterance.onstart = () => {
      if (event.target === utteranceRef.current) { // Check if event target is the current utterance
        setIsSpeaking(true);
        setIsPaused(false);
      }
    };

    newUtterance.onend = () => {
      if (event.target === utteranceRef.current) {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null; 
      }
    };

    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (event.utterance === utteranceRef.current) { // Check if the event is for the current utterance
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        if (event.error === "interrupted") {
          console.warn("TTS: Utterance was reported as 'interrupted'. This usually means speech.cancel() was called, or a new speak() request pre-empted this one. Check for rapid speak() calls or external interruptions.");
        } else if (event.error === "audio-busy") {
          console.warn("TTS: Speech synthesis error: 'audio-busy'. The audio output device is busy.");
        } else if (event.error === "language-unavailable" || event.error === "voice-unavailable") {
          console.warn(`TTS: Speech synthesis error: '${event.error}'. The language or voice specified may not be supported.`);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null; 
      } else {
        // console.warn("TTS: Error event from an old/cancelled utterance ignored:", event.error);
      }
    };
    
    newUtterance.onpause = () => {
      if (event.target === utteranceRef.current) setIsPaused(true);
    };
    newUtterance.onresume = () => {
      if (event.target === utteranceRef.current) setIsPaused(false);
    };

    // 7. Speak the utterance.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.speak(newUtterance);
    }

  }, [selectedVoice, supportedVoices]);

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
      if (utteranceRef.current) {
          utteranceRef.current.onstart = null;
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
          utteranceRef.current.onpause = null;
          utteranceRef.current.onresume = null;
      }
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

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
