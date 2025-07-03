
"use client"; // This hook is client-side only due to browser's SpeechSynthesis API.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/contexts/SettingsContext';

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
  setVoicePreference: (preference: 'holo' | 'gojo' | null) => void;
  voicePreference: 'holo' | 'gojo' | null;
}

// Keywords to help identify voice gender and quality.
const FEMALE_INDICATOR_KEYWORDS = ["female", "samantha", "zira", "ava", "allison", "susan", "joanna", "stephanie", "eva", "google us english", "microsoft zira", "google uk english female", "microsoft hazel", "kate", "serena", "moira", "fiona", "emily", "microsoft catherine", "microsoft linda", "alicia"];
const MALE_INDICATOR_KEYWORDS = ["male", "david", "mark", "tom", "alex", "daniel", "oliver", "google us english male", "microsoft david", "john", "matthew"];

// Preferences mapped to specific keyword lists (used for UI selections like "Holo", "Gojo")
const holoKeywords = ["holo", ...FEMALE_INDICATOR_KEYWORDS];
const gojoKeywords = ["gojo", ...MALE_INDICATOR_KEYWORDS];


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
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo' | null>(null);
  const isMobile = useIsMobile();
  const { isMuted } = useSettings();

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
    if (isMuted) {
      if (onEndCallback) onEndCallback();
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      if (onEndCallback) onEndCallback();
      return;
    }

    cancelTTS();

    activeOnEndCallbackRef.current = onEndCallback || null;
    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

    let voiceForUtterance: SpeechSynthesisVoice | null = null;
    
    // --- Start of New Voice Selection Logic ---
    if (supportedVoices.length > 0) {
        let potentialVoices = supportedVoices;
        // 1. Filter by language if provided
        if (lang) {
            const langBase = lang.split('-')[0].toLowerCase();
            const langFull = lang.toLowerCase();
            const langFiltered = supportedVoices.filter(v => 
                v.lang.toLowerCase() === langFull || v.lang.toLowerCase().startsWith(langBase + '-')
            );
            if (langFiltered.length > 0) {
                potentialVoices = langFiltered;
            }
        }
        
        // 2. From the potential voices (either all or language-filtered), try to match gender preference
        let preferredVoices: SpeechSynthesisVoice[] = [];
        if (voicePreference === 'gojo') { // Male preference
            preferredVoices = potentialVoices.filter(v => 
                gojoKeywords.some(kw => v.name.toLowerCase().includes(kw))
            );
        } else if (voicePreference === 'holo') { // Female preference
            preferredVoices = potentialVoices.filter(v => 
                holoKeywords.some(kw => v.name.toLowerCase().includes(kw))
            );
        }

        // 3. Select the best voice from the preferred list, or fallback to the potential list
        const findBest = (voices: SpeechSynthesisVoice[]) => 
            voices.find(v => v.localService && v.default) ||
            voices.find(v => v.localService) ||
            voices.find(v => v.default) ||
            voices[0];

        voiceForUtterance = findBest(preferredVoices) || findBest(potentialVoices);
    }

    // 4. Fallback to the globally selected voice if no specific match was found
    if (!voiceForUtterance) {
        voiceForUtterance = selectedVoice;
    }
    // --- End of New Voice Selection Logic ---

    if (voiceForUtterance) {
        newUtterance.voice = voiceForUtterance;
        newUtterance.lang = voiceForUtterance.lang;
    } else if (lang) {
        newUtterance.lang = lang; // Let browser pick if no voice object found
    }
    
    newUtterance.volume = 1.0;
    
    // Custom voice profiles for pitch
    if (voicePreference === 'gojo') {
      newUtterance.pitch = 0.95;
    } else if (voicePreference === 'holo') {
      newUtterance.pitch = 1.05;
    } else {
      newUtterance.pitch = 1.0;
    }

    // Custom voice profiles for rate
    if (voicePreference === 'holo') {
      newUtterance.rate = 0.9;
    } else {
      const isCurrentUtteranceEnglish = newUtterance.lang && newUtterance.lang.toLowerCase().startsWith('en');
      if (isMobile) {
        newUtterance.rate = isCurrentUtteranceEnglish ? 1.0 : 0.9;
      } else {
        newUtterance.rate = isCurrentUtteranceEnglish ? 1.1 : 1.0;
      }
    }

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
  }, [selectedVoice, supportedVoices, cancelTTS, isMobile, isMuted, voicePreference]);


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
        if (!matchesPrimary) return false; 

        const containsExclusion = exclusionKws.some(exKw => vNameLower.includes(exKw.toLowerCase()));
        return !containsExclusion; 
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
        (_v: SpeechSynthesisVoice) => true, // Fallback to first in filtered list
      ];

      for (const criterion of criteriaOrder) {
        const voice = candidateVoices.find(criterion);
        if (voice) return voice;
      }
      return candidateVoices[0] || undefined; 
    };

    if (voicePreference === 'holo') {
        chosenVoice = findVoice(enVoices, holoKeywords, MALE_INDICATOR_KEYWORDS);
    } else if (voicePreference === 'gojo') {
        chosenVoice = findVoice(enVoices, gojoKeywords, FEMALE_INDICATOR_KEYWORDS);
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


  const handleSetVoicePreference = useCallback((preference: 'holo' | 'gojo' | null) => {
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
