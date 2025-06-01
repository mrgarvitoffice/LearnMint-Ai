
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
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [queuedInitialSpeech, setQueuedInitialSpeech] = useState<{ text: string, lang?: string } | null>(null);
  // Ensures only the *first* automatic speak call is queued if user hasn't interacted.
  const initialSpeechAttemptedOrQueuedRef = useRef(false); 

  // Effect to detect first user interaction
  useEffect(() => {
    const markInteraction = () => {
      setUserHasInteracted(true);
      window.removeEventListener('click', markInteraction, { capture: true, once: true });
      window.removeEventListener('keydown', markInteraction, { capture: true, once: true });
      window.removeEventListener('touchstart', markInteraction, { capture: true, once: true });
    };

    if (!userHasInteracted) {
      window.addEventListener('click', markInteraction, { capture: true, once: true });
      window.addEventListener('keydown', markInteraction, { capture: true, once: true });
      window.addEventListener('touchstart', markInteraction, { capture: true, once: true });
    }

    return () => {
      window.removeEventListener('click', markInteraction, { capture: true, once: true });
      window.removeEventListener('keydown', markInteraction, { capture: true, once: true });
      window.removeEventListener('touchstart', markInteraction, { capture: true, once: true });
    };
  }, [userHasInteracted]);


  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
      }
      return;
    }
    setSupportedVoices(voices);

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // Prioritize English voices for UI feedback
    const enUSLangPrefix = 'en-US';
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français'];
    
    if (voicePreference === 'kai') {
        preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                           voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                           voices.find(voice => voice.lang.startsWith(currentLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));
    } else if (voicePreference === 'luma' || voicePreference === 'zia') {
        const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
        preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                           voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                           voices.find(voice => voice.lang.startsWith(currentLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));
    }

    if (!preferredVoiceForUI) {
        preferredVoiceForUI = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                           voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                           voices.find(v => v.lang.startsWith(enUSLangPrefix)) ||
                           voices.find(v => v.lang.startsWith(currentLangPrefix)) ||
                           voices.find(v => v.default) ||
                           (voices.length > 0 ? voices[0] : undefined);
    }
    
    // Only update if the voice actually changes to prevent unnecessary re-renders
    if (preferredVoiceForUI && (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI)) {
      setSelectedVoice(preferredVoiceForUI);
    } else if (!preferredVoiceForUI && selectedVoice !== null) {
      setSelectedVoice(null);
    }
  }, [voicePreference, selectedVoice]); // Added selectedVoice to dependency array

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Initial call
      // onvoiceschanged might be null if no voices initially, or if already set by populateVoiceList's retry
      if (window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
      }
    }
    return () => { // Cleanup
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
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
    };
  }, [populateVoiceList]); // populateVoiceList is stable due to useCallback

  const _performSpeak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // Robustly cancel previous speech and clean up its event handlers
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onpause = null;
      utteranceRef.current.onresume = null;
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
    }
    
    // Reset state for the new utterance
    utteranceRef.current = null; 
    setIsSpeaking(false); 
    setIsPaused(false);

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance; // Assign new utterance to ref

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US'; // Default to en-US if nothing else

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();
      // Prioritize full match, then base language match
      voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langFull) ||
                   supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
                   supportedVoices.find(v => v.lang.toLowerCase() === langBase);
      
      if (voiceToUse) {
        newUtterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang; // Use the matched voice's lang tag
        // console.log(`TTS: Found language-specific voice for "${lang}": ${voiceToUse.name} (${voiceToUse.lang})`);
      } else {
        // If no specific voice for 'lang', use the general 'selectedVoice' (Zia, Luma, Kai) BUT set the lang attribute to requested lang
        newUtterance.voice = selectedVoice; 
        finalLangTag = lang; // IMPORTANT: Keep the originally requested language tag for the utterance
        // console.warn(`TTS: No specific voice found for "${lang}". Using UI preferred voice "${selectedVoice?.name || 'Browser Default'}" BUT setting lang tag to "${finalLangTag}".`);
      }
    } else if (selectedVoice) {
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
    }
    // If still no voice (selectedVoice is null and no lang match), browser picks its default for the finalLangTag

    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    newUtterance.rate = 1.5; // Speech rate
    newUtterance.volume = 1;

    newUtterance.onstart = () => {
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
      // Only update state if the error is for the *current* utterance
      if (utteranceRef.current === newUtterance) {
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        if (event.error === "interrupted") {
          console.warn("TTS: Utterance was reported as 'interrupted'. This usually means speech.cancel() was called, or a new speak() request pre-empted this one. Check for rapid speak() calls or external interruptions.");
        } else if (event.error === "audio-busy") {
          console.warn("TTS: Speech error 'audio-busy'. The audio output device is busy. Try again shortly.");
        } else if (event.error === "not-allowed") {
            console.warn("TTS: Speech was 'not-allowed'. This usually means the browser blocked it due to lack of user interaction or permissions.");
        } else if (event.error === "language-unavailable" || event.error === "voice-unavailable") {
            console.warn(`TTS: Speech error '${event.error}'. The language or voice might not be supported by the browser's TTS engine.`);
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
    
    // console.log(`TTS: Attempting to speak: "${text.substring(0,30)}..." with voice: ${newUtterance.voice?.name || 'Browser Default'}, lang: ${newUtterance.lang}`);
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices]);


  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // If user hasn't interacted and no initial speech has been queued/attempted yet
    // This handles automatic announcements like page titles on load.
    if (!userHasInteracted && !initialSpeechAttemptedOrQueuedRef.current) {
      setQueuedInitialSpeech({ text, lang });
      initialSpeechAttemptedOrQueuedRef.current = true; // Mark that we've queued an initial speech
      // console.log("TTS: User has not interacted. Queuing initial speech.");
      return;
    }
    // If user has interacted OR this is not the very first automatic speech attempt
    _performSpeak(text, lang);
  }, [userHasInteracted, _performSpeak]);

  // Effect to play queued speech once user interacts
  useEffect(() => {
    if (userHasInteracted && queuedInitialSpeech) {
      // console.log("TTS: User has interacted. Speaking queued initial speech.");
      _performSpeak(queuedInitialSpeech.text, queuedInitialSpeech.lang);
      setQueuedInitialSpeech(null); // Clear the queue
    }
  }, [userHasInteracted, queuedInitialSpeech, _performSpeak]);

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
      if (utteranceRef.current) { // Clean up event handlers of current utterance
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
      }
      window.speechSynthesis.cancel(); // Cancel all speech
      utteranceRef.current = null; // Clear the reference
      setIsSpeaking(false);
      setIsPaused(false);
      setQueuedInitialSpeech(null); // Also clear any queued speech on cancel
      initialSpeechAttemptedOrQueuedRef.current = false; // Reset for next potential automatic speech
    }
  }, []);

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(oldPreference => {
      if (oldPreference !== preference) {
        // console.log(`TTS: Voice preference changed to: ${preference}`);
        return preference;
      }
      return oldPreference;
    });
  }, []);
  
  // Re-populate voice list if preference changes AND voices are already loaded
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

