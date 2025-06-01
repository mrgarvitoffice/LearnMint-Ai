
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
  setVoicePreference: (preference: 'zia' | 'luma' | 'kai' | null) => void;
  voicePreference: 'zia' | 'luma' | 'kai' | null;
}

// Keywords to help identify voice gender. These are indicative.
const FEMALE_INDICATOR_KEYWORDS = ["female", "samantha", "zira", "ava", "allison", "susan", "joanna", "stephanie", "eva", "hazel", "kate", "serena", "moira", "fiona", "emily", "catherine", "linda"];
const MALE_INDICATOR_KEYWORDS = ["male", "david", "mark", "tom", "alex", "daniel", "oliver"];


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
  const [voicePreference, setVoicePreference] = useState<'zia' | 'luma' | 'kai' | null>(null);

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

    if (langForUtterance && supportedVoices.length > 0) {
        const langBase = langForUtterance.split('-')[0].toLowerCase();
        const langFull = langForUtterance.toLowerCase();

        // Find a voice that explicitly matches the requested language
        const specificLangVoice = 
            supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.localService) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langFull) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.localService) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-"));
        
        if (specificLangVoice) {
            voiceForUtterance = specificLangVoice;
            langForUtterance = specificLangVoice.lang; // Use the voice's actual language tag
        } else if (selectedVoice && selectedVoice.lang.toLowerCase().startsWith(langBase)) {
            // If no specific voice for the content's lang, but the UI-selected voice is for the same base lang
            voiceForUtterance = selectedVoice;
            langForUtterance = selectedVoice.lang;
        } else {
            // Content lang is specified, but no matching voice found, AND UI selected voice is for a different base lang.
            // Do NOT use selectedVoice here. Let browser pick best default for langForUtterance.
            // voiceForUtterance remains null, utterance.lang will be set to langForUtterance.
        }
    } else if (selectedVoice) { // No specific lang for content, use UI preference
        voiceForUtterance = selectedVoice;
        langForUtterance = selectedVoice.lang;
    } else { // No content lang, no UI preference, try general fallback
        langForUtterance = langForUtterance || 'en-US';
        voiceForUtterance =
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService && v.default) ||
            supportedVoices.find(v => v.default && v.lang.toLowerCase().startsWith('en'));
    }


    if (voiceForUtterance) newUtterance.voice = voiceForUtterance;
    if (langForUtterance) newUtterance.lang = langForUtterance;
    
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
      setSelectedVoice(supportedVoices.find(v => v.default) || supportedVoices[0] || null);
      return;
    }

    // Helper to find a voice based on primary search keywords and exclusion keywords
    const findVoice = (
      voicesToSearch: SpeechSynthesisVoice[],
      primarySearchKws: string[],
      exclusionKws: string[]
    ): SpeechSynthesisVoice | undefined => {
      const candidateVoices = voicesToSearch.filter(v => {
        const vNameLower = v.name.toLowerCase();
        const matchesPrimary = primarySearchKws.some(kw => vNameLower.includes(kw.toLowerCase()));
        if (!matchesPrimary) return false; // Must match desired gender indicative keywords

        const containsExclusion = exclusionKws.some(exKw => vNameLower.includes(exKw.toLowerCase()));
        return !containsExclusion; // Must NOT match opposite gender indicative keywords
      });

      if (candidateVoices.length === 0) return undefined;

      // Prioritization criteria
      const criteriaOrder = [
        (v: SpeechSynthesisVoice) => v.localService && v.default && v.lang.toLowerCase().startsWith('en-us'),
        (v: SpeechSynthesisVoice) => v.localService && v.default,
        (v: SpeechSynthesisVoice) => v.localService && v.lang.toLowerCase().startsWith('en-us'),
        (v: SpeechSynthesisVoice) => v.localService,
        (v: SpeechSynthesisVoice) => v.default && v.lang.toLowerCase().startsWith('en-us'),
        (v: SpeechSynthesisVoice) => v.default,
        (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith('en-us'),
        (_v: SpeechSynthesisVoice) => true,
      ];

      for (const criterion of criteriaOrder) {
        const voice = candidateVoices.find(criterion);
        if (voice) return voice;
      }
      return candidateVoices[0] || undefined; // Fallback to the first candidate if criteria don't yield a specific one
    };

    if (voicePreference === 'zia' || voicePreference === 'luma') {
      chosenVoice = findVoice(enVoices, FEMALE_INDICATOR_KEYWORDS, MALE_INDICATOR_KEYWORDS);
    } else if (voicePreference === 'kai') {
      chosenVoice = findVoice(enVoices, MALE_INDICATOR_KEYWORDS, FEMALE_INDICATOR_KEYWORDS);
    }

    // General fallback if no preference or preference-based search failed
    if (!chosenVoice) {
      chosenVoice =
        enVoices.find(v => v.localService && v.default && v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices.find(v => v.localService && v.default) ||
        enVoices.find(v => v.localService && v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices.find(v => v.localService) ||
        enVoices.find(v => v.default && v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices.find(v => v.default) ||
        enVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
        enVoices[0];
    }
    
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


  const handleSetVoicePreference = useCallback((preference: 'zia' | 'luma' | 'kai' | null) => {
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

