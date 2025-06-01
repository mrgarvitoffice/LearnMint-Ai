
"use client"; // This hook is client-side only due to browser's SpeechSynthesis API.

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @interface TTSHook
 * Defines the return type of the useTTS hook.
 */
interface TTSHook {
  speak: (text: string, lang?: string, onEndCallback?: () => void) => void; // Added onEndCallback
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


  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
      }
      activeOnEndCallbackRef.current = null; // Clear any pending onEnd callback
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
      // console.log("TTS: Cancelled. Speaking/Paused states reset. Active onEnd callback cleared.");
    }
  }, []); // isSpeaking and isPaused were removed as they create cycles when cancelTTS is used in _performSpeak

  const _performSpeak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // Aggressive cleanup of previous utterance and state, as per your request for "instant" speech
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
        // console.log("TTS: Speech active/pending/paused. Cancelling existing before new speak.");
        cancelTTS(); // This will reset isSpeaking, isPaused, and utteranceRef
    } else {
        // Explicitly reset states if cancelTTS wasn't invoked because nothing was speaking
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
    }
    activeOnEndCallbackRef.current = onEndCallback || null; // Store the callback for this specific utterance


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
      } else {
        newUtterance.voice = selectedVoice;
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

    if (finalLangTag && (finalLangTag.toLowerCase().startsWith('hi') || finalLangTag.toLowerCase().startsWith('sa'))) {
      newUtterance.rate = 1.0; 
    } else {
      newUtterance.rate = 1.4; 
    }
    // console.log("TTS: Utterance configured. Voice:", newUtterance.voice?.name, "Lang:", newUtterance.lang, "Rate:", newUtterance.rate, "Pitch:", newUtterance.pitch);

    newUtterance.onstart = () => {
      if (utteranceRef.current === newUtterance) setIsSpeaking(true); setIsPaused(false);
    };
    newUtterance.onend = () => {
      if (utteranceRef.current === newUtterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        const callback = activeOnEndCallbackRef.current; // Get stored callback
        activeOnEndCallbackRef.current = null; // Clear it after getting
        utteranceRef.current = null;
        if (callback) {
          // console.log("TTS: onend, invoking callback for naturally ended speech.");
          callback();
        }
      }
    };
    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (utteranceRef.current === newUtterance) {
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        setIsSpeaking(false);
        setIsPaused(false);
        activeOnEndCallbackRef.current = null; // Clear callback on error too
        utteranceRef.current = null;
      }
    };
    newUtterance.onpause = () => { if (utteranceRef.current === newUtterance) setIsPaused(true); };
    newUtterance.onresume = () => { if (utteranceRef.current === newUtterance) setIsPaused(false); };
    
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices, cancelTTS]);


  const speak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    // console.log("TTS: Public speak called for:", text.substring(0,30)+"...", "Lang:", lang);
    _performSpeak(text, lang, onEndCallback);
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

  const updateSupportedVoicesList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setSupportedVoices(prevVoices => {
            // Only update if the list actually changed to avoid unnecessary re-renders
            if (voices.length !== prevVoices.length || !voices.every((v, i) => v.voiceURI === prevVoices[i]?.voiceURI)) {
                return voices;
            }
            return prevVoices;
        });
    }
  }, []);

  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
      setSelectedVoice(null);
      return;
    }

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark', 'tom', 'george', 'satya', 'microsoft george'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female', 'microsoft hazel', 'linda', 'heera', 'mia', 'veena', 'microsoft linda'];


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
        return preferredVoiceForUI;
      }
      if (!preferredVoiceForUI && currentVal !== null) {
        return null;
      }
      return currentVal;
    });
  }, [supportedVoices, voicePreference]);


  useEffect(() => {
    updateSupportedVoicesList(); // Initial fetch
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateSupportedVoicesList;
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        cancelTTS();
      }
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      activeOnEndCallbackRef.current = null;
    };
  }, [updateSupportedVoicesList, cancelTTS]);

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
