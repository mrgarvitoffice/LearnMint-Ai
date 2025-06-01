
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
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | 'luma' | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasInteractedRef = useRef(false);
  const speechQueueRef = useRef<{ text: string; lang?: string } | null>(null);
  const initialSpeechQueuedRef = useRef(false);

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
      speechQueueRef.current = null; // Clear any queued speech on cancel
      // console.log("TTS: Cancelled. Queue cleared. Speaking/Paused states reset.");
    }
  }, []);

  const playQueuedSpeech = useCallback(() => {
    if (speechQueueRef.current && hasInteractedRef.current) {
      const { text, lang } = speechQueueRef.current;
      speechQueueRef.current = null; // Clear queue
      // console.log("TTS: Playing queued speech after interaction:", text.substring(0,30)+"...");
      _performSpeak(text, lang);
    }
  }, []); // _performSpeak will be a dependency if extracted, or its own dependencies ensure stability

  const _performSpeak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      // console.log("TTS: Speak called with no text or speech synthesis not available.");
      return;
    }

    // console.log("TTS: _performSpeak called for:", text.substring(0,50)+"...", "Lang:", lang, "Current Speaking:", isSpeaking, "Paused:", isPaused);

    // Aggressive cleanup of previous utterance
    if (utteranceRef.current) {
      // console.log("TTS: Existing utterance found, nullifying its handlers.");
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onpause = null;
      utteranceRef.current.onresume = null;
    }

    // console.log("TTS: Calling window.speechSynthesis.cancel() and resetting states.");
    window.speechSynthesis.cancel(); // Cancel any current or pending speech
    utteranceRef.current = null;     // Ensure ref is cleared before new one
    setIsSpeaking(false);            // Reset speaking state immediately
    setIsPaused(false);              // Reset paused state immediately

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance; // Assign to ref immediately

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US';

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();
      voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.localService) ||
                   supportedVoices.find(v => v.lang.toLowerCase() === langFull);
      if (!voiceToUse) {
        voiceToUse = supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.localService) ||
                     supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-"));
      }
      if (!voiceToUse) {
          voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langBase && v.localService) ||
                       supportedVoices.find(v => v.lang.toLowerCase() === langBase);
      }
       if (voiceToUse) {
        newUtterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang; // Use the actual lang tag of the selected voice
      } else {
        // Fallback to UI selected voice if language-specific voice not found, but keep requested lang tag
        newUtterance.voice = selectedVoice;
        finalLangTag = lang; // Keep the originally requested lang tag for the utterance
      }
    } else if (selectedVoice) {
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
    } else {
      // No specific lang request, no selectedVoice, browser default will be used.
      // Set lang tag to a sensible default or keep what was passed.
      finalLangTag = lang || 'en-US';
    }

    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1.0; // Explicitly set pitch
    
    if (finalLangTag && !finalLangTag.toLowerCase().startsWith('en-')) {
      newUtterance.rate = 1.0; // Slower rate for non-English languages like Hindi
    } else {
      newUtterance.rate = 1.4; // Faster rate for English
    }
    newUtterance.volume = 1;
    // console.log("TTS: Utterance configured. Voice:", newUtterance.voice?.name, "Lang:", newUtterance.lang, "Rate:", newUtterance.rate, "Pitch:", newUtterance.pitch);

    newUtterance.onstart = () => {
      if (utteranceRef.current === newUtterance) {
        // console.log("TTS: onstart event for current utterance.");
        setIsSpeaking(true);
        setIsPaused(false);
      } else {
        // console.log("TTS: onstart event for STALE utterance. Ignoring.");
      }
    };
    newUtterance.onend = () => {
      if (utteranceRef.current === newUtterance) {
        // console.log("TTS: onend event for current utterance.");
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null; // Clear ref on natural end
      } else {
        // console.log("TTS: onend event for STALE utterance. Ignoring.");
      }
    };
    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (utteranceRef.current === newUtterance) {
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null; // Clear ref on error
      } else {
        // console.error("TTS: onerror event for STALE utterance. Error was:", event.error, "Ignoring state update.");
      }
    };
    newUtterance.onpause = () => {
      if (utteranceRef.current === newUtterance) {
        // console.log("TTS: onpause event for current utterance.");
        setIsPaused(true);
      } else {
        // console.log("TTS: onpause event for STALE utterance. Ignoring.");
      }
    };
    newUtterance.onresume = () => {
      if (utteranceRef.current === newUtterance) {
        // console.log("TTS: onresume event for current utterance.");
        setIsPaused(false);
      } else {
        // console.log("TTS: onresume event for STALE utterance. Ignoring.");
      }
    };
    
    // console.log("TTS: Calling window.speechSynthesis.speak().");
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices, cancelTTS]); // isSpeaking, isPaused removed from deps to break loops


  const speak = useCallback((text: string, lang?: string) => {
    // This is the new immediate speak without interaction queue
    // console.log("TTS: Public speak called for:", text.substring(0,30)+"...", "Lang:", lang);
    _performSpeak(text, lang);
  }, [_performSpeak]);


  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking && !isPaused) {
      // console.log("TTS: Pausing speech.");
      window.speechSynthesis.pause();
      // Note: onpause handler updates isPaused state
    }
  }, [isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      // console.log("TTS: Resuming speech.");
      window.speechSynthesis.resume();
      // Note: onresume handler updates isPaused state
    }
  }, []);

  const updateSupportedVoicesList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      setSupportedVoices(prevVoices => {
        if (voices.length !== prevVoices.length || !voices.every((v, i) => v.voiceURI === prevVoices[i]?.voiceURI)) {
          // console.log("TTS: Voices list changed, updating.", voices.length, "voices found.");
          return voices;
        }
        return prevVoices;
      });
    }
  }, []);

  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
      // console.log("TTS: No supported voices, setting selectedVoice to null.");
      setSelectedVoice(null);
      return;
    }

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark', 'tom', 'george', 'satya'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female', 'microsoft hazel', 'linda', 'heera', 'mia', 'susan', 'veena'];

    if (voicePreference === 'kai') {
        preferredVoiceForUI = supportedVoices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix) && voice.localService)) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix) && voice.localService)) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix)));
    } else if (voicePreference === 'luma' || voicePreference === 'zia') {
        const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
        const secondaryNameMatch = voicePreference === 'luma' ? 'zia' : 'luma';
        preferredVoiceForUI = supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix) && voice.localService) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix) && voice.localService) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix) && voice.localService)) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix) && voice.localService)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix)) || femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.includes('en'))) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(currentLangPrefix));
    }

    if (!preferredVoiceForUI) {
        preferredVoiceForUI = supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix) && v.localService && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix) && v.localService && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix) && v.localService) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix) && v.localService) ||
                           supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(v => v.default) ||
                           (supportedVoices.length > 0 ? supportedVoices[0] : undefined);
    }
    
    setSelectedVoice(currentVal => {
      if (preferredVoiceForUI && (!currentVal || currentVal.voiceURI !== preferredVoiceForUI.voiceURI)) {
        // console.log("TTS: Setting selected UI voice to:", preferredVoiceForUI.name, preferredVoiceForUI.lang);
        return preferredVoiceForUI;
      }
      if (!preferredVoiceForUI && currentVal !== null) {
        // console.log("TTS: No preferred UI voice found, setting selectedVoice to null.");
        return null;
      }
      // console.log("TTS: Selected UI voice unchanged or no update needed. Current:", currentVal?.name);
      return currentVal;
    });
  }, [supportedVoices, voicePreference]);


  useEffect(() => {
    updateSupportedVoicesList(); // Initial fetch
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateSupportedVoicesList; // Listener for subsequent changes
    }
    
    // User interaction listener for autoplay policy
    const interactionListener = () => {
      if (!hasInteractedRef.current) {
        // console.log("TTS: User interaction detected.");
        hasInteractedRef.current = true;
        playQueuedSpeech(); // Attempt to play any queued speech
      }
      // Remove listener after first interaction to avoid multiple triggers
      document.removeEventListener('click', interactionListener);
      document.removeEventListener('keydown', interactionListener);
      document.removeEventListener('touchstart', interactionListener);
    };

    // Add listeners only once on mount
    document.addEventListener('click', interactionListener);
    document.addEventListener('keydown', interactionListener);
    document.addEventListener('touchstart', interactionListener);

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null; // Clean up listener
        cancelTTS(); // Cancel any speech on unmount
      }
      document.removeEventListener('click', interactionListener);
      document.removeEventListener('keydown', interactionListener);
      document.removeEventListener('touchstart', interactionListener);

      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      speechQueueRef.current = null;
      initialSpeechQueuedRef.current = false;
    };
  }, [updateSupportedVoicesList, cancelTTS, playQueuedSpeech]); // Added playQueuedSpeech

  useEffect(() => {
    updateSelectedVoiceLogic();
  }, [supportedVoices, voicePreference, updateSelectedVoiceLogic]);

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(oldPreference => {
      if (oldPreference !== preference) {
        // console.log("TTS: UI Voice preference changed to:", preference);
        return preference;
      }
      return oldPreference;
    });
  }, []);
  
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
        setSelectedVoice(currentSelected => {
          if (voice && (!currentSelected || currentSelected.voiceURI !== voice.voiceURI)) {
            // console.log("TTS: Voice selected by URI:", voice.name);
            return voice;
          }
          if (!voice && currentSelected !== null) {
            // console.log("TTS: Voice URI not found, clearing selected voice.");
            return null;
          }
          return currentSelected;
        });
      }, [supportedVoices]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
