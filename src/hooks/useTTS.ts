
"use client"; // This hook is client-side only due to browser's SpeechSynthesis API.

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @interface TTSHook
 * Defines the return type of the useTTS hook.
 */
interface TTSHook {
  speak: (text: string, lang?: string, onEndCallback?: () => void) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void;
  setVoicePreference: (preference: 'zia' | 'kai' | 'luma' | null) => void;
  voicePreference: 'zia' | 'kai' | 'luma' | null;
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
  const activeOnEndCallbackRef = useRef<(() => void) | null>(null);

  // Stable cancelTTS: Does not depend on isSpeaking or isPaused for memoization.
  // It directly calls the necessary cleanup and state resets.
  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (utteranceRef.current) {
        // Clear event handlers to prevent them from firing after cancellation
        // and potentially causing issues with stale closures or refs.
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
      }
      activeOnEndCallbackRef.current = null;
      window.speechSynthesis.cancel(); // This stops any ongoing or pending speech.
      utteranceRef.current = null;

      // Reset speaking states.
      // These setters are stable and won't cause `cancelTTS` to re-memoize if it itself doesn't depend on them.
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []); // Empty dependency array makes cancelTTS stable

  const _performSpeak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Always cancel previous speech. Since cancelTTS is stable, this won't cause _performSpeak to re-memoize unnecessarily.
    // This call ensures isSpeaking and isPaused are false before new utterance setup.
    cancelTTS();

    activeOnEndCallbackRef.current = onEndCallback || null;

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US';

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();
      // Prioritize local service voices for better quality/offline capability
      voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.localService) ||
                   supportedVoices.find(v => v.lang.toLowerCase() === langFull); // Non-local fallback
      if (!voiceToUse) { // Broader search if exact match failed
        voiceToUse = supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.localService) ||
                     supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-"));
      }
       if (!voiceToUse) { // Even broader (e.g., 'en' for 'en-US')
          voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langBase && v.localService) ||
                       supportedVoices.find(v => v.lang.toLowerCase() === langBase);
      }
      // If a specific language voice is found, use it and its lang tag
      if (voiceToUse) {
        newUtterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang; // Use the actual lang tag of the chosen voice
      } else if (selectedVoice) { // Fallback to user's preferred UI voice
        newUtterance.voice = selectedVoice;
        // IMPORTANT: Keep the *intended* lang tag for the utterance, even if using a default English voice.
        // This hints to the TTS engine about the language of the text content.
        finalLangTag = lang; 
      } else {
        // No specific voice found, no UI preference, use the provided lang or default.
        // Browser will pick its default voice for this lang.
        finalLangTag = lang;
      }
    } else if (selectedVoice) { // No specific lang requested, use UI preference
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
    } else { // No lang, no UI preference, use browser default for 'en-US'
      finalLangTag = lang || 'en-US';
    }
    
    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1.0; 
    newUtterance.volume = 1.0; // Ensure volume is max
    newUtterance.rate = finalLangTag && (finalLangTag.toLowerCase().startsWith('en')) ? 1.4 : 1.0;

    newUtterance.onstart = () => {
      if (utteranceRef.current === newUtterance) { // Ensure it's the current utterance
        setIsSpeaking(true);
        setIsPaused(false);
      }
    };
    newUtterance.onend = () => {
      if (utteranceRef.current === newUtterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        const callback = activeOnEndCallbackRef.current;
        activeOnEndCallbackRef.current = null;
        utteranceRef.current = null; // Clear ref after use
        if (callback) callback();
      }
    };
    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (utteranceRef.current === newUtterance) {
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        setIsSpeaking(false);
        setIsPaused(false);
        const callback = activeOnEndCallbackRef.current;
        activeOnEndCallbackRef.current = null;
        utteranceRef.current = null; // Clear ref after use
        if (callback) callback(); // Important for sequences to continue/terminate
      }
    };
    newUtterance.onpause = () => { if (utteranceRef.current === newUtterance) setIsPaused(true); };
    newUtterance.onresume = () => { if (utteranceRef.current === newUtterance) setIsPaused(false); };
    
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices, cancelTTS]); // cancelTTS is now stable

  const speak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    // Direct call, no interaction queue as per last request
    _performSpeak(text, lang, onEndCallback);
  }, [_performSpeak]);

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking && !isPaused) { // Check isPaused from state
      window.speechSynthesis.pause();
      // isPaused will be set by the onpause event handler
    }
  }, [isPaused]); // Depend on isPaused state to avoid unnecessary calls

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      // isPaused will be set to false by the onresume event handler
    }
  }, []); // No state dependencies needed here, acts directly on synth API

  // Effect for populating voices (runs once on mount, and when onvoiceschanged fires)
  useEffect(() => {
    const updateVoicesList = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const browserVoices = window.speechSynthesis.getVoices();
        // Only update if the list of available voices actually changes structure or content
        setSupportedVoices(currentVoices => {
            if (currentVoices.length !== browserVoices.length || !currentVoices.every((v, i) => v.voiceURI === browserVoices[i]?.voiceURI)) {
                return browserVoices;
            }
            return currentVoices; // No change
        });
      }
    };
    updateVoicesList(); // Initial population
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoicesList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      cancelTTS(); // Cleanup on unmount
    };
  }, [cancelTTS]); // cancelTTS is stable

  // Effect for updating selected voice based on preference or available voices
  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
        setSelectedVoice(null); return;
    }

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const enVoices = supportedVoices.filter(v => v.lang.toLowerCase().startsWith('en'));
    
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark', 'tom', 'george', 'satya', 'microsoft george', 'google en-us'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female', 'microsoft hazel', 'linda', 'heera', 'mia', 'veena', 'microsoft linda', 'google en-us'];

    if (voicePreference) {
        const prefLower = voicePreference.toLowerCase();
        const preferenceKeywords = voicePreference === 'kai' ? maleKeywords : femaleKeywords;

        // Tier 1: Exact name match (e.g., "Zia", "Luma", "Kai")
        preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.localService);
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.lang.toLowerCase().startsWith('en-us'));
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower));

        // Tier 2: Gendered keyword match if specific name fails for the preference
        if (!preferredVoice) {
            preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
            if (!preferredVoice) preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.localService);
            if (!preferredVoice) preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us'));
            if (!preferredVoice) preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)));
        }
    }

    // Tier 3: General fallbacks if no preference or no match from preference
    if (!preferredVoice) {
        preferredVoice = enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default) ||
                       enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService && v.default) ||
                       enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService) ||
                       enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService) ||
                       enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.default) ||
                       enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.default) ||
                       enVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
                       enVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
                       supportedVoices.find(v => v.default) || // Overall system default
                       (enVoices.length > 0 ? enVoices[0] : undefined) || // First available English voice
                       (supportedVoices.length > 0 ? supportedVoices[0] : undefined); // Absolute first voice
    }
    
    // console.log("TTS Debug: Final Selected Voice:", preferredVoice ? { name: preferredVoice.name, lang: preferredVoice.lang, local: preferredVoice.localService, default: preferredVoice.default } : "None");
    
    // Use functional update for setSelectedVoice to avoid depending on selectedVoice in useCallback
    setSelectedVoice(currentSelectedVoice => {
        if (preferredVoice && (!currentSelectedVoice || currentSelectedVoice.voiceURI !== preferredVoice.voiceURI)) {
            return preferredVoice;
        }
        if (!preferredVoice && currentSelectedVoice !== null) {
            return null;
        }
        return currentSelectedVoice; // No change needed
    });

  }, [supportedVoices, voicePreference]); // Depends on these states.

  useEffect(() => {
    updateSelectedVoiceLogic();
  }, [supportedVoices, voicePreference, updateSelectedVoiceLogic]); // updateSelectedVoiceLogic is now stable


  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    // Only update if the preference actually changes to avoid unnecessary re-renders/effect runs.
    setVoicePreference(oldPref => {
        if (oldPref !== preference) return preference;
        return oldPref;
    });
  }, []); // No dependencies, setVoicePreference from useState is stable.
  
  return {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    supportedVoices,
    selectedVoice,
    setSelectedVoiceURI: useCallback((uri: string) => { // Kept for potential direct URI selection if needed later
        const voice = supportedVoices.find(v => v.voiceURI === uri);
        setSelectedVoice(currentSelected => {
            if (voice && (!currentSelected || currentSelected.voiceURI !== voice.voiceURI)) {
                return voice;
            }
            if (!voice && currentSelected !== null) {
                return null;
            }
            return currentSelected;
        });
    }, [supportedVoices]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}

