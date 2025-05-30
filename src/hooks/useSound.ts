
"use client";

import { useCallback, useEffect, useState, useRef } from 'react';

export function useSound(soundPathOrType: string, defaultVolume: number = 0.5) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (soundPathOrType.startsWith('/')) { // File-based sound
        const newAudio = new Audio(soundPathOrType);
        newAudio.volume = defaultVolume;
        setAudioElement(newAudio);
      } else if (!audioContextRef.current && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
        // For Web Audio API sounds, initialize AudioContext once
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    }

    // Cleanup AudioContext when the component unmounts or soundPathOrType changes
    // such that it's no longer a Web Audio API type sound.
    const currentAudioContext = audioContextRef.current;
    return () => {
      if (currentAudioContext && currentAudioContext.state !== 'closed' && !soundPathOrType.startsWith('/')) {
        // Consider if closing is always desired or if context can be reused.
        // For simplicity here, let's assume it's fine.
        // If context is shared across multiple useSound instances, this might be problematic.
        // currentAudioContext.close(); 
        // audioContextRef.current = null;
      }
    };
  }, [soundPathOrType, defaultVolume]);

  const playSound = useCallback(() => {
    if (!isSoundEnabled) {
      console.log(`Sound disabled, not playing: ${soundPathOrType}`);
      return;
    }

    const audioCtx = audioContextRef.current;

    if (audioCtx && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
      // Play Web Audio API sound
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(defaultVolume * 0.5, audioCtx.currentTime); // Reduce volume for generated tones

      if (soundPathOrType === 'correct') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5 note
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else if (soundPathOrType === 'incorrect') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4 note
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.4);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.4);
      }
    } else if (audioElement && soundPathOrType.startsWith('/')) {
      // Play file-based sound
      console.log(`Attempting to play file sound: ${soundPathOrType}`);
      audioElement.currentTime = 0;
      audioElement.play().catch(error => console.error(`Error playing file sound ${soundPathOrType}:`, error));
    } else if (!audioElement && soundPathOrType.startsWith('/')) {
      console.warn(`Cannot play file sound: Audio element for ${soundPathOrType} not ready yet.`);
    } else if (!audioCtx && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
      console.warn(`Cannot play web audio: AudioContext for ${soundPathOrType} not ready yet.`);
    }
  }, [audioElement, isSoundEnabled, soundPathOrType, defaultVolume]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);
  
  // Expose audioElement for the welcome sound check on dashboard
  const audio = audioElement;

  return { playSound, isSoundEnabled, toggleSound, setVolume: (vol: number) => {
    if (audioElement) audioElement.volume = vol;
    // Note: Web Audio API volume is set directly in playSound via GainNode
  }, audio };
}
