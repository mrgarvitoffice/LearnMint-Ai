
"use client"; // This hook is client-side only due to browser's SpeechSynthesis API.

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @interface TTSHook
 * Defines the return type of the useTTS hook.
 */
interface TTSHook {
  speak: (text: string) => void;                     // Function to initiate speech.
  pauseTTS: () => void;                               // Function to pause ongoing speech.
  resumeTTS: () => void;                              // Function to resume paused speech.
  cancelTTS: () => void;                              // Function to stop and clear speech.
  isSpeaking: boolean;                                // True if speech is currently active (speaking or paused).
  isPaused: boolean;                                  // True if speech is paused.
  supportedVoices: SpeechSynthesisVoice[];            // Array of available voices in the browser.
  selectedVoice: SpeechSynthesisVoice | null;         // The currently selected voice object.
  setSelectedVoiceURI: (uri: string) => void;         // Function to select a voice by its URI.
  setVoicePreference: (preference: 'zia' | 'kai' | null) => void; // Function to set a preferred voice type (e.g., 'zia' for female-like, 'kai' for male-like).
  voicePreference: 'zia' | 'kai' | null;              // The current voice preference ('zia', 'kai', or null).
}

/**
 * `useTTS` Hook
 * 
 * A custom React hook for Text-To-Speech (TTS) functionality using the browser's SpeechSynthesis API.
 * It manages speech state (speaking, paused), voice selection, and provides controls for speech playback.
 * Includes logic to prefer specific voices like "Zia" (female-like) or "Kai" (male-like) if available.
 */
