
"use client";

import { useCallback, useEffect, useState } from 'react';

export function useSound(soundPath: string, defaultVolume: number = 0.5) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true); // Default to enabled

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newAudio = new Audio(soundPath);
      newAudio.volume = defaultVolume;
      setAudio(newAudio);

      // Optionally, load sound preference from localStorage
      // const storedPreference = localStorage.getItem('soundEffectsEnabled');
      // if (storedPreference !== null) {
      //   setIsSoundEnabled(JSON.parse(storedPreference));
      // }
    }
  }, [soundPath, defaultVolume]);

  const playSound = useCallback(() => {
    if (audio && isSoundEnabled) {
      console.log(`Attempting to play sound: ${soundPath}`);
      audio.currentTime = 0;
      audio.play().catch(error => console.error(`Error playing sound ${soundPath}:`, error));
    } else if (!audio) {
      console.warn(`Cannot play sound: Audio object for ${soundPath} not ready yet.`);
    } else if (!isSoundEnabled) {
      console.log(`Sound disabled, not playing: ${soundPath}`);
    }
  }, [audio, isSoundEnabled, soundPath]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const newState = !prev;
      // Optionally, save sound preference to localStorage
      // localStorage.setItem('soundEffectsEnabled', JSON.stringify(newState));
      return newState;
    });
  }, []);

  return { playSound, isSoundEnabled, toggleSound, setVolume: (vol: number) => audio?.volume && (audio.volume = vol), audio };
}
