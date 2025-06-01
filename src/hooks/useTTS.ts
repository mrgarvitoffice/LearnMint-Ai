
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
      // If voices array is empty, it might be that they haven't loaded yet.
      // 'onvoiceschanged' is the correct event to listen for.
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
      }
      return;
    }
    setSupportedVoices(voices);
    // console.log("TTS: Voices loaded:", voices.length);

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // Default to English voices for UI
    const enUSLangPrefix = 'en-US';

    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady'];

    if (voicePreference === 'kai') {
      preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) || // Generic English male
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))); // Generic English male
    } else if (voicePreference === 'luma' || voicePreference === 'zia') {
      const primaryNameMatch = voicePreference === 'luma' ? 'luma' : 'zia';
      preferredVoiceForUI = voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes(primaryNameMatch) && voice.lang.startsWith(currentLangPrefix)) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) ||
                       voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))) || // Generic English female
                       voices.find(voice => voice.lang.startsWith(currentLangPrefix) && !maleKeywords.some(kw => voice.name.toLowerCase().includes(kw))); // Generic English female
    }

    // Fallback if preference-based search fails
    if (!preferredVoiceForUI) {
      preferredVoiceForUI = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default) || // Default US English
                       voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default) || // Default any English
                       voices.find(v => v.lang.startsWith(enUSLangPrefix)) ||                // Any US English
                       voices.find(v => v.lang.startsWith(currentLangPrefix)) ||                // Any English
                       voices.find(v => v.default) ||                                       // Any default voice
                       (voices.length > 0 ? voices[0] : undefined);                         // First available voice
    }

    if (preferredVoiceForUI) {
      // console.log(`TTS: UI Preferred voice selected: ${preferredVoiceForUI.name} (${preferredVoiceForUI.lang}) based on preference: ${voicePreference || 'none'}`);
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoiceForUI.voiceURI) {
        setSelectedVoice(preferredVoiceForUI);
      }
    } else {
      // console.warn("TTS: No suitable UI voice found after checks.");
      if (selectedVoice !== null) {
        setSelectedVoice(null);
      }
    }
  }, [voicePreference, selectedVoice]); // Added selectedVoice to dependencies of populateVoiceList

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Initial population attempt
      populateVoiceList();
      // Set up the event listener for when voices change
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel(); // Cancel any speech on unmount
        }
      }
    };
  }, [populateVoiceList]); // populateVoiceList is memoized


  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      // console.log("TTS: Speak called with no text or synth not available.");
      return;
    }

    // Critical: Stop any current speech. This is the primary defense against "interrupted" errors
    // if speak is called rapidly or while another utterance is in progress.
    window.speechSynthesis.cancel();
    // Reset state immediately. The new utterance's onstart will set them again.
    setIsSpeaking(false);
    setIsPaused(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Store for potential debugging or direct access if needed.

    let voiceToUse: SpeechSynthesisVoice | null = null;

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0]; // e.g., "hi" from "hi-IN"
      // Try to find a voice that matches the specific language tag or base language
      voiceToUse = supportedVoices.find(v => v.lang === lang) ||
                   supportedVoices.find(v => v.lang.startsWith(langBase + "-")) || // Match "hi-IN", "hi-US" etc. if base is "hi"
                   supportedVoices.find(v => v.lang === langBase); // Match just "hi"

      if (voiceToUse) {
        utterance.voice = voiceToUse;
        utterance.lang = voiceToUse.lang; // Use the voice's declared language
        // console.log(`TTS: Found language-specific voice for "${lang}": ${voiceToUse.name} (${voiceToUse.lang})`);
      } else {
        // No specific voice found, but set the lang hint for the browser.
        utterance.lang = lang;
        // console.warn(`TTS: No specific voice found for requested language "${lang}". Browser will attempt to use its default for this language.`);
      }
    } else if (selectedVoice) {
      // Use the general UI preferred voice if no specific language requested or no specific language voice found
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      // console.log(`TTS: Using general selected UI voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
      // Absolute fallback: no specific lang requested, and no UI preference voice set.
      // Set a default lang hint for the browser.
      utterance.lang = lang || 'en-US';
      // console.warn(`TTS: No specific voice found and no UI preference. Browser will use its default. Lang hint: ${utterance.lang}`);
    }

    utterance.onstart = () => {
      // console.log(`TTS: Speech started. Text: "${text.substring(0,30)}...", Voice: ${utterance.voice?.name || 'Browser Default'}, Lang: ${utterance.lang}`);
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      // console.log(`TTS: Speech ended. Text: "${text.substring(0,30)}..."`);
      // Only update state if this is still the current utterance
      if (utteranceRef.current === utterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,30)}..."`, `Voice: ${utterance.voice?.name || 'Browser Default'}`, `Lang: ${utterance.lang}`);
      if (event.error === "interrupted") {
        console.warn("TTS: Utterance was reported as 'interrupted'. This might be due to a new speak command being issued, navigation, or other browser behavior. The cancel() at the start of speak() should mitigate most self-interruptions.");
      }
      // Only update state if this is still the current utterance
      if (utteranceRef.current === utterance) {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      }
    };

    utterance.onpause = () => {
      // console.log(`TTS: Speech paused. Text: "${text.substring(0,30)}..."`);
      setIsPaused(true); // isSpeaking remains true while paused
    };

    utterance.onresume = () => {
      // console.log(`TTS: Speech resumed. Text: "${text.substring(0,30)}..."`);
      setIsPaused(false); // isSpeaking remains true
    };

    // Speak directly. The cancel() at the start should have cleared the way.
    window.speechSynthesis.speak(utterance);

  }, [selectedVoice, supportedVoices]);

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
      // console.log("TTS: cancelTTS called.");
      window.speechSynthesis.cancel(); // This will trigger onend or onerror for the current utterance
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null; // Clear the ref as the utterance is no longer relevant
    }
  }, []); // Dependencies should be empty as setIsSpeaking/setIsPaused are stable

  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | 'luma' | null) => {
    setVoicePreference(preference);
  }, []); // setVoicePreference from useState is stable

  // This effect re-runs populateVoiceList if the voicePreference changes,
  // ensuring the selectedVoice (for UI) updates accordingly.
  useEffect(() => {
    if(supportedVoices.length > 0){ // Only run if voices are already loaded
        populateVoiceList();
    }
  }, [voicePreference, supportedVoices.length, populateVoiceList]); // Added populateVoiceList

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