export function useTTS(): TTSHook {
  // State variables to manage TTS status
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  // Voice preference ('zia' implies female-like, 'kai' implies male-like, null for default browser behavior)
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | null>(null);
  // Ref to store the current SpeechSynthesisUtterance instance
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * `populateVoiceList`
   * 
   * Fetches the list of available speech synthesis voices from the browser
   * and attempts to select a voice based on the current `voicePreference`.
   * This function is called initially and whenever `onvoiceschanged` event fires.
   */
  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.log("TTS: No voices available yet. Waiting for onvoiceschanged.");
      // Ensure onvoiceschanged listener is attached if voices are initially empty
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = () => populateVoiceList();
      }
      return;
    }

    setSupportedVoices(voices); // Store all available voices
    console.log("TTS: populateVoiceList triggered. Current preference:", voicePreference);
    // console.log("TTS: Available voices in browser:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default, URI: v.voiceURI.substring(0,40) }))); // For debugging

    let preferredVoice: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en'; // Target English voices
    const enUSLangPrefix = 'en-US'; // Specifically target US English voices

    // Logic to select a voice based on the 'zia' (female-like) preference
    if (voicePreference === 'zia') {
      console.log("TTS: Attempting to select 'zia' (female-implied) preference.");
      // Priority:
      // 1. Exact "Zia" name match (en-US preferred, then any 'en')
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
      // 2. Explicit "female" in voice name (en-US preferred)
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && voice.name.toLowerCase().includes('female'));
      // 3. Explicit "female" in other English variants (excluding known non-preferred ones if better options exist)
      if (!preferredVoice) {
        const otherEnglishFemaleVoices = voices.filter(voice => 
            voice.lang.startsWith(currentLangPrefix) && 
            voice.name.toLowerCase().includes('female') &&
            !voice.name.toLowerCase().includes('google uk english female') // Example of filtering out a less preferred voice
        );
        if (otherEnglishFemaleVoices.length > 0) preferredVoice = otherEnglishFemaleVoices.find(v => !/david|mark|kai|male/i.test(v.name)) || otherEnglishFemaleVoices[0];
        else preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('female'));
      }
      // 4. Any en-US voice not explicitly named as male
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && !/david|mark|kai|male|google uk english male/i.test(v.name.toLowerCase()));
      // 5. Any en-* voice not explicitly named as male
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !/david|mark|kai|male|google uk english male/i.test(v.name.toLowerCase()));
    
    // Logic to select a voice based on the 'kai' (male-like) preference
    } else if (voicePreference === 'kai') {
      console.log("TTS: Attempting to select 'kai' (male-implied) preference.");
      // Priority:
      // 1. Exact "Kai" name match (en-US preferred, then any 'en')
      preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(enUSLangPrefix)) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
      // 2. Explicit "male" in voice name (en-US preferred)
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && voice.name.toLowerCase().includes('male'));
      // 3. Common male names like "David" or "Mark" (often MS voices)
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(enUSLangPrefix) && (voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('mark')));
      // 4. Explicit "male" in other English variants
      if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith(currentLangPrefix) && voice.name.toLowerCase().includes('male'));
      // 5. Any en-US voice not explicitly named as female
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && !/zia|luma|female|google uk english female/i.test(v.name.toLowerCase()));
      // 6. Any en-* voice not explicitly named as female
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && !/zia|luma|female|google uk english female/i.test(v.name.toLowerCase()));
    }

    // General fallbacks if no preference match or preference not set
    if (!preferredVoice) {
      console.log("TTS: No specific preference/gender match, trying general English fallbacks.");
      const defaultEnUSVoice = voices.find(v => v.lang.startsWith(enUSLangPrefix) && v.default);
      if (defaultEnUSVoice) preferredVoice = defaultEnUSVoice;
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && v.default);
      if (!preferredVoice) {
        const usVoices = voices.filter(v => v.lang.startsWith(enUSLangPrefix));
        if (usVoices.length > 0) preferredVoice = usVoices[0];
      }
      if (!preferredVoice) {
         const otherEnVoices = voices.filter(v => v.lang.startsWith(currentLangPrefix));
         if (otherEnVoices.length > 0) preferredVoice = otherEnVoices[0];
      }
    }
    
    // Last resort: system default or first available voice
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices.find(v => v.default) || voices[0]; 
    }
    
    // Set the selected voice if a suitable one was found and it's different from the current
    if (preferredVoice) {
      if (!selectedVoice || selectedVoice.voiceURI !== preferredVoice.voiceURI) {
        console.log("TTS: Setting selected voice to:", preferredVoice.name, "| Lang:", preferredVoice.lang);
        setSelectedVoice(preferredVoice);
      }
    } else {
      console.warn("TTS: No suitable voice found after all checks.");
      if (selectedVoice !== null) setSelectedVoice(null); 
    }

  }, [voicePreference, selectedVoice, setSelectedVoice, setSupportedVoices]); // Dependencies for useCallback

  // Effect to initialize voice list and set up 'onvoiceschanged' listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      populateVoiceList(); // Initial attempt to populate voices
      window.speechSynthesis.onvoiceschanged = populateVoiceList; // Event listener for when voices become available/change
    }
    // Cleanup function for when the component unmounts
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null; // Remove listener
        if (utteranceRef.current && window.speechSynthesis.speaking) {
          console.log("TTS: Component unmounting, cancelling speech.");
          window.speechSynthesis.cancel(); // Cancel any ongoing speech
        }
      }
    };
  }, [populateVoiceList]); // Rerun if populateVoiceList changes (due to its dependencies)

  /**
   * `speak`
   * 
   * Initiates speech synthesis for the given text.
   * Cancels any ongoing speech before starting a new one.
   * Uses the `selectedVoice` if available.
   * @param text - The string to be spoken.
   */
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && text.trim() !== "") {
      console.log("TTS: Speak called for:", `"${text.substring(0, 30)}..."`, "With selected voice:", selectedVoice?.name || "Browser Default");
      
      window.speechSynthesis.cancel(); // Always cancel previous speech
      setIsSpeaking(false); 
      setIsPaused(false);   

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance; // Store current utterance instance

      if (selectedVoice) {
        utterance.voice = selectedVoice; // Apply selected voice
      }
      
      // Event handlers for the utterance
      utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('TTS: Speech synthesis error:', event.error);
        if(event.error === 'not-allowed') console.warn("TTS: Speech was blocked by the browser. User interaction might be required.");
        setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null;
      };
      utterance.onpause = () => { setIsPaused(true); setIsSpeaking(true); };
      utterance.onresume = () => { setIsPaused(false); setIsSpeaking(true);};
      
      // Small delay to ensure `cancel` has processed before `speak`
      setTimeout(() => {
        // Check if this utterance is still the one we intend to speak
        if (typeof window !== 'undefined' && window.speechSynthesis && utteranceRef.current === utterance) { 
           window.speechSynthesis.speak(utterance);
        } else if (utteranceRef.current !== utterance) {
            console.log("TTS: Speak call aborted due to new utterance queued.");
        }
      }, 50); 
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused]); // Dependencies for speak callback

  /**
   * `pauseTTS`
   * Pauses the currently speaking utterance.
   */
  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking, isPaused]);

  /**
   * `resumeTTS`
   * Resumes a paused utterance.
   */
  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) { 
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

  /**
   * `cancelTTS`
   * Stops any ongoing or paused speech and clears the queue.
   */
  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, [setIsSpeaking, setIsPaused]);

  /**
   * `handleSetVoicePreference`
   * Callback to set the user's voice preference ('zia', 'kai', or null).
   * This will trigger `populateVoiceList` to re-evaluate the best voice.
   */
  const handleSetVoicePreference = useCallback((preference: 'zia' | 'kai' | null) => {
    setVoicePreference(preference);
  }, [setVoicePreference]);

  // Effect to re-populate/re-select voice when preference changes and voices are already loaded
  useEffect(() => {
    if(supportedVoices.length > 0){ // Only if voices have been loaded once
        populateVoiceList();
    }
  }, [voicePreference, supportedVoices.length, populateVoiceList]); // Rerun if preference or voices change

  // Return the hook's API
  return { 
    speak, 
    pauseTTS, 
    resumeTTS, 
    cancelTTS, 
    isSpeaking, 
    isPaused, 
    supportedVoices, 
    selectedVoice, 
    // Allows setting voice directly by URI if needed, though preference is the primary way
    setSelectedVoiceURI: useCallback((uri: string) => { 
        const voice = supportedVoices.find(v => v.voiceURI === uri);
        if (voice) {
          if (!selectedVoice || selectedVoice.voiceURI !== voice.voiceURI) {
            setSelectedVoice(voice);
          }
        }
      }, [supportedVoices, selectedVoice, setSelectedVoice]),
    setVoicePreference: handleSetVoicePreference,
    voicePreference
  };
}
