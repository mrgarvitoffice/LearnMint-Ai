
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
 * Includes handling for browser autoplay policies by queuing initial speech until user interaction.
 */
export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'zia' | 'kai' | 'luma' | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [queuedInitialSpeech, setQueuedInitialSpeech] = useState<{ text: string, lang?: string } | null>(null);
  const initialSpeechQueuedRef = useRef(false); // Tracks if an initial speech has ALREADY been queued

  // Effect to detect first user interaction
  useEffect(() => {
    const markInteraction = () => {
      setUserHasInteracted(true);
      window.removeEventListener('click', markInteraction, { capture: true, once: true });
      window.removeEventListener('keydown', markInteraction, { capture: true, once: true });
      window.removeEventListener('touchstart', markInteraction, { capture: true, once: true });
    };

    // Add event listeners only if interaction hasn't happened yet
    if (!userHasInteracted) {
      window.addEventListener('click', markInteraction, { capture: true, once: true });
      window.addEventListener('keydown', markInteraction, { capture: true, once: true });
      window.addEventListener('touchstart', markInteraction, { capture: true, once: true });
    }

    return () => {
      // Clean up listeners if component unmounts before interaction
      window.removeEventListener('click', markInteraction, { capture: true, once: true });
      window.removeEventListener('keydown', markInteraction, { capture: true, once: true });
      window.removeEventListener('touchstart', markInteraction, { capture: true, once: true });
    };
  }, [userHasInteracted]);


  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("TTS: Speech synthesis not supported or window not available.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      if ('onvoiceschanged' in window.speechSynthesis && window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
      } else if (!('onvoiceschanged' in window.speechSynthesis)) {
        // console.warn("TTS: No voices found and onvoiceschanged event not supported.");
      }
      return;
    }
    setSupportedVoices(voices);

    let preferredVoiceForUI: SpeechSynthesisVoice | undefined;
    const currentLangPrefix = 'en';
    const enUSLangPrefix = 'en-US';
    const maleKeywords = ['male', 'david', 'mark', 'kai', 'guy', 'man', 'boy', 'google us english', 'microsoft david', 'alex', 'arthur', 'daniel'];
    const femaleKeywords = ['female', 'zia', 'luma', 'zira', 'eva', 'girl', 'woman', 'lady', 'samantha', 'google uk english female', 'microsoft zira', 'serena', 'susan', 'heather', 'ayanda'];
    
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
    };
  }, [populateVoiceList]);

  const _performSpeak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // Robustly cancel previous speech and clean up its event handlers
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onpause = null;
      utteranceRef.current.onresume = null;
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
    }
    
    // Reset state for the new utterance
    utteranceRef.current = null; 
    setIsSpeaking(false); // Will be set to true by onstart
    setIsPaused(false);

    const newUtterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = newUtterance; // Assign new utterance to ref

    let voiceToUse: SpeechSynthesisVoice | null = null;
    let finalLangTag = lang || selectedVoice?.lang || 'en-US';

    if (lang && supportedVoices.length > 0) {
      const langBase = lang.split('-')[0].toLowerCase();
      const langFull = lang.toLowerCase();
      voiceToUse = supportedVoices.find(v => v.lang.toLowerCase() === langFull) ||
                   supportedVoices.find(v => v.lang.toLowerCase().startsWith(langBase + "-")) ||
                   supportedVoices.find(v => v.lang.toLowerCase() === langBase);
      if (voiceToUse) {
        newUtterance.voice = voiceToUse;
        finalLangTag = voiceToUse.lang;
      } else {
        if (selectedVoice) newUtterance.voice = selectedVoice;
        console.warn(`TTS: No specific voice found for requested language "${lang}". Using UI preferred/default for lang tag "${finalLangTag}".`);
      }
    } else if (selectedVoice) {
      newUtterance.voice = selectedVoice;
      finalLangTag = selectedVoice.lang;
    }
    newUtterance.lang = finalLangTag;
    newUtterance.pitch = 1;
    newUtterance.rate = 1.5;
    newUtterance.volume = 1;

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
      if (utteranceRef.current === newUtterance || !utteranceRef.current) { // Also handle if ref was cleared
        console.error(`TTS: Speech synthesis error: "${event.error}"`, "Details:", event, `Text: "${text.substring(0,50)}..."`, `Voice: ${newUtterance.voice?.name || 'Browser Default'}`, `Lang: ${newUtterance.lang}`);
        if (event.error === "not-allowed") {
            console.warn("TTS: Speech was 'not-allowed'. This usually means the browser blocked it due to lack of user interaction or permissions. Queuing might be needed for initial auto-play.");
        } else if (event.error === "interrupted") {
           console.warn("TTS: Utterance was reported as 'interrupted'. This usually means speech.cancel() was called, or a new speak() request pre-empted this one.");
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
    
    window.speechSynthesis.speak(newUtterance);

  }, [selectedVoice, supportedVoices]);


  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || text.trim() === "") {
      return;
    }

    // If user hasn't interacted and no initial speech has been queued yet
    if (!userHasInteracted && !initialSpeechQueuedRef.current) {
      setQueuedInitialSpeech({ text, lang });
      initialSpeechQueuedRef.current = true; // Mark that we've queued (or attempted to queue) an initial speech
      console.log("TTS: User has not interacted. Queuing initial speech.");
      return;
    }
    _performSpeak(text, lang);
  }, [userHasInteracted, _performSpeak]);

  // Effect to play queued speech once user interacts
  useEffect(() => {
    if (userHasInteracted && queuedInitialSpeech) {
      console.log("TTS: User has interacted. Speaking queued initial speech.");
      _performSpeak(queuedInitialSpeech.text, queuedInitialSpeech.lang);
      setQueuedInitialSpeech(null); // Clear the queue
    }
  }, [userHasInteracted, queuedInitialSpeech, _performSpeak]);

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
      setQueuedInitialSpeech(null); // Also clear any queued speech on cancel
      initialSpeechQueuedRef.current = false; // Reset for next potential automatic speech if page reloads/app logic dictates
    }
  }, []);

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
