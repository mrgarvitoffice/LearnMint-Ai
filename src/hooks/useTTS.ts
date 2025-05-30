
"use client";

import { useState, useEffect, useCallback } from 'react';

interface TTSHook {
  speak: (text: string) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void;
  setVoicePreference: (preference: 'male' | 'female' | 'kai' | 'zia' | null) => void;
  voicePreference: 'male' | 'female' | 'kai' | 'zia' | null; // Expose current preference
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
        const currentLang = selectedVoice?.lang || 'en'; // Use current lang or default to English for preference matching

        // Prioritize specific names if preference is set
        if (voicePreference === 'zia') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLang.split('-')[0]));
        }
        if (!preferredVoice && voicePreference === 'kai') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLang.split('-')[0]));
        }

        // General female preference if Zia not found or not preferred
        if (!preferredVoice && (voicePreference === 'female' || voicePreference === 'zia')) {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith(currentLang.split('-')[0]));
        }
        // General male preference if Kai not found or not preferred
        if (!preferredVoice && (voicePreference === 'male' || voicePreference === 'kai')) {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith(currentLang.split('-')[0]));
        }

        // Broader fallbacks if specific names or general preferences aren't found
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en-US') && (voicePreference === 'female' || voicePreference === 'zia' ? v.name.toLowerCase().includes('female') : true) && (voicePreference === 'male' || voicePreference === 'kai' ? v.name.toLowerCase().includes('male') : true) );
        }
        if (!preferredVoice) {
             preferredVoice = voices.find(v => v.lang.startsWith('en') && (voicePreference === 'female' || voicePreference === 'zia' ? v.name.toLowerCase().includes('female') : true) && (voicePreference === 'male' || voicePreference === 'kai' ? v.name.toLowerCase().includes('male') : true) );
        }
        if (!preferredVoice) { // If still no preference match, try any English voice
            preferredVoice = voices.find(v => v.lang.startsWith('en'));
        }
        
        setSelectedVoice(preferredVoice || voices[0]);
      }
    }
  }, [voicePreference, selectedVoice?.lang]);

  useEffect(() => {
    populateVoiceList();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [populateVoiceList]);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      window.speechSynthesis.cancel(); // Cancel any ongoing or queued speech first
      setIsSpeaking(false); // Reset states
      setIsPaused(false);

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
      utterance.onpause = () => { // Though we don't expose browser's onpause directly
        setIsSpeaking(false);
        setIsPaused(true);
      };
       utterance.onresume = () => { // Though we don't expose browser's onresume directly
        setIsSpeaking(true);
        setIsPaused(false);
      };


      // Adding a small delay can sometimes help prevent "interrupted" errors on some browsers
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.speak(utterance);
        }
      }, 50);
    }
  }, [selectedVoice, setIsSpeaking, setIsPaused]);

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false); // Speech is paused, so not actively 'speaking'
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true); // Speech resumes, so actively 'speaking'
    }
  }, [isPaused]);

  const cancelTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [setIsSpeaking, setIsPaused]);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    const voice = supportedVoices.find(v => v.voiceURI === uri);
    if (voice) {
      setSelectedVoice(voice);
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
