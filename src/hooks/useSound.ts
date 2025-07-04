
"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export function useSound(soundPathOrType: string, defaultVolume: number = 0.5) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false); 
  const { soundMode } = useSettings();

  useEffect(() => {
    let currentAudio: HTMLAudioElement;

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

      // Use a single, persistent audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      currentAudio = audioRef.current;
      currentAudio.volume = defaultVolume;

      // Only change src if it's different to avoid re-loading
      const desiredSrc = new URL(soundPathOrType, window.location.origin).href;
      if (currentAudio.src !== desiredSrc) {
        currentAudio.src = soundPathOrType;
        currentAudio.load();
      }

      currentAudio.removeEventListener('error', specificErrorHandler); // Clean up previous listener
      currentAudio.addEventListener('error', specificErrorHandler);
    }

    return () => {
      if (currentAudio) { 
        currentAudio.removeEventListener('error', specificErrorHandler);
      }
    };
  }, [soundPathOrType, defaultVolume]);

  const playSound = useCallback(() => {
    // Incidental sounds should only play in 'full' mode.
    if (soundMode !== 'full') {
      return;
    }
    
    if (hasLoadError || !audioRef.current) {
      return;
    }

    // Play the sound
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(playError => {
      // Don't log common abort errors, but flag others
      if (playError.name !== 'AbortError' && !hasLoadError) {
         console.warn(
          `LearnMint Sound System: Playback failed for "${soundPathOrType}".\n`+
          `Error: ${playError.name} - ${playError.message}.\n`+
          `This can happen if the browser blocks autoplay. Playback for this sound may be disabled until a user interaction.`
         );
         setHasLoadError(true); // Prevent future attempts for this sound
      }
    });
    
  }, [soundMode, hasLoadError, soundPathOrType]);
  
  return { 
    playSound
  };
}
