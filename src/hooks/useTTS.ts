
"use client";

import { useState, useEffect, useCallback } from 'react';

interface TTSHook {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void;
  setVoicePreference: (preference: 'male' | 'female' | 'kai' | 'zia' | null) => void;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePreference, setVoicePreference] = useState<'male' | 'female' | 'kai' | 'zia' | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      setSupportedVoices(voices);
      
      if (voices.length > 0) {
        let preferredVoice: SpeechSynthesisVoice | undefined;

        if (voicePreference === 'kai') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('kai'));
        } else if (voicePreference === 'zia') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('zia'));
        }
        
        if (!preferredVoice && voicePreference === 'male') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en'));
        } else if (!preferredVoice && voicePreference === 'female') {
          preferredVoice = voices.find(voice => voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en'));
        }
        
        // Fallback if specific names or general preferences aren't found
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.toLowerCase().includes('female'));
        }
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
        }
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en-US'));
        }
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en'));
        }
        
        setSelectedVoice(preferredVoice || voices[0]);
      }
    }
  }, [voicePreference]);

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
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error, '| Utterance text:', `"${utterance.text.substring(0, 50)}..."`, '| Selected voice:', utterance.voice?.name || 'Default');
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedVoice, setIsSpeaking]); // setIsSpeaking is stable

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false); // Immediately update our state
    }
  }, [setIsSpeaking]); // setIsSpeaking is stable

  const setSelectedVoiceURI = useCallback((uri: string) => {
    const voice = supportedVoices.find(v => v.voiceURI === uri);
    if (voice) {
      setSelectedVoice(voice);
      if (voice.name.toLowerCase().includes('kai')) setVoicePreference('kai');
      else if (voice.name.toLowerCase().includes('zia')) setVoicePreference('zia');
      else if (voice.name.toLowerCase().includes('male')) setVoicePreference('male');
      else if (voice.name.toLowerCase().includes('female')) setVoicePreference('female');
      else setVoicePreference(null);
    }
  }, [supportedVoices]);

  return { speak, cancel, isSpeaking, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference };
}
