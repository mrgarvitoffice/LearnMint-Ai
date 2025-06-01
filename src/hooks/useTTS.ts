
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
 * Includes handling for browser autoplay policies by queuing initial speech until user interaction.
 */
export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | 'luma' | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasInteractedRef = useRef<boolean>(false);
  const speechQueueRef = useRef<{ text: string; lang?: string } | null>(null);
  const initialSpeechQueuedRef = useRef<boolean>(false); // Ensure only first auto-speech is queued


  const _performSpeak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // Proactively nullify event handlers on the current utterance if it exists
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onpause = null;
      utteranceRef.current.onresume = null;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel(); // Cancel any ongoing or pending speech
    }
    
    // Reset state immediately after cancel and before new utterance setup
    utteranceRef.current = null; 
    setIsSpeaking(false); 
    setIsPaused(false);

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US';
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva'];


    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();
      // Try to find a voice matching the full BCP 47 tag first, then base language
      voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langFull) ||
                   supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
                   supportedVoices.find(v => v.lang.toLowerCase() === langBase);

      if (voiceToUse) {
        newUtterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang; // Use the actual language tag of the found voice
        console.log(`TTS: Found language-specific voice for "${lang}": ${voiceToUse.name} (${voiceToUse.lang})`);
      } else {
        // If no specific voice for the language, use the general selected UI voice but set the utterance lang.
        newUtterance.voice = selectedVoice; 
        finalLangTag = lang; // Keep the requested lang tag for the utterance
        console.warn(`TTS: No specific voice found for requested language "${lang}". Using UI preferred voice "${selectedVoice?.name || 'Browser Default'}" but setting utterance lang to "${lang}".`);
      }
    } else if (selectedVoice) {
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
    }


    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    newUtterance.rate = 1.5; // Faster speech rate
    newUtterance.volume = 1;

    newUtterance.onstart = () => {
      // Only update state if this is the current utterance
      if (utteranceRef.current === newUtterance) {
        setIsSpeaking(true);
        setIsPaused(false);
      }
    };
    newUtterance.onend = () => {
      if (utteranceRef.current === newUtterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      }
    };
    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (utteranceRef.current === newUtterance) { // Ensure this error is for the current utterance
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        if (event.error === "interrupted") {
          console.warn("TTS: Utterance was reported as 'interrupted'. This usually means speech.cancel() was called, or a new speak() request pre-empted this one. Check for rapid speak() calls or external interruptions.");
        } else if (event.error === "audio-busy") {
          console.warn("TTS: Speech error 'audio-busy'. The audio output device is busy. Try again shortly.");
        } else if (event.error === "not-allowed") {
            console.warn("TTS: Speech was 'not-allowed'. This usually means the browser blocked it due to lack of user interaction or permissions (common for initial page load speech).");
        } else if (event.error === "language-unavailable" || event.error === "voice-unavailable") {
            console.warn(`TTS: Speech error '${event.error}'. The language or voice ("${newUtterance.voice?.name}") for lang "${newUtterance.lang}" might not be supported by the browser's TTS engine.`);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      }
    };
    newUtterance.onpause = () => {
      if (utteranceRef.current === newUtterance) setIsPaused(true);
    };
    newUtterance.onresume = () => {
      if (utteranceRef.current === newUtterance) setIsPaused(false);
    };
    
    // setTimeout(() => { // Removed the delay, direct speak attempt
    if (utteranceRef.current === newUtterance) { // Double check ref before speaking
        window.speechSynthesis.speak(newUtterance);
    }
    // }, 50);

  }, [selectedVoice, supportedVoices]);

  const playQueuedSpeech = useCallback(() => {
    if (speechQueueRef.current) {
      console.log("TTS: Playing queued speech after user interaction.", speechQueueRef.current);
      _performSpeak(speechQueueRef.current.text, speechQueueRef.current.lang);
      speechQueueRef.current = null;
    }
  }, [_performSpeak]);

  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window !== 'undefined' && !hasInteractedRef.current && !initialSpeechQueuedRef.current) {
      // Only queue the very first automatic speech attempt.
      // Subsequent programmatic calls (if any before interaction) won't queue again if one is already there.
      if (!speechQueueRef.current) { 
        console.log("TTS: Queuing initial speech (user interaction pending):", { text: text.substring(0,30)+"...", lang });
        speechQueueRef.current = { text, lang };
        initialSpeechQueuedRef.current = true; // Mark that an initial speech HAS been queued
      } else {
        console.log("TTS: Initial speech already queued, skipping new queue for:", { text: text.substring(0,30)+"...", lang });
      }
      return;
    }
    _performSpeak(text, lang);
  }, [_performSpeak]);


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
      speechQueueRef.current = null; // Also clear any queued speech
      initialSpeechQueuedRef.current = false; // Reset queue flag if speech is globally cancelled
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
      //   // some browsers fire onvoiceschanged once, others multiple times.
      //   // if it's null, we set it. If it's already set, we don't override, to avoid infinite loops if not careful.
      //   window.speechSynthesis.onvoiceschanged = populateVoiceList;
      // }
      return;
    }
    setSupportedVoices(voices);

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; 
    const enUSLangPrefix = 'en-US';
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female'];
    
    if (voicePreference === 'kai') {
        preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                           voices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           voices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix)));
    } else if (voicePreference === 'luma' || voicePreference === 'zia') {
        const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
        const secondaryNameMatch = voicePreference === 'luma' ? 'zia' : 'luma';
        preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                           voices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           voices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix))) ||
                           voices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) || 
                           voices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(currentLangPrefix));
    }

    if (!preferredVoiceForUI) {
        preferredVoiceForUI = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                           voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                           voices.find(v => v.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(v => v.lang.startsWith(currentLangPrefix)) ||
                           voices.find(v => v.default) ||
                           (voices.length > 0 ? voices[0] : undefined);
    }
    
    if (preferredVoiceForUI && (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI)) {
      setSelectedVoice(preferredVoiceForUI);
    } else if (!preferredVoiceForUI && selectedVoice !== null) {
      // This case means no suitable voice was found, potentially clear selectedVoice or set to a very basic default
      // For now, if a selectedVoice exists and nothing better is found, keep it, unless it's null.
      // If preferredVoiceForUI is undefined, and selectedVoice is NOT null, we might not want to change selectedVoice.
      // If preferredVoiceForUI is undefined, AND selectedVoice IS null, then nothing changes.
    }
    
  }, [voicePreference, selectedVoice]);


  useEffect(() => {
    const handleVoicesChanged = () => {
      // console.log("TTS: voiceschanged event fired.");
      populateVoiceList();
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Call once initially in case voices are already loaded
      populateVoiceList();
      // Then subscribe to the event
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }

    const interactionEvents: (keyof DocumentEventMap)[] = ['click', 'keydown', 'touchstart'];
    const handleFirstInteraction = () => {
      if (!hasInteractedRef.current) {
        // console.log("TTS: User interaction detected.");
        hasInteractedRef.current = true;
        playQueuedSpeech();
        interactionEvents.forEach(event => document.removeEventListener(event, handleFirstInteraction));
      }
    };

    interactionEvents.forEach(event => document.addEventListener(event, handleFirstInteraction, { once: true, passive: true }));

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        if (utteranceRef.current) {
          utteranceRef.current.onstart = null;
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
          utteranceRef.current.onpause = null;
          utteranceRef.current.onresume = null;
        }
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        speechQueueRef.current = null;
        initialSpeechQueuedRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
      }
      interactionEvents.forEach(event => document.removeEventListener(event, handleFirstInteraction));
    };
  }, [populateVoiceList, playQueuedSpeech]);


  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(oldPreference => {
      if (oldPreference !== preference) {
        // console.log(`TTS: Voice preference changed from ${oldPreference} to ${preference}. Repopulating voice list.`);
        return preference;
      }
      return oldPreference;
    });
  }, []);
  
  useEffect(() => {
    if(supportedVoices.length > 0){ // Trigger voice list update when preference changes AND voices are already loaded
        populateVoiceList();
    }
  }, [voicePreference, supportedVoices.length, populateVoiceList]); // Added populateVoiceList to dependency array

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

