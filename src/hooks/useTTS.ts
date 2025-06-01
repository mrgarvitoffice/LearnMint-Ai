
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
  // Removed hasInteractedRef, speechQueueRef, initialSpeechQueuedRef for immediate speak attempts

  const cancelCurrentSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (utteranceRef.current) {
        // Nullify handlers to prevent them from firing after cancellation
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


  const _performSpeak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // Cancel any ongoing or pending speech and reset states immediately
    cancelCurrentSpeech();

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance; // Assign new utterance to ref *before* setting handlers

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US';
    
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female'];


    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();
      voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langFull) ||
                   supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
                   supportedVoices.find(v => v.lang.toLowerCase() === langBase);

      if (voiceToUse) {
        newUtterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang;
      } else {
        newUtterance.voice = selectedVoice; 
        finalLangTag = lang;
      }
    } else if (selectedVoice) {
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
    }

    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    newUtterance.rate = 1.5; // Fast speech rate
    newUtterance.volume = 1;

    newUtterance.onstart = () => {
      // Ensure this event belongs to the current utterance in ref
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
      if (utteranceRef.current === newUtterance) {
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
    
    // Directly attempt to speak
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices, cancelCurrentSpeech]);


  const speak = useCallback((text: string, lang?: string) => {
    _performSpeak(text, lang); // All speak calls go directly to _performSpeak
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
    cancelCurrentSpeech();
  }, [cancelCurrentSpeech]);

  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
      setSelectedVoice(null);
      return;
    }

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female', 'microsoft hazel'];

    if (voicePreference === 'kai') {
        preferredVoiceForUI = supportedVoices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix)));
    } else if (voicePreference === 'luma' || voicePreference === 'zia') {
        const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
        const secondaryNameMatch = voicePreference === 'luma' ? 'zia' : 'luma';
        preferredVoiceForUI = supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix)) ||
                           femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.includes('en'))) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(currentLangPrefix));
    }

    if (!preferredVoiceForUI) {
        preferredVoiceForUI = supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(v => v.default) ||
                           (supportedVoices.length > 0 ? supportedVoices[0] : undefined);
    }
    
    setSelectedVoice(currentVal => {
      if (preferredVoiceForUI && (!currentVal || currentVal.voiceURI !== preferredVoiceForUI.voiceURI)) {
        return preferredVoiceForUI;
      }
      if (!preferredVoiceForUI && currentVal !== null) {
        return null;
      }
      return currentVal;
    });
  }, [supportedVoices, voicePreference]);


  useEffect(() => {
    const getAndSetVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setSupportedVoices(currentList => {
          if (voices.length === currentList.length && voices.every((v, i) => v.voiceURI === currentList[i].voiceURI)) {
            return currentList;
          }
          return voices;
        });
      }
    };

    getAndSetVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', getAndSetVoices);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', getAndSetVoices);
        cancelCurrentSpeech(); // Ensure cleanup on unmount
      }
    };
  }, [cancelCurrentSpeech]);


  useEffect(() => {
    updateSelectedVoiceLogic();
  }, [supportedVoices, voicePreference, updateSelectedVoiceLogic]);


  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(oldPreference => {
      if (oldPreference !== preference) {
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

