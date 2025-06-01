
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

    cancelTTS(); // Cancel any ongoing speech before starting new

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
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLang + "-"));

      voiceForUtterance = findVoiceForLang(langFull, langBase);

      if (voiceForUtterance) {
        langForUtterance = voiceForUtterance.lang;
      } else if (selectedVoice && selectedVoice.lang.toLowerCase().startsWith(langBase)) {
        // If a specific lang voice isn't found, but UI selected voice matches base lang (e.g. en-GB for en-US content)
        voiceForUtterance = selectedVoice;
        langForUtterance = selectedVoice.lang;
      } else {
        // No specific voice for this lang, and selectedVoice is for a different language.
        // Let browser pick best default for 'langForUtterance'.
        // console.log(`TTS: No specific voice for lang "${lang}", and UI selected voice "${selectedVoice?.name}" is not for base lang "${langBase}". Browser will pick default for "${langForUtterance}".`);
      }
    } else if (selectedVoice) { // No specific lang for content, use UI selected voice
      voiceForUtterance = selectedVoice;
      langForUtterance = selectedVoice.lang;
    } else { // No specific lang for content, and no UI selected voice, try to find a general English default
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
    newUtterance.rate = (newUtterance.lang && (newUtterance.lang.toLowerCase().startsWith('en'))) ? 1.4 : 1.0;

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

    let chosenVoice: SpeechSynthesisVoice | undefined;
    const enVoices = supportedVoices.filter(v => v.lang.toLowerCase().startsWith('en'));

    if (enVoices.length === 0) {
      // If no English voices, pick any default or first available voice from all languages
      setSelectedVoice(supportedVoices.find(v => v.default) || supportedVoices[0] || null);
      return;
    }

    // Keywords for preferences (already optimized for quality female voices for Zia/Luma)
    const ziaKeywords = ["zia", "female", "samantha", "google us english", "microsoft zira", "ava", "allison", "susan", "joanna", "stephanie", "eva"];
    const lumaKeywords = ["luma", "female", "google uk english female", "microsoft hazel", "kate", "serena", "moira", "fiona", "emily", "microsoft catherine", "microsoft linda"];
    const kaiKeywords = ["kai", "male", "david", "google us english male", "microsoft david", "mark", "tom", "alex", "daniel", "oliver"];

    // Helper to search voices based on keywords and criteria
    const findVoice = (
      voicesToSearch: SpeechSynthesisVoice[],
      primaryKeywords: string[],
      isStrictlyGendered: boolean, // If true, avoid opposite gender even in broad match
      preferredGenderKeyword?: "female" | "male" // e.g., "female" for Zia/Luma, "male" for Kai
    ): SpeechSynthesisVoice | undefined => {
      let voice: SpeechSynthesisVoice | undefined;
      const criteriaOrder = [
        (v: SpeechSynthesisVoice) => v.localService && v.default,
        (v: SpeechSynthesisVoice) => v.localService,
        (v: SpeechSynthesisVoice) => v.default,
        (_v: SpeechSynthesisVoice) => true, // Any voice
      ];

      for (const criterion of criteriaOrder) {
        voice = voicesToSearch.find(v => 
          primaryKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase())) && 
          criterion(v) &&
          (!isStrictlyGendered || !preferredGenderKeyword || (preferredGenderKeyword === "female" && !kaiKeywords.some(maleKw => v.name.toLowerCase().includes(maleKw.toLowerCase()))) || (preferredGenderKeyword === "male" && !ziaKeywords.some(femaleKw => v.name.toLowerCase().includes(femaleKw.toLowerCase())) && !lumaKeywords.some(femaleKw => v.name.toLowerCase().includes(femaleKw.toLowerCase())) ))
        );
        if (voice) return voice;
      }
      return undefined;
    };
    
    // console.log("LearnMint TTS: Available English Voices:", enVoices.map(v => ({name: v.name, lang: v.lang, default: v.default, local: v.localService})));
    // console.log("LearnMint TTS: Current Voice Preference:", voicePreference);

    if (voicePreference === 'zia') {
      chosenVoice = findVoice(enVoices, ziaKeywords, true, "female");
      if (!chosenVoice) { // Fallback for Zia: any other voice primarily marked female
        chosenVoice = findVoice(enVoices, ["female"], true, "female");
      }
    } else if (voicePreference === 'luma') {
      chosenVoice = findVoice(enVoices, lumaKeywords, true, "female");
      if (!chosenVoice) { // Fallback for Luma: any other voice primarily marked female
         chosenVoice = findVoice(enVoices, ["female"], true, "female");
      }
    } else if (voicePreference === 'kai') {
      chosenVoice = findVoice(enVoices, kaiKeywords, true, "male");
       if (!chosenVoice) { // Fallback for Kai: any other voice primarily marked male
         chosenVoice = findVoice(enVoices, ["male"], true, "male");
      }
    }

    // If still no voice (either no preference, or preference + gendered fallback failed):
    if (!chosenVoice) {
      // General English voice fallback (prioritizing US, local, default)
      chosenVoice =
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices[0]; // Absolute fallback to the first available English voice
    }
    
    // console.log("LearnMint TTS: Chosen Voice:", chosenVoice ? {name: chosenVoice.name, lang: chosenVoice.lang} : "None");

    setSelectedVoice(currentSelected => {
      if (chosenVoice && (!currentSelected || currentSelected.voiceURI !== chosenVoice.voiceURI)) {
        return chosenVoice;
      }
      if (!chosenVoice && currentSelected !== null) {
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

