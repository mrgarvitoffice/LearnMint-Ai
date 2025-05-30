
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
        const currentLangPrefix = selectedVoice?.lang.split('-')[0] || 'en'; // Prioritize current language

        // Determine target gender from preference
        const isFemalePreference = voicePreference === 'female' || voicePreference === 'zia';
        const isMalePreference = voicePreference === 'male' || voicePreference === 'kai';

        // 1. Try specific names if preference is set
        if (voicePreference === 'zia') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia') && voice.lang.startsWith(currentLangPrefix));
        }
        if (!preferredVoice && voicePreference === 'kai') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai') && voice.lang.startsWith(currentLangPrefix));
        }

        // 2. If specific name not found, try general gender preference
        if (!preferredVoice && isFemalePreference) {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en-US'));
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en') && !voice.name.toLowerCase().includes('google uk english female'));
          }
          if (!preferredVoice) { // Last resort for any English female if others failed
            preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en'));
          }
        }

        if (!preferredVoice && isMalePreference) {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en-US'));
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en'));
          }
        }
        
        // 3. If still no voice, and a gender preference was set, try broader language fallbacks WHILE respecting gender
        if (!preferredVoice && (isFemalePreference || isMalePreference)) {
            const targetLang = 'en-US';
            const broaderLang = 'en';
            const genderKeyword = isFemalePreference ? 'female' : 'male';

            preferredVoice = voices.find(v => v.lang.startsWith(targetLang) && v.name.toLowerCase().includes(genderKeyword));
            if (!preferredVoice && isFemalePreference) { // Special deprioritization for Google UK Female
                 preferredVoice = voices.find(v => v.lang.startsWith(broaderLang) && v.name.toLowerCase().includes(genderKeyword) && !v.name.toLowerCase().includes('google uk english female'));
            } else if (!preferredVoice && isMalePreference) {
                 preferredVoice = voices.find(v => v.lang.startsWith(broaderLang) && v.name.toLowerCase().includes(genderKeyword));
            }
            // If still no match after specific language+gender, try any language+gender
            if (!preferredVoice) {
                preferredVoice = voices.find(v => v.name.toLowerCase().includes(genderKeyword));
            }
        }

        // 4. Absolute fallbacks if no voice preference or if all gendered searches fail
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
        } else if (voices.length > 0 && !selectedVoice) { 
          setSelectedVoice(voices[0]); 
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicePreference]); // Removed selectedVoice?.lang to avoid potential loops; preference should drive this.

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
      window.speechSynthesis.cancel(); 
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
      utterance.onpause = () => { 
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
      // isPaused state will be set by utterance.onpause
    }
  }, [isSpeaking, isPaused]);

  const resumeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      // isPaused and isSpeaking states will be set by utterance.onresume
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
      // Do NOT set voicePreference here. Let the main preference dropdown control that.
    }
  }, [supportedVoices]);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference, voicePreference };
}
