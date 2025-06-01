
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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        // console.log("TTS: No voices loaded yet, attaching onvoiceschanged listener.");
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
      } else if (!('onvoiceschanged' in window.speechSynthesis)) {
        // console.warn("TTS: No voices found and onvoiceschanged event not supported. Speech may not work.");
      }
      return;
    }
    setSupportedVoices(voices);
    // console.log("TTS: Voices loaded:", voices.length, voices.map(v => ({name: v.name, lang: v.lang, default: v.default, uri: v.voiceURI })));

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
      // console.log(`TTS: UI Preferred voice set to: ${preferredVoiceForUI.name} (${preferredVoiceForUI.lang}) based on preference: ${voicePreference || 'auto-selected'}`);
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI) {
        setSelectedVoice(preferredVoiceForUI);
      }
    } else {
      // console.warn("TTS: No suitable UI voice found after all checks.");
      if (selectedVoice !== null) {
        setSelectedVoice(null);
      }
    }
  }, [voicePreference, selectedVoice]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Initial call
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);
        if(utteranceRef.current){
            utteranceRef.current.onstart = null;
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
            utteranceRef.current.onpause = null;
            utteranceRef.current.onresume = null;
        }
        utteranceRef.current = null;
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // 1. Clean up any existing utterance and its handlers
    if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
    }
    // 2. Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // 3. Reset state *before* creating new utterance
    // This ensures that if speak() is called rapidly, the state is for the *new* attempt.
    utteranceRef.current = null; // Clear the ref to the old utterance
    setIsSpeaking(false);       // Reset speaking state
    setIsPaused(false);         // Reset paused state


    // 4. Create and configure the new utterance
    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance; // Assign new utterance to ref

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US';

    if (lang && supportedVoices.length > 0) {
        const langBase = lang.split('-')[0].toLowerCase();
        voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ||
                     supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
                     supportedVoices.find(v => v.lang.toLowerCase() === langBase);

        if (voiceToUse) {
            newUtterance.voice = voiceToUse;
            finalLangTag = voiceToUse.lang;
        } else {
            if (selectedVoice) newUtterance.voice = selectedVoice;
        }
    } else if (selectedVoice) {
        newUtterance.voice = selectedVoice;
        finalLangTag = selectedVoice.lang;
    }

    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    newUtterance.rate = 1.5; // Increased rate for faster speech
    newUtterance.volume = 1;

    // 5. Set up event handlers for the new utterance
    // These handlers will only update state if they belong to the *current* utterance.
    newUtterance.onstart = () => {
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
      console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
      if (event.error === "interrupted") {
        console.warn("TTS: Utterance was reported as 'interrupted'. This usually means speech.cancel() was called, or a new speak() request pre-empted this one. Check for rapid speak() calls or external interruptions.");
      } else if (event.error === "audio-busy") {
        console.warn("TTS: Speech synthesis error: 'audio-busy'. The audio output device is busy.");
      } else if (event.error === "language-unavailable" || event.error === "voice-unavailable") {
        console.warn(`TTS: Speech synthesis error: '${event.error}'. The language or voice specified may not be supported.`);
      }
      if (utteranceRef.current === newUtterance) {
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

    // 6. Speak the utterance (optionally with a small delay)
    setTimeout(() => {
        if (utteranceRef.current === newUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.speak(newUtterance);
        }
    }, 50);

  }, [selectedVoice, supportedVoices, setIsSpeaking, setIsPaused]);

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
      if (utteranceRef.current) {
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
  }, [setIsSpeaking, setIsPaused]);

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(preference);
  }, []);

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
