"use client";

import { useState, useEffect, useCallback } from 'react';

interface VoiceRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  browserSupportsSpeechRecognition: boolean;
}

export function useVoiceRecognition(): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setBrowserSupportsSpeechRecognition(true);
        const newRecognition = new SpeechRecognition();
        newRecognition.continuous = false;
        newRecognition.interimResults = true;
        newRecognition.lang = 'en-US';

        newRecognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscript || interimTranscript);
          if (finalTranscript) {
             // Automatically stop listening when a final result is received
            // This behavior might need adjustment based on desired UX
            stopListeningInternal(newRecognition);
          }
        };

        newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          setError(event.error);
          console.error('Speech recognition error:', event.error);
          stopListeningInternal(newRecognition);
        };
        
        newRecognition.onend = () => {
          setIsListening(false);
        };

        setRecognition(newRecognition);
      } else {
        setBrowserSupportsSpeechRecognition(false);
        setError("Speech recognition not supported in this browser.");
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        setTranscript('');
        setError(null);
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
        setError("Failed to start listening. It might be already active or an issue with permissions.");
        setIsListening(false);
      }
    }
  }, [recognition, isListening]);

  const stopListeningInternal = (currentRecognition: SpeechRecognition | null) => {
    if (currentRecognition && isListening) {
      currentRecognition.stop();
      setIsListening(false);
    }
  };
  
  const stopListening = useCallback(() => {
    stopListeningInternal(recognition);
  }, [recognition, isListening]);


  return { isListening, transcript, startListening, stopListening, error, browserSupportsSpeechRecognition };
}
