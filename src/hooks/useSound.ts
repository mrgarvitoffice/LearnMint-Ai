
"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export function useSound(soundPathOrType: string, defaultVolume: number = 0.5) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false); 
  const { soundMode } = useSettings();

  useEffect(() => {
    let currentAudio: HTMLAudioElement | null = null;
    const specificErrorHandler = () => {
      console.warn(
        `LearnMint Sound System: Failed to load sound from "${soundPathOrType}".\n` +
        `This usually means the file is missing from the 'public/sounds/' directory or the path is incorrect.\n` +
        `Please check that the file exists (e.g., 'public/sounds/ting.mp3') and the path matches exactly.\n` +
        `Refer to README instructions for required static assets. Sound playback for this specific sound will be disabled.`
      );
      setHasLoadError(true);
    };

    if (typeof window !== 'undefined') {
      setHasLoadError(false); 

      if (soundPathOrType.startsWith('/')) { 
        currentAudio = new Audio(soundPathOrType);
        currentAudio.volume = defaultVolume;
        currentAudio.addEventListener('error', specificErrorHandler);
        currentAudio.preload = 'auto'; 
        currentAudio.load();
        setAudioElement(currentAudio);

      } else if (!audioContextRef.current && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Error initializing AudioContext for Web Audio API sounds:", e);
        }
      }
    }

    return () => {
      if (currentAudio) { 
        currentAudio.removeEventListener('error', specificErrorHandler);
        currentAudio.pause();
        currentAudio.removeAttribute('src');
        currentAudio.load();
      }
    };
  }, [soundPathOrType, defaultVolume]);

  const playSound = useCallback(() => {
    if (soundMode === 'muted') return;

    if (soundPathOrType.startsWith('/')) { 
      if (hasLoadError || !audioElement) {
        return;
      }
      if (audioElement.src && (audioElement.src.endsWith(soundPathOrType) || audioElement.src.includes(encodeURIComponent(soundPathOrType)))) {
        audioElement.currentTime = 0;
        audioElement.play().catch(playError => {
          if (playError.name === "NotSupportedError" && !hasLoadError) {
             console.warn(
              `LearnMint Sound System: Playback failed for "${soundPathOrType}" with NotSupportedError.\n`+
              `This indicates the browser could not play the file, possibly due to format issues or it was blocked.\n`+
              `Ensure sound files are in a widely supported format (like MP3).`
             );
             setHasLoadError(true);
          } else if (!hasLoadError) {
            // console.error(`Runtime error playing sound ${soundPathOrType}:`, playError);
          }
        });
      }

    } else { 
      const audioCtx = audioContextRef.current;
      if (audioCtx && (soundPathOrType === 'correct' || soundPathOrType === 'incorrect')) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(defaultVolume * 0.5, audioCtx.currentTime); 

        if (soundPathOrType === 'correct') {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime); 
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
        } else if (soundPathOrType === 'incorrect') {
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(261.63, audioCtx.currentTime); 
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.4);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.4);
        }
      }
    }
  }, [audioElement, soundMode, soundPathOrType, defaultVolume, hasLoadError]);
  
  return { 
    playSound
  };
}
