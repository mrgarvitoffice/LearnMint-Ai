
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
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | 'luma' | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Removed user interaction queue for initial speech as per user request for immediate playback attempts.

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (utteranceRef.current) {
        // Nullify handlers to prevent them from firing after cancellation
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
      }
      window.speechSynthesis.cancel(); // Stop any current or pending speech
      utteranceRef.current = null;     // Clear the reference
      setIsSpeaking(false);            // Reset speaking state
      setIsPaused(false);              // Reset paused state
    }
  }, []);


  const _performSpeak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // Immediately cancel any ongoing or pending speech and reset associated states and refs
    // This allows new speech requests to "overlap" by interrupting previous ones.
    cancelTTS();

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance; // Assign new utterance to ref *before* setting handlers

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US'; // Default if nothing else works

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark', 'tom'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female', 'microsoft hazel', 'linda', 'heera'];


    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();

      // Try to find a voice that exactly matches the full lang tag (e.g., "hi-IN")
      // Prioritize localService voices as they are often higher quality.
      voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langFull && v.localService) ||
                   supportedVoices.find(v => v.lang.toLowerCase() === langFull);

      // If not found, try to find one that starts with the base language (e.g., "hi-")
      if (!voiceToUse) {
        voiceToUse = supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-") && v.localService) ||
                     supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-"));
      }
      // If still not found, try to find one that matches just the base language (e.g., "hi")
      if (!voiceToUse) {
          voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langBase && v.localService) ||
                       supportedVoices.find(v => v.lang.toLowerCase() === langBase);
      }

      if (voiceToUse) {
        newUtterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang; // Use the actual language tag of the selected voice
        console.log(`TTS: For requested lang "${lang}", using voice: "${voiceToUse.name}" (lang: ${voiceToUse.lang}, default: ${voiceToUse.default}, local: ${voiceToUse.localService})`);
      } else {
        // No specific voice found for the requested language.
        // Use the general UI preferred voice (selectedVoice) but set the utterance's lang property.
        newUtterance.voice = selectedVoice; // Might be null or an English voice
        finalLangTag = lang; // CRITICAL: Keep the originally requested language tag for the utterance
        console.warn(`TTS: No specific voice found for lang "${lang}". Using UI default voice "${selectedVoice?.name || 'System Default'}" but setting utterance.lang to "${finalLangTag}". Quality may vary.`);
      }
    } else if (selectedVoice) { // No specific lang requested, use UI default.
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
       console.log(`TTS: No specific lang requested. Using UI default voice: "${selectedVoice.name}" (lang: ${selectedVoice.lang})`);
    } else {
      // No specific lang requested, and no UI default voice selected (e.g., on initial load before voices populate)
      // Let the browser pick its default voice for the finalLangTag.
      finalLangTag = lang || 'en-US'; // Ensure finalLangTag is set
      console.log(`TTS: No specific lang or UI default voice. Using browser default for lang "${finalLangTag}".`);
    }

    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    // Adjust rate based on language
    if (finalLangTag && !finalLangTag.toLowerCase().startsWith('en-')) {
      newUtterance.rate = 1.2; // Slightly slower for non-English languages for potentially better clarity
    } else {
      newUtterance.rate = 1.5; // Faster for English (as per previous request)
    }
    newUtterance.volume = 1;

    newUtterance.onstart = () => {
      // Ensure this event belongs to the current utterance in ref
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
      if (utteranceRef.current === newUtterance) {
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        if (event.error === "interrupted") {
          console.warn("TTS: Utterance was reported as 'interrupted'. This usually means speech.cancel() was called, or a new speak() request pre-empted this one. Check for rapid speak() calls or external interruptions.");
        } else if (event.error === "audio-busy") {
          console.warn("TTS: Speech error 'audio-busy'. The audio output device is busy. Try again shortly.");
        } else if (event.error === "not-allowed") {
            console.warn("TTS: Speech was 'not-allowed'. This usually means the browser blocked it due to lack of user interaction or permissions (common for initial page load speech).");
        } else if (event.error === "language-unavailable" || event.error === "voice-unavailable") {
            console.warn(`TTS: Speech error '${event.error}'. The language or voice ("${newUtterance.voice?.name}") for lang "${newUtterance.lang}" might not be supported by the browser's TTS engine.`);
        }
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
    
    // Directly attempt to speak
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices, cancelTTS]);


  const speak = useCallback((text: string, lang?: string) => {
    // All speak calls go directly to _performSpeak as user wants immediate playback attempts
    _performSpeak(text, lang);
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

  // Function to populate the list of supported voices and set a default/preferred voice
  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0 && supportedVoices.length === 0) {
        // Voices not ready yet, or no voices available.
        // This might happen on some browsers before user interaction or if speech services are disabled.
        // console.log("TTS Debug: Voices list is empty, will try again on 'voiceschanged' event.");
        return;
      }

      // Only update state if the actual list of voices has changed to prevent unnecessary re-renders.
      if (voices.length !== supportedVoices.length || !voices.every((v, i) => v.voiceURI === supportedVoices[i]?.voiceURI)) {
        // console.log(`TTS Debug: Voices list updated. Found ${voices.length} voices.`);
        setSupportedVoices(voices);
      }
    }
  }, [supportedVoices]); // Only depends on supportedVoices to compare for actual changes

  // Effect to initially populate voices and listen for changes
  useEffect(() => {
    populateVoiceList(); // Initial attempt to get voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', populateVoiceList);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', populateVoiceList);
        cancelTTS(); // Cleanup: cancel any ongoing speech when the component unmounts
      }
       // Also reset states on unmount for cleaner re-mounts if hook instance changes.
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
  }, [populateVoiceList, cancelTTS]);


  // Logic to select a default/preferred voice for UI announcements
  const updateSelectedVoiceLogic = useCallback(() => {
    if (supportedVoices.length === 0) {
      setSelectedVoice(null);
      return;
    }

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // Primarily for English UI announcements
    const enUSLangPrefix = 'en-US';

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel', 'google español de estados unidos', 'google male', 'microsoft guy', 'en-gb-male', 'microsoft mark', 'tom'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda', 'google français', 'microsoft eva', 'google female', 'microsoft catherine', 'en-gb-female', 'microsoft hazel', 'linda', 'heera'];


    if (voicePreference === 'kai') { // User prefers "Kai" (typically male, US English)
        preferredVoiceForUI = supportedVoices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           supportedVoices.find(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix)));
    } else if (voicePreference === 'luma' || voicePreference === 'zia') { // User prefers "Luma" or "Zia" (typically female, US English)
        const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
        const secondaryNameMatch = voicePreference === 'luma' ? 'zia' : 'luma'; // Fallback to the other female preference
        preferredVoiceForUI = supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(enUSLangPrefix))) ||
                           supportedVoices.find(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.startsWith(currentLangPrefix)) || femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw) && voice.lang.includes('en'))) ||
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) || // Try secondary preference
                           supportedVoices.find(voice => voice.name.toLowerCase().includes(secondaryNameMatch) && voice.lang.startsWith(currentLangPrefix));
    }

    // If no preference-matched voice is found, fall back to system defaults for English.
    if (!preferredVoiceForUI) {
        preferredVoiceForUI = supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) ||
                           supportedVoices.find(v => v.lang.startsWith(enUSLangPrefix)) ||
                           supportedVoices.find(v => v.lang.startsWith(currentLangPrefix)) ||
                           supportedVoices.find(v => v.default) || // Absolute system default
                           (supportedVoices.length > 0 ? supportedVoices[0] : undefined); // First available voice
    }
    
    // Only update selectedVoice state if it's actually different to avoid re-renders
    setSelectedVoice(currentVal => {
      if (preferredVoiceForUI && (!currentVal || currentVal.voiceURI !== preferredVoiceForUI.voiceURI)) {
        // console.log(`TTS Debug: Setting selectedVoice to: ${preferredVoiceForUI.name} (URI: ${preferredVoiceForUI.voiceURI}) based on preference: ${voicePreference}`);
        return preferredVoiceForUI;
      }
      if (!preferredVoiceForUI && currentVal !== null) {
        // console.log(`TTS Debug: Setting selectedVoice to null as no preferred voice found.`);
        return null;
      }
      return currentVal; // No change needed
    });
  }, [supportedVoices, voicePreference]);

  // Effect to update the selected voice when the list of supported voices or user preference changes.
  useEffect(() => {
    updateSelectedVoiceLogic();
  }, [supportedVoices, voicePreference, updateSelectedVoiceLogic]);


  // Callback for components to set their voice preference (e.g., "Zia", "Kai")
  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    // Only update if the preference actually changes to prevent unnecessary re-renders.
    setVoicePreference(oldPreference => {
      if (oldPreference !== preference) {
        // console.log(`TTS Debug: Voice preference changed from "${oldPreference}" to "${preference}". Triggering selected voice update.`);
        return preference;
      }
      return oldPreference;
    });
  }, []); // No dependencies, setVoicePreference from useState is stable
  
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
            // console.log(`TTS Debug: setSelectedVoiceURI called. Setting voice to: ${voice.name}`);
            return voice;
          }
          if (!voice && currentSelected !== null) {
            // console.log(`TTS Debug: setSelectedVoiceURI called with unknown URI. Setting voice to null.`);
            return null;
          }
          return currentSelected; // No change
        });
      }, [supportedVoices]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
