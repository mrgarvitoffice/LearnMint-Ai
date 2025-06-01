
"use client";

import { useCallback, useEffect, useState, useRef } from 'react';

export function useSound(soundPathOrType: string, defaultVolume: number = 0.5) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false); // Track if *this specific sound instance* failed to load

  useEffect(() => {
    let currentAudio: HTMLAudioElement | null = null;
    // Defining the error handler within useEffect so it captures the correct soundPathOrType
    // for the console message, and can be properly added/removed.
    const specificErrorHandler = () => {
      console.warn(
        `LearnMint Sound System: Failed to load sound from "${soundPathOrType}". ` +
        `This usually means the file is missing from the 'public/sounds/' directory or the path is incorrect. ` +
        `Please check that the file exists (e.g., 'public/sounds/ting.mp3') and the path is correct as per README instructions. ` +
        `Sound playback for this specific sound instance will be disabled.`
      );
      setHasLoadError(true);
      // Optionally, you could setAudioElement(null) here if you want to fully discard the broken element,
      // but setHasLoadError should be sufficient to prevent playSound attempts.
    };

    if (typeof window !== 'undefined') {
      setHasLoadError(false); // Reset load error state when soundPathOrType or defaultVolume changes

      if (soundPathOrType.startsWith('/')) { // File-based sound
        currentAudio = new Audio(soundPathOrType);
        currentAudio.volume = defaultVolume;
        currentAudio.addEventListener('error', specificErrorHandler);
        setAudioElement(currentAudio);

      } else if (!audioContextRef.current && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
        // For Web Audio API sounds, initialize AudioContext once
        // This part should be safe and not cause the "no supported sources" error
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Error initializing AudioContext for Web Audio API sounds:", e);
        }
      }
    }

    return () => {
      // Cleanup: remove event listener when component unmounts or dependencies change
      if (currentAudio) { // Check if currentAudio was actually created for this effect instance
        currentAudio.removeEventListener('error', specificErrorHandler);
        // You might also want to pause and release resources if the audio element is specific to this effect instance
        // currentAudio.pause();
        // currentAudio.src = ''; // Helps release resources
      }
    };
  }, [soundPathOrType, defaultVolume]); // Dependencies for this effect

  const playSound = useCallback(() => {
    if (!isSoundEnabled) return;

    if (soundPathOrType.startsWith('/')) { // File-based sound
      if (hasLoadError || !audioElement) {
        // Error already logged by the event listener, or element not ready.
        // Silently return to avoid console spam.
        return;
      }
      // Double check if the audioElement's src matches the intended soundPathOrType,
      // especially if the audioElement state might be shared or updated asynchronously.
      // For simple cases, this might be redundant if useEffect handles it well.
      if (audioElement.src && audioElement.src.includes(soundPathOrType)) {
        audioElement.currentTime = 0;
        audioElement.play().catch(playError => {
          // This catch is for runtime errors during .play(), not initial load errors.
          console.error(`Runtime error playing sound ${soundPathOrType}:`, playError);
        });
      } else if (!audioElement.src) {
        // This means the src was somehow cleared or never set, possibly after an error
        console.warn(`Sound Warning: Cannot play "${soundPathOrType}". Audio source is not set, likely due to a previous load error.`);
      }

    } else { // Web Audio API sounds ('correct', 'incorrect')
      const audioCtx = audioContextRef.current;
      if (audioCtx && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(defaultVolume * 0.5, audioCtx.currentTime); // Web Audio sounds are often louder

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
      } else if (!audioCtx && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
        console.warn(`Cannot play web audio: AudioContext for ${soundPathOrType} not ready yet.`);
      }
    }
  }, [audioElement, isSoundEnabled, soundPathOrType, defaultVolume, hasLoadError]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);
  
  const audio = audioElement; // Expose for potential external checks like in Dashboard welcome sound

  return { 
    playSound, 
    isSoundEnabled, 
    toggleSound, 
    setVolume: (vol: number) => {
      if (audioElement && soundPathOrType.startsWith('/')) audioElement.volume = vol;
      // Note: Web Audio API volume is set directly in playSound via GainNode for 'correct'/'incorrect'
    }, 
    audio 
  };
}
