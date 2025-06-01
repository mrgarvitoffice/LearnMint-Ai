
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
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
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
      // Re-assign onvoiceschanged in case it was cleared or another hook instance interfered
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    // Cleanup: remove the onvoiceschanged handler.
    // Important: also cancel any ongoing speech when the component using the hook unmounts.
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          // console.log("TTS: Cleaning up - cancelling speech on unmount or effect re-run.");
          window.speechSynthesis.cancel();
        }
         // Reset states on cleanup to avoid stale states if hook instance is re-created.
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      }
    };
  }, [populateVoiceList]);


  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      // console.log("TTS: Speak aborted. Conditions not met (no text, synth unavailable, or window undefined).");
      return;
    }

    // If there's an active utterance, explicitly nullify its event handlers before cancelling.
    if (utteranceRef.current) {
        // console.log(`TTS: Speak called. Clearing handlers for old utterance: "${utteranceRef.current.text.substring(0,20)}..."`);
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
    }

    // Always cancel any ongoing/pending speech to ensure a clean start for the new one.
    // console.log("TTS: Calling window.speechSynthesis.cancel() before new speech.");
    window.speechSynthesis.cancel();
    utteranceRef.current = null; // Clear the ref immediately after cancelling.

    // Reset speaking/paused state. The new utterance's onstart will set them appropriately.
    setIsSpeaking(false);
    setIsPaused(false);

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance; // Crucial: assign the new utterance to the ref

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US'; // Default to English if no lang specified

    if (lang && supportedVoices.length > 0) {
        const langBase = lang.split('-')[0].toLowerCase();
        // console.log(`TTS: Searching for voice for lang "${lang}", base "${langBase}"`);
        voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ||
                     supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
                     supportedVoices.find(v => v.lang.toLowerCase() === langBase);

        if (voiceToUse) {
            newUtterance.voice = voiceToUse;
            finalLangTag = voiceToUse.lang; // Use the actual language tag of the chosen voice
            // console.log(`TTS: For requested lang "${lang}", using specific voice: ${voiceToUse.name} (${voiceToUse.lang})`);
        } else {
            // console.log(`TTS: No specific voice found for lang "${lang}". Browser will attempt to use its default for lang tag: ${finalLangTag}. General selected voice: ${selectedVoice?.name}`);
            // If no specific language voice, but a general selectedVoice (UI preference) exists, use it.
            // The lang tag on utterance will still guide pronunciation if the voice is multi-lingual.
            if (selectedVoice) newUtterance.voice = selectedVoice;
        }
    } else if (selectedVoice) {
        newUtterance.voice = selectedVoice;
        finalLangTag = selectedVoice.lang;
        // console.log(`TTS: No specific lang. Using general selected UI voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
        // console.log(`TTS: No specific lang, no UI voice. Using browser default. Lang hint: ${finalLangTag}`);
    }

    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    newUtterance.rate = 1;
    newUtterance.volume = 1;

    newUtterance.onstart = () => {
      // console.log(`TTS: onstart fired for utterance: "${newUtterance.text.substring(0,20)}..."`);
      if (utteranceRef.current === newUtterance) {
        // console.log(`TTS: State update - onstart: isSpeaking=true. Voice: ${newUtterance.voice?.name || 'Browser Default'}, Lang: ${newUtterance.lang}`);
        setIsSpeaking(true);
        setIsPaused(false);
      } else {
        // console.warn("TTS: onstart for a stale utterance. Ignoring state update.");
      }
    };

    newUtterance.onend = () => {
      // console.log(`TTS: onend fired for utterance: "${newUtterance.text.substring(0,20)}..."`);
      if (utteranceRef.current === newUtterance) {
        // console.log("TTS: State update - onend: isSpeaking=false, isPaused=false.");
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null; // Clear ref once fully ended.
      } else {
        // console.warn("TTS: onend for a stale utterance. Ignoring state update.");
      }
    };

    newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
       // console.error(`TTS: onerror fired for utterance: "${newUtterance.text.substring(0,20)}...". Error: ${event.error}`);
      if (utteranceRef.current === newUtterance) {
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        if (event.error === "interrupted") {
          // console.warn("TTS: Utterance was reported as 'interrupted'. This often means speech.cancel() was called by a new speak() request, or external factors.");
        } else if (event.error === "audio-busy") {
          // console.warn("TTS: Speech synthesis error: 'audio-busy'. The audio output device is busy.");
        } else if (event.error === "language-unavailable" || event.error === "voice-unavailable") {
          // console.warn(`TTS: Speech synthesis error: '${event.error}'. The language or voice specified may not be supported.`);
        }
        // console.log("TTS: State update - onerror: isSpeaking=false, isPaused=false.");
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null; // Clear ref on error.
      } else {
         // console.warn("TTS: onerror for a stale utterance. Ignoring state update.");
      }
    };

    newUtterance.onpause = () => {
      // console.log(`TTS: onpause fired for utterance: "${newUtterance.text.substring(0,20)}..."`);
      if (utteranceRef.current === newUtterance) {
        // console.log("TTS: State update - onpause: isPaused=true.");
        setIsPaused(true);
      }
    };

    newUtterance.onresume = () => {
      // console.log(`TTS: onresume fired for utterance: "${newUtterance.text.substring(0,20)}..."`);
      if (utteranceRef.current === newUtterance) {
        // console.log("TTS: State update - onresume: isPaused=false.");
        setIsPaused(false);
      }
    };

    // A small delay can help ensure the previous cancel() has fully processed.
    setTimeout(() => {
        if (utteranceRef.current === newUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
            // console.log(`TTS: Attempting to speak (after delay): "${newUtterance.text.substring(0,30)}...", Voice: ${newUtterance.voice?.name || 'Browser Default'}, Lang: ${newUtterance.lang}`);
            window.speechSynthesis.speak(newUtterance);
        } else {
            // console.log(`TTS: Speak attempt (after delay) aborted. Utterance changed or synth unavailable. Current ref text: "${utteranceRef.current?.text.substring(0,20)}..."`);
        }
    }, 50); // 50ms delay

  }, [selectedVoice, supportedVoices, setIsSpeaking, setIsPaused]); // Dependencies

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking && !isPaused) {
      // console.log("TTS: Calling window.speechSynthesis.pause()");
      window.speechSynthesis.pause();
      // isPaused state will be updated by the utterance's onpause handler
    }
  }, [isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      // console.log("TTS: Calling window.speechSynthesis.resume()");
      window.speechSynthesis.resume();
      // isPaused state will be updated by the utterance's onresume handler
    }
  }, []);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // console.log("TTS: cancelTTS called directly.");
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
    // console.log("TTS: Setting voice preference to:", preference);
    setVoicePreference(preference);
    // The populateVoiceList effect will pick this up and try to set selectedVoice.
  }, []);

  // Effect to re-populate voice list if voicePreference changes (and voices are already loaded)
  useEffect(() => {
    if(supportedVoices.length > 0){ // Only if voices have been loaded at least once
        // console.log("TTS: Voice preference changed, re-populating voice list.");
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
            // console.log("TTS: Setting selected voice by URI to:", voice.name);
            setSelectedVoice(voice);
          }
        }
      }, [supportedVoices, selectedVoice]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
