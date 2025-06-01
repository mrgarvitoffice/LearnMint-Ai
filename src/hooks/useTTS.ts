
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
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null); // General purpose voice
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | 'luma' | null>(null);
  // utteranceRef is primarily for debugging or if we needed to access the current utterance object directly.
  // For basic control flow, cancel() is global.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
      }
      return;
    }
    setSupportedVoices(voices);

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady'];

    if (voicePreference === 'kai') {
      preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));
    } else if (voicePreference === 'luma' || voicePreference === 'zia') {
      const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
      preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));
    }

    if (!preferredVoiceForUI) {
      preferredVoiceForUI = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                       voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                       voices.find(v => v.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(v => v.lang.startsWith(currentLangPrefix)) ||
                       voices.find(v => v.default) ||
                       (voices.length > 0 ? voices[0] : undefined);
    }

    if (preferredVoiceForUI) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI) {
        setSelectedVoice(preferredVoiceForUI);
      }
    } else {
      if (selectedVoice !== null) {
        setSelectedVoice(null);
      }
    }
  }, [voicePreference, selectedVoice]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList();
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // Always cancel any ongoing speech first.
    // This is the primary mechanism to prevent interruptions from rapid self-calls.
    window.speechSynthesis.cancel();
    // Reset speaking/paused state immediately. The new utterance's onstart will set them again.
    setIsSpeaking(false);
    setIsPaused(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Store for potential debugging or direct access if needed.

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let usedSpecificLangVoice = false;

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0];
      voiceToUse = supportedVoices.find(v => v.lang === lang) ||
                   supportedVoices.find(v => v.lang.startsWith(langBase + "-")) ||
                   supportedVoices.find(v => v.lang === langBase);

      if (voiceToUse) {
        utterance.voice = voiceToUse;
        utterance.lang = voiceToUse.lang;
        usedSpecificLangVoice = true;
        // console.log(`TTS: Found specific voice for "${lang}": ${voiceToUse.name} (${voiceToUse.lang})`);
      } else {
        utterance.lang = lang; // Set lang hint, let browser choose voice
        // console.warn(`TTS: No specific voice found for lang "${lang}". Browser will use its default for this language.`);
      }
    } else if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      // console.log(`TTS: Using general selected UI voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
      utterance.lang = lang || 'en-US'; // Fallback lang hint
      // console.warn(`TTS: No specific voice or UI preference. Browser will use default. Lang hint: ${utterance.lang}`);
    }

    utterance.onstart = () => {
      // console.log(`TTS: Speech started. Text: "${text.substring(0,30)}...", Voice: ${utterance.voice?.name || 'Browser Default'}, Lang: ${utterance.lang}`);
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      // console.log(`TTS: Speech ended. Text: "${text.substring(0,30)}..."`);
      if (utteranceRef.current === utterance) { // Only clear if this is still the current utterance
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error('TTS: Speech synthesis error:', event.error, `Details: (error object details may vary by browser)`, `Text: "${text.substring(0,30)}..."`, `Voice: ${utterance.voice?.name || 'Browser Default'}`, `Lang: ${utterance.lang}`);
      if (event.error === "interrupted") {
        console.warn("TTS: Utterance was reported as 'interrupted'. This might be due to a new speak command being issued, navigation, or other browser behavior.");
      } else if (event.error === 'voice-unavailable' && voiceToUse && usedSpecificLangVoice) {
        console.warn(`TTS: Specific voice "${voiceToUse.name}" for lang "${lang}" became unavailable. Repopulating voice list might help if it was a temporary issue.`);
      } else if (event.error === 'language-unavailable') {
        console.warn(`TTS: Browser reported language "${utterance.lang}" is unavailable for synthesis.`);
      }
      if (utteranceRef.current === utterance) { // Only clear if this is still the current utterance
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
      // isSpeaking remains true while paused
    };

    utterance.onresume = () => {
      setIsPaused(false);
      // isSpeaking remains true
    };

    // Speak directly. The cancel() at the start should have cleared the way.
    window.speechSynthesis.speak(utterance);

  }, [selectedVoice, supportedVoices, setIsSpeaking, setIsPaused]); // Removed populateVoiceList from deps, it's stable and called by onvoiceschanged or effect

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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // This will trigger onend or onerror for the current utterance
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, [setIsSpeaking, setIsPaused]);

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(preference);
  }, []); // setVoicePreference from useState is stable

  useEffect(() => {
    if(supportedVoices.length > 0){
        populateVoiceList();
    }
  }, [voicePreference, supportedVoices.length, populateVoiceList]);

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
        if (voice) {
          if (!selectedVoice || selectedVoice.voiceURI !== voice.voiceURI) {
            setSelectedVoice(voice);
          }
        }
      }, [supportedVoices, selectedVoice]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
