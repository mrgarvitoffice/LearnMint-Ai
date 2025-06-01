
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
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);


  const _performSpeak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      if (onEndCallback) onEndCallback();
      return;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
    }
    if (utteranceRef.current) { 
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
    }
    setIsSpeaking(false); 
    setIsPaused(false);
    activeOnEndCallbackRef.current = null; 
    utteranceRef.current = null;

    activeOnEndCallbackRef.current = onEndCallback || null;
    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

    let voiceForUtterance: SpeechSynthesisVoice | null = null;
    let langForUtterance: string | undefined = lang; 

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();

      const findVoiceForLang = (targetLang: string, baseLang: string) =>
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang && v.localService) ||
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLang + "-") && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLang + "-") && v.localService) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLang + "-") && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLang + "-")) ||
        supportedVoices.find(v => v.lang.toLowerCase() === baseLang && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase() === baseLang && v.localService) ||
        supportedVoices.find(v => v.lang.toLowerCase() === baseLang && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase() === baseLang);

      voiceForUtterance = findVoiceForLang(langFull, langBase);

      if (voiceForUtterance) {
        langForUtterance = voiceForUtterance.lang;
      } else if (selectedVoice && selectedVoice.lang.toLowerCase().startsWith(langBase)) {
        voiceForUtterance = selectedVoice;
        langForUtterance = selectedVoice.lang;
      } else {
        // langForUtterance is already set to 'lang' from the parameter.
        // Let browser pick its default for the specified lang.
      }
    } else if (selectedVoice) { 
      voiceForUtterance = selectedVoice;
      langForUtterance = selectedVoice.lang;
    } else { 
      langForUtterance = langForUtterance || 'en-US'; 
      voiceForUtterance =
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
        supportedVoices.find(v => v.default && v.lang.toLowerCase().startsWith('en')) ||
        supportedVoices.find(v => v.default);
    }

    if (voiceForUtterance) {
      newUtterance.voice = voiceForUtterance;
    }
    if (langForUtterance) {
      newUtterance.lang = langForUtterance;
    }
    
    newUtterance.pitch = 1.0;
    newUtterance.volume = 1.0;
    newUtterance.rate = (newUtterance.lang && (newUtterance.lang.toLowerCase().startsWith('en') || newUtterance.lang.toLowerCase().startsWith('es'))) ? 1.4 : 1.0;


    newUtterance.onstart = () => { if (utteranceRef.current === newUtterance) { setIsSpeaking(true); setIsPaused(false); }};
    newUtterance.onend = () => {
      if (utteranceRef.current === newUtterance) { 
        setIsSpeaking(false); setIsPaused(false);
        const callback = activeOnEndCallbackRef.current;
        activeOnEndCallbackRef.current = null; utteranceRef.current = null;
        if (callback) callback();
      }
    };
    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (utteranceRef.current === newUtterance) { 
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        setIsSpeaking(false); setIsPaused(false);
        const callback = activeOnEndCallbackRef.current;
        activeOnEndCallbackRef.current = null; utteranceRef.current = null;
        if (callback) callback();
      }
    };
    newUtterance.onpause = () => { if (utteranceRef.current === newUtterance) setIsPaused(true); };
    newUtterance.onresume = () => { if (utteranceRef.current === newUtterance) setIsPaused(false); };

    window.speechSynthesis.speak(newUtterance);
  }, [selectedVoice, supportedVoices, cancelTTS]);


  const speak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
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

  const setSupportedVoicesSafe = useCallback((voices: SpeechSynthesisVoice[]) => {
    setSupportedVoices(currentVoices => {
      if (currentVoices.length !== voices.length || !currentVoices.every((v, i) => v.voiceURI === voices[i]?.voiceURI)) {
        return voices;
      }
      return currentVoices;
    });
  }, []);

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setSupportedVoicesSafe(window.speechSynthesis.getVoices());
      }
    };
    updateVoices(); 
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      cancelTTS();
    };
  }, [setSupportedVoicesSafe, cancelTTS]);


  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
      setSelectedVoice(null); return;
    }

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const enVoices = supportedVoices.filter(v => v.lang.toLowerCase().startsWith('en'));

    const ziaKeywords = ["zia", "female", "samantha", "google us english", "microsoft zira", "ava", "allison", "susan", "joanna", "stephanie", "eva"];
    const lumaKeywords = ["luma", "female", "google uk english female", "microsoft hazel", "kate", "serena", "moira", "fiona", "emily", "microsoft catherine", "microsoft linda"];
    const kaiKeywords = ziaKeywords; // Kai now targets female voices, same as Zia

    const findVoiceByKeywordsAndCriteria = (
        voices: SpeechSynthesisVoice[],
        namePreference: string | null, 
        targetKeywords: string[]
      ) => {
      let foundVoice: SpeechSynthesisVoice | undefined;

      if (namePreference) {
        foundVoice = voices.find(v => v.name.toLowerCase().includes(namePreference) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
        if (foundVoice) return foundVoice;
        foundVoice = voices.find(v => v.name.toLowerCase().includes(namePreference) && v.localService);
        if (foundVoice) return foundVoice;
        foundVoice = voices.find(v => v.name.toLowerCase().includes(namePreference) && v.lang.toLowerCase().startsWith('en-us'));
        if (foundVoice) return foundVoice;
        foundVoice = voices.find(v => v.name.toLowerCase().includes(namePreference));
        if (foundVoice) return foundVoice;
      }

      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default);
      if (foundVoice) return foundVoice;
      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
      if (foundVoice) return foundVoice;
      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.localService && v.default);
      if (foundVoice) return foundVoice;
      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.localService);
      if (foundVoice) return foundVoice;
      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us') && v.default);
      if (foundVoice) return foundVoice;
      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us'));
      if (foundVoice) return foundVoice;
      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.default);
      if (foundVoice) return foundVoice;
      foundVoice = voices.find(v => targetKeywords.some(kw => v.name.toLowerCase().includes(kw)));
      return foundVoice;
    };

    if (voicePreference === 'zia') {
      preferredVoice = findVoiceByKeywordsAndCriteria(enVoices, 'zia', ziaKeywords);
    } else if (voicePreference === 'luma') {
      preferredVoice = findVoiceByKeywordsAndCriteria(enVoices, 'luma', lumaKeywords);
    } else if (voicePreference === 'kai') {
      preferredVoice = findVoiceByKeywordsAndCriteria(enVoices, 'kai', kaiKeywords); // Kai now uses female keywords
    }

    if (!preferredVoice) {
      preferredVoice =
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
        supportedVoices.find(v => v.default && v.lang.toLowerCase().startsWith('en')) ||
        supportedVoices.find(v => v.default) || 
        (enVoices.length > 0 ? enVoices[0] : undefined) ||
        (supportedVoices.length > 0 ? supportedVoices[0] : undefined);
    }
    
    setSelectedVoice(currentSelected => {
      if (preferredVoice && (!currentSelected || currentSelected.voiceURI !== preferredVoice.voiceURI)) {
        return preferredVoice;
      }
      if (!preferredVoice && currentSelected !== null) {
        return null;
      }
      return currentSelected;
    });

  }, [supportedVoices, voicePreference]);


  useEffect(() => {
    updateSelectedVoiceLogic();
  }, [updateSelectedVoiceLogic]);


  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(oldPref => {
        if (oldPref !== preference) return preference;
        return oldPref;
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
            if (voice && (!currentSelected || currentSelected.voiceURI !== voice.voiceURI)) return voice;
            if (!voice && currentSelected !== null) return null;
            return currentSelected;
        });
    }, [supportedVoices]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
