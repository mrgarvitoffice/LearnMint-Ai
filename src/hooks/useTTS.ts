
"use client";

import { useState, useEffect, useCallback } from 'react';

interface TTSHook {
  speak: (text: string) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void; // Renamed from stopTTS for clarity
  isSpeaking: boolean;
  isPaused: boolean;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void;
  setVoicePreference: (preference: 'male' | 'female' | 'kai' | 'zia' | null) => void;
  voicePreference: 'male' | 'female' | 'kai' | 'zia' | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'male' | 'female' | 'kai' | 'zia' | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      setSupportedVoices(voices);

      if (voices.length > 0) {
        let preferredVoice: SpeechSynthesisVoice | undefined;
        const currentLangPrefix = selectedVoice?.lang.split('-')[0] || 'en'; // Prioritize current language if a voice is already selected

        if (voicePreference === 'zia') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        }
        if (!preferredVoice && voicePreference === 'kai') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
        }
        
        // General female preference if Zia not found or not preferred OR if preference is just 'female'
        if (!preferredVoice && (voicePreference === 'female' || voicePreference === 'zia')) {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en-US'));
          if (!preferredVoice) { // If no US female, try any English female *not* Google UK
            preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en') && !voice.name.toLowerCase().includes('google uk english female'));
          }
           // Removed the broader fallback to any English female to avoid Google UK English Female if other options exhausted
        }
        // General male preference if Kai not found or not preferred OR if preference is just 'male'
        if (!preferredVoice && (voicePreference === 'male' || voicePreference === 'kai')) {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en-US'));
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en'));
          }
        }

        // Broader fallbacks if still no preference match
        if (!preferredVoice) {
            // Try any US English voice, deprioritizing UK Female if possible
            preferredVoice = voices.find(v => v.lang.startsWith('en-US') && !v.name.toLowerCase().includes('google uk english female'));
            if (!preferredVoice) { // If still no match, try any US voice
                preferredVoice = voices.find(v => v.lang.startsWith('en-US'));
            }
        }
        if (!preferredVoice) {
            // Try any English voice, deprioritizing UK Female if possible
            preferredVoice = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('google uk english female'));
             if (!preferredVoice) { // If still no match, try any English voice
                preferredVoice = voices.find(v => v.lang.startsWith('en'));
            }
        }
        
        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        } else if (voices.length > 0 && !selectedVoice) { // Only set absolute fallback if no voice is selected at all
          setSelectedVoice(voices[0]); 
        }
      }
    }
  }, [voicePreference, selectedVoice?.lang]); // Added selectedVoice?.lang to re-evaluate if user changes voice and then preference

  useEffect(() => {
    populateVoiceList(); // Initial population
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel(); // Clean up any speech on unmount
      }
    };
  }, [populateVoiceList]); // populateVoiceList is stable due to its own useCallback dependencies

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      window.speechSynthesis.cancel(); // Always cancel previous before speaking new
      setIsPaused(false); // Ensure pause state is reset

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false);
        setIsPaused(false);
      };
      // These are for browser-initiated pauses/resumes, not directly used by our controls but good to align state
      utterance.onpause = () => { 
        setIsSpeaking(false); // Speech is not actively happening
        setIsPaused(true);
      };
       utterance.onresume = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      // Use a small timeout to allow the cancel to process.
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.speak(utterance);
        }
      }, 50);
    }
  }, [selectedVoice]); // Removed setIsSpeaking, setIsPaused from deps as they are managed internally

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true); // State update handled by utterance.onpause
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false); // State update handled by utterance.onresume
    }
  }, [isPaused]);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    const voice = supportedVoices.find(v => v.voiceURI === uri);
    if (voice) {
      setSelectedVoice(voice);
      // Infer preference from selected voice name
      const voiceNameLower = voice.name.toLowerCase();
      if (voiceNameLower.includes('zia')) setVoicePreference('zia');
      else if (voiceNameLower.includes('kai')) setVoicePreference('kai');
      else if (voiceNameLower.includes('female')) setVoicePreference('female');
      else if (voiceNameLower.includes('male')) setVoicePreference('male');
      else setVoicePreference(null); // Or keep current preference if no match
    }
  }, [supportedVoices]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference, voicePreference };
}
