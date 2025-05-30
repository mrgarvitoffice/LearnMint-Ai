
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
        const currentLangPrefix = selectedVoice?.lang.split('-')[0] || 'en';

        if (voicePreference === 'zia') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        }
        if (!preferredVoice && voicePreference === 'kai') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
        }

        // General female preference if Zia not found or not preferred OR if preference is just 'female'
        if (!preferredVoice && (voicePreference === 'female' || voicePreference === 'zia')) {
          // Prioritize US English female voices if available
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en-US'));
          // If no US female, try any English female (excluding UK one if possible)
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en') && !voice.name.toLowerCase().includes('google uk english female'));
          }
          // Removed the explicit fallback to *any* English female voice here to avoid selecting "Google UK English Female" if it's the only one.
          // It will now fall through to broader non-gender-specific English fallbacks if the above conditions aren't met.
        }
        // General male preference if Kai not found or not preferred OR if preference is just 'male'
        if (!preferredVoice && (voicePreference === 'male' || voicePreference === 'kai')) {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en-US'));
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en'));
          }
        }

        // Broader fallbacks if still no preference match
        if (!preferredVoice && voicePreference) {
            if (voicePreference === 'zia' || voicePreference === 'female') {
                preferredVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('google uk english female'));
                 if (!preferredVoice) { // If still no match, try any US female
                    preferredVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.toLowerCase().includes('female'));
                }
            } else if (voicePreference === 'kai' || voicePreference === 'male') {
                preferredVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.toLowerCase().includes('male'));
            }
        }

        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en-US') && !v.name.toLowerCase().includes('google uk english female'));
        }
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en-US'));
        }
        if (!preferredVoice) {
             preferredVoice = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('google uk english female'));
        }
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en'));
        }
        
        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        } else if (voices.length > 0) {
          setSelectedVoice(voices[0]); // Absolute fallback to the first available voice
        }
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
      setIsPaused(false); // Reset pause state

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
      utterance.onpause = () => {
        // This is for browser-initiated pauses, our state should align
        setIsSpeaking(false);
        setIsPaused(true);
      };
       utterance.onresume = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.speak(utterance);
        }
      }, 50);
    }
  }, [selectedVoice]);

  const pauseTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
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
      const voiceNameLower = voice.name.toLowerCase();
      if (voiceNameLower.includes('zia')) setVoicePreference('zia');
      else if (voiceNameLower.includes('kai')) setVoicePreference('kai');
      else if (voiceNameLower.includes('female')) setVoicePreference('female');
      else if (voiceNameLower.includes('male')) setVoicePreference('male');
      else setVoicePreference(null);
    }
  }, [supportedVoices]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference, voicePreference };
}
