
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

    cancelTTS();

    activeOnEndCallbackRef.current = onEndCallback || null;
    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

    let voiceForUtterance: SpeechSynthesisVoice | null = null;
    let langForUtterance: string | undefined = lang;

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();

      const findVoiceForLang = (targetLang: string, baseLangToMatch: string) =>
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang && v.localService) ||
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase() === targetLang) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLangToMatch + "-") && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLangToMatch + "-") && v.localService) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLangToMatch + "-") && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith(baseLangToMatch + "-"));
      
      voiceForUtterance = findVoiceForLang(langFull, langBase);

      if (voiceForUtterance) {
        langForUtterance = voiceForUtterance.lang;
      } else if (selectedVoice && selectedVoice.lang.toLowerCase().startsWith(langBase)) {
        voiceForUtterance = selectedVoice;
        langForUtterance = selectedVoice.lang;
      } else {
        // No specific voice for this lang, and UI selected voice is not for this lang's base.
        // Let browser pick best default for 'langForUtterance'.
      }
    } else if (selectedVoice) {
      voiceForUtterance = selectedVoice;
      langForUtterance = selectedVoice.lang;
    } else {
      langForUtterance = langForUtterance || 'en-US'; // Default to en-US if no lang specified and no voice selected
      voiceForUtterance =
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default) ||
        supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService && v.default) ||
        supportedVoices.find(v => v.default && v.lang.toLowerCase().startsWith('en'));
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

    if (enVoices.length === 0) { // No English voices at all
      setSelectedVoice(supportedVoices.find(v => v.default) || supportedVoices[0] || null);
      return;
    }

    const ziaKeywords = ["zia", "female", "samantha", "google us english", "microsoft zira", "ava", "allison", "susan", "joanna", "stephanie", "eva"];
    const lumaKeywords = ["luma", "female", "google uk english female", "microsoft hazel", "kate", "serena", "moira", "fiona", "emily", "microsoft catherine", "microsoft linda"];
    const kaiKeywords = ["kai", "male", "david", "google us english male", "microsoft david", "mark", "tom", "alex", "daniel", "oliver"];

    // Helper to find a voice, now with strict gender filtering based on preference
    const findVoice = (
      voicesToSearch: SpeechSynthesisVoice[],
      primaryKeywords: string[],
      // 'female' for zia/luma, 'male' for kai, 'none' if no gender preference from UI
      genderContext: 'female' | 'male' | 'none' 
    ): SpeechSynthesisVoice | undefined => {
      const criteriaOrder = [
        (v: SpeechSynthesisVoice) => v.localService && v.default && v.lang.toLowerCase().startsWith('en-us'),
        (v: SpeechSynthesisVoice) => v.localService && v.default,
        (v: SpeechSynthesisVoice) => v.localService && v.lang.toLowerCase().startsWith('en-us'),
        (v: SpeechSynthesisVoice) => v.localService,
        (v: SpeechSynthesisVoice) => v.default && v.lang.toLowerCase().startsWith('en-us'),
        (v: SpeechSynthesisVoice) => v.default,
        (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith('en-us'),
        (_v: SpeechSynthesisVoice) => true, // Any voice in the filtered list
      ];

      for (const criterion of criteriaOrder) {
        const voice = voicesToSearch.find(v => {
          const vNameLower = v.name.toLowerCase();
          const matchesPrimary = primaryKeywords.some(kw => vNameLower.includes(kw.toLowerCase()));
          if (!matchesPrimary) return false;

          // Strict gender filtering
          if (genderContext === 'female') { // Seeking female for Zia/Luma
            // If current voice name contains any male keyword, it's NOT a match
            if (kaiKeywords.some(maleKw => vNameLower.includes(maleKw.toLowerCase()))) return false;
          } else if (genderContext === 'male') { // Seeking male for Kai
            // If current voice name contains any (Zia or Luma) female keyword, it's NOT a match
            if (ziaKeywords.some(femaleKw => vNameLower.includes(femaleKw.toLowerCase())) ||
                lumaKeywords.some(femaleKw => vNameLower.includes(femaleKw.toLowerCase()))) return false;
          }
          // If genderContext is 'none', no specific gender exclusion based on preference.
          
          return criterion(v);
        });
        if (voice) return voice;
      }
      return undefined;
    };

    if (voicePreference === 'zia') {
      chosenVoice = findVoice(enVoices, ziaKeywords, 'female');
      if (!chosenVoice) { // Fallback for Zia: try with just "female" keywords if specific "zia" name keywords failed
        chosenVoice = findVoice(enVoices, ["female"], 'female');
      }
    } else if (voicePreference === 'luma') {
      chosenVoice = findVoice(enVoices, lumaKeywords, 'female');
      if (!chosenVoice) { // Fallback for Luma: try with just "female" keywords
         chosenVoice = findVoice(enVoices, ["female"], 'female');
      }
    } else if (voicePreference === 'kai') {
      chosenVoice = findVoice(enVoices, kaiKeywords, 'male');
       if (!chosenVoice) { // Fallback for Kai: try with just "male" keywords
         chosenVoice = findVoice(enVoices, ["male"], 'male');
      }
    }

    // If still no voice (either no preference, or preference + specific gendered keyword search failed):
    // This is a general fallback.
    if (!chosenVoice) {
      chosenVoice =
        enVoices.find(v => v.localService && v.default && v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices.find(v => v.localService && v.default) || // Any default local English
        enVoices.find(v => v.localService && v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices.find(v => v.localService) || // Any local English
        enVoices.find(v => v.default && v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices.find(v => v.default) || // Any default English
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) || // Any en-US
        enVoices[0]; // Absolute fallback to the first available English voice
    }
    
    // console.log("[LearnMint TTS Debug] Preference:", voicePreference, "Chosen Voice:", chosenVoice ? {name: chosenVoice.name, lang: chosenVoice.lang, uri: chosenVoice.voiceURI} : "None");
    // if (enVoices.length > 0 && (voicePreference === 'zia' || voicePreference === 'luma' || voicePreference === 'kai')) {
    //    console.log("[LearnMint TTS Debug] All English Voices:", enVoices.map(v => ({name: v.name, lang: v.lang, default: v.default, local: v.localService, uri: v.voiceURI })));
    // }

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

