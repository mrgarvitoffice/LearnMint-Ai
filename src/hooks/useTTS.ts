
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
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null); // This is the UI-selected preferred voice
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
      activeOnEndCallbackRef.current = null; // Clear callback on cancel
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []); // Stable: no dependencies

  const _performSpeak = useCallback((text: string, lang?: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      if (onEndCallback) onEndCallback();
      return;
    }
    cancelTTS(); // Always cancel previous before starting new

    activeOnEndCallbackRef.current = onEndCallback || null;
    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance;

    let voiceForUtterance: SpeechSynthesisVoice | null = null;
    let langForUtterance: string;

    if (lang && supportedVoices.length > 0) { // A specific language is requested for the content
        const langBase = lang.split('-')[0].toLowerCase();
        const langFull = lang.toLowerCase();

        // Tier 1: Find a voice explicitly matching the requested 'lang'
        voiceForUtterance = 
            supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.localService) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langFull) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.localService) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langBase && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langBase && v.localService) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langBase && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase() === langBase);
        
        if (voiceForUtterance) {
            langForUtterance = voiceForUtterance.lang; // Use the voice's specific lang tag
        } else {
            // Tier 2: No specific voice for 'lang' found.
            // Check if selectedVoice (UI preference) is for the SAME base language as 'lang'.
            if (selectedVoice && selectedVoice.lang.toLowerCase().startsWith(langBase)) {
                voiceForUtterance = selectedVoice;
                langForUtterance = selectedVoice.lang; // Use selectedVoice's specific lang tag
            } else {
                // Tier 3: selectedVoice is for a DIFFERENT language OR no selectedVoice at all.
                // Let browser pick default for 'lang'. VoiceForUtterance remains null.
                langForUtterance = lang;
            }
        }
    } else if (selectedVoice) { // No 'lang' requested for content, use UI preferred voice (selectedVoice)
        voiceForUtterance = selectedVoice;
        langForUtterance = selectedVoice.lang;
    } else { // No 'lang' for content, no UI preference. Fallback to a generic English voice or browser default.
        langForUtterance = 'en-US'; // Default to 'en-US'
        // Try to find a generic English voice if no specific preference
        voiceForUtterance = 
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.localService) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.localService) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en') && v.default) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en-us')) ||
            supportedVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
            supportedVoices.find(v => v.default); // Absolute last resort: any default voice
    }

    if (voiceForUtterance) {
        newUtterance.voice = voiceForUtterance;
    }
    newUtterance.lang = langForUtterance;
    newUtterance.pitch = 1.0;
    newUtterance.volume = 1.0;
    newUtterance.rate = langForUtterance.toLowerCase().startsWith('en') ? 1.4 : 1.0;
    
    // console.log(`TTS Debug (_performSpeak): Attempting to speak with: Voice='${newUtterance.voice?.name || "Browser Default"}', Lang='${newUtterance.lang}', Rate='${newUtterance.rate}', Pitch='${newUtterance.pitch}', Text='${text.substring(0,30)}...'`);

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
        if (callback) callback(); // Call callback even on error to allow sequences to terminate/continue
      }
    };
    newUtterance.onpause = () => { if (utteranceRef.current === newUtterance) setIsPaused(true); };
    newUtterance.onresume = () => { if (utteranceRef.current === newUtterance) setIsPaused(false); };
    
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices, cancelTTS]); // cancelTTS is stable

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

  const updateSupportedVoices = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const browserVoices = window.speechSynthesis.getVoices();
      setSupportedVoices(currentVoices => {
        if (currentVoices.length !== browserVoices.length || !currentVoices.every((v, i) => v.voiceURI === browserVoices[i]?.voiceURI)) {
          return browserVoices;
        }
        return currentVoices;
      });
    }
  }, []);

  useEffect(() => {
    updateSupportedVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateSupportedVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      cancelTTS();
    };
  }, [updateSupportedVoices, cancelTTS]);

  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
      setSelectedVoice(null); return;
    }

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const enVoices = supportedVoices.filter(v => v.lang.toLowerCase().startsWith('en'));
    
    // Keywords for preferences
    const ziaKeywords = ['zia', 'female', 'woman', 'girl', 'lady', 'samantha', 'eva', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'catherine', 'microsoft hazel', 'linda', 'heera', 'mia', 'veena', 'microsoft linda', 'google en-us'];
    const lumaKeywords = ['luma', 'female', 'woman', 'girl', 'lady', 'samantha', 'eva', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'catherine', 'microsoft hazel', 'linda', 'heera', 'mia', 'veena', 'microsoft linda', 'google en-us']; // Can be similar to Zia or distinct if Luma has other common names
    const kaiKeywords = ['kai', 'male', 'david', 'mark', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark', 'tom', 'george', 'satya', 'microsoft george'];

    if (voicePreference) {
        const prefLower = voicePreference.toLowerCase();
        let preferenceKeywords: string[] = [];
        if (voicePreference === 'zia') preferenceKeywords = ziaKeywords;
        else if (voicePreference === 'luma') preferenceKeywords = lumaKeywords;
        else if (voicePreference === 'kai') preferenceKeywords = kaiKeywords;

        // Tier 1: Exact name match for the preference (e.g., a voice named "Zia")
        preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.localService); // Any English local
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower) && v.lang.toLowerCase().startsWith('en-us')); // Any en-US
        if (!preferredVoice) preferredVoice = enVoices.find(v => v.name.toLowerCase().includes(prefLower)); // Any English matching name

        // Tier 2: Gendered keyword match if specific name fails for the preference
        if (!preferredVoice && preferenceKeywords.length > 0) {
            preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us') && v.localService);
            if (!preferredVoice) preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.localService);
            if (!preferredVoice) preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)) && v.lang.toLowerCase().startsWith('en-us'));
            if (!preferredVoice) preferredVoice = enVoices.find(v => preferenceKeywords.some(kw => v.name.toLowerCase().includes(kw)));
        }
    }

    // Tier 3: General fallbacks if no preference or no match from preference
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
           supportedVoices.find(v => v.default && v.lang.toLowerCase().startsWith('en')) || // Default English voice
           supportedVoices.find(v => v.default) || // Overall system default
           (enVoices.length > 0 ? enVoices[0] : undefined) || 
           (supportedVoices.length > 0 ? supportedVoices[0] : undefined);
    }
    
    // Uncomment for detailed debugging of voice selection:
    // console.log("TTS Debug (updateSelectedVoiceLogic): Available EN voices:", enVoices.map(v => ({name: v.name, lang: v.lang, local: v.localService, default: v.default })));
    // console.log("TTS Debug (updateSelectedVoiceLogic): Voice Preference UI:", voicePreference);
    // console.log("TTS Debug (updateSelectedVoiceLogic): Final Selected Default Voice:", preferredVoice ? { name: preferredVoice.name, lang: preferredVoice.lang, local: preferredVoice.localService, default: preferredVoice.default } : "None");
    
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

