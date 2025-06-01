
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
  const hasInteractedRef = useRef(false);
  const speechQueueRef = useRef<{ text: string; lang?: string; onEndCallback?: () => void } | null>(null);
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
      activeOnEndCallbackRef.current = null;
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      
      // Only reset speaking/paused states if they are currently true, to avoid extra re-renders
      if (isSpeaking) setIsSpeaking(false);
      if (isPaused) setIsPaused(false);
      speechQueueRef.current = null; // Clear any queued speech
    }
  }, [isSpeaking, isPaused]); // Dependencies are now stable


  const _performSpeak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      if (onEndCallback) onEndCallback(); // Call callback if no speech attempted
      return;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
      cancelTTS();
    } else {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
    activeOnEndCallbackRef.current = onEndCallback || null;

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

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
        finalLangTag = voiceToUse.lang;
      } else if (selectedVoice) { // Fallback to preferred UI voice if specific lang voice not found
        newUtterance.voice = selectedVoice;
        // Keep the intended lang tag for the utterance, even if using a default English voice
        finalLangTag = lang; 
      } else {
        finalLangTag = lang;
      }
    } else if (selectedVoice) {
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
    } else {
      finalLangTag = lang || 'en-US';
    }
    
    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1.0; 
    newUtterance.volume = 1;

    if (finalLangTag && (finalLangTag.toLowerCase().startsWith('en'))) {
      newUtterance.rate = 1.4;
    } else {
      newUtterance.rate = 1.0;
    }
    
    newUtterance.onstart = () => {
      if (utteranceRef.current === newUtterance) setIsSpeaking(true); setIsPaused(false);
    };
    newUtterance.onend = () => {
      if (utteranceRef.current === newUtterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        const callback = activeOnEndCallbackRef.current;
        activeOnEndCallbackRef.current = null;
        utteranceRef.current = null;
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
        utteranceRef.current = null;
        if (callback) callback(); // Call callback on error too, so sequences can continue/terminate
      }
    };
    newUtterance.onpause = () => { if (utteranceRef.current === newUtterance) setIsPaused(true); };
    newUtterance.onresume = () => { if (utteranceRef.current === newUtterance) setIsPaused(false); };
    
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices, cancelTTS]); // cancelTTS is memoized

  const playQueuedSpeech = useCallback(() => {
    if (speechQueueRef.current) {
      const { text, lang, onEndCallback } = speechQueueRef.current;
      _performSpeak(text, lang, onEndCallback);
      speechQueueRef.current = null;
      initialSpeechQueuedRef.current = false; // Mark as processed
    }
  }, [_performSpeak]);


  const speak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    if (!hasInteractedRef.current && !initialSpeechQueuedRef.current) {
      // If no interaction yet, and it's the first attempt to queue initial speech
      speechQueueRef.current = { text, lang, onEndCallback };
      initialSpeechQueuedRef.current = true; // Mark that initial speech has been queued
      return;
    }
    // If already interacted, or if initial speech was already queued/processed, speak directly
     if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
        cancelTTS(); // Cancel existing before new speak
    }
    _performSpeak(text, lang, onEndCallback);
  }, [_performSpeak, cancelTTS]); // Removed hasInteractedRef & initialSpeechQueuedRef from deps as they are refs

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

  // Effect for initializing voices and setting up interaction listener
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        // Only update if the list of available voices actually changes
        setSupportedVoices(currentVoices => {
            if (currentVoices.length !== voices.length || !currentVoices.every((v, i) => v.voiceURI === voices[i]?.voiceURI)) {
                return voices;
            }
            return currentVoices;
        });
      }
    };

    updateVoices(); // Initial call
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    const handleInteraction = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
        playQueuedSpeech();
      }
    };

    if (!hasInteractedRef.current) {
      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('keydown', handleInteraction, { once: true });
      document.addEventListener('touchstart', handleInteraction, { once: true });
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      cancelTTS(); // Cleanup on unmount
    };
  }, [playQueuedSpeech, cancelTTS]);


  // Effect for updating selected voice based on preference or available voices
  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
        setSelectedVoice(null); return;
    }

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const enVoices = supportedVoices.filter(v => v.lang.toLowerCase().startsWith('en'));
    
    // For debugging: Log available English voices
    // console.log("TTS Debug: Available English Voices:", enVoices.map(v => ({ name: v.name, lang: v.lang, local: v.localService, default: v.default })));
    // console.log("TTS Debug: Current Voice Preference:", voicePreference);

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark', 'tom', 'george', 'satya', 'microsoft george', 'google en-us'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female', 'microsoft hazel', 'linda', 'heera', 'mia', 'veena', 'microsoft linda', 'google en-us'];


    if (voicePreference) {
        const prefLower = voicePreference.toLowerCase();
        // 1. Try exact name match with preference, local service, en-US
        preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
        // 2. Try exact name match with preference, local service, any 'en'
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.localService);
        // 3. Try exact name match with preference, en-US
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.lang.toLowerCase().startsWith('en-us'));
        // 4. Try exact name match with preference, any 'en'
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower));

        // 5. If specific name match failed, fall back to gendered keywords based on preference
        if (!preferredVoice) {
            const keywordsToUse = voicePreference === 'kai' ? maleKeywords : femaleKeywords;
            // 5a. Gendered keyword, local service, en-US
            preferredVoice = enVoices.find(v => keywordsToUse.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
            // 5b. Gendered keyword, local service, any 'en'
            if (!preferredVoice) preferredVoice = enVoices.find(v => keywordsToUse.some(kw => v.name.toLowerCase().includes(kw)) && v.localService);
            // 5c. Gendered keyword, en-US
            if (!preferredVoice) preferredVoice = enVoices.find(v => keywordsToUse.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us'));
            // 5d. Gendered keyword, any 'en'
            if (!preferredVoice) preferredVoice = enVoices.find(v => keywordsToUse.some(kw => v.name.toLowerCase().includes(kw)));
        }
    }

    // 6. If still no voice, try general fallbacks
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

    setSelectedVoice(currentVal => {
        if (preferredVoice && (!currentVal || currentVal.voiceURI !== preferredVoice.voiceURI)) {
            return preferredVoice;
        }
        if (!preferredVoice && currentVal !== null) {
            return null;
        }
        return currentVal; // No change needed
    });

  }, [supportedVoices, voicePreference]);


  useEffect(() => {
    updateSelectedVoiceLogic();
  }, [supportedVoices, voicePreference, updateSelectedVoiceLogic]);


  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(oldPref => {
        if (oldPref !== preference) return preference;
        return oldPref; // No change if preference is the same
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

