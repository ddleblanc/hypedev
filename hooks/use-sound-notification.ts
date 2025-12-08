"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSoundNotificationOptions {
  soundUrl?: string;
  volume?: number;
  enabled?: boolean;
}

const STORAGE_KEY = "homepage-sound-notifications-enabled";

export function useSoundNotification(options: UseSoundNotificationOptions = {}) {
  const { soundUrl = "/sounds/notification.mp3", volume = 0.5 } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== "false";
  });
  const [isReady, setIsReady] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio(soundUrl);
    audio.volume = volume;
    audio.preload = "auto";

    audio.addEventListener("canplaythrough", () => {
      setIsReady(true);
    });

    audio.addEventListener("error", (e) => {
      console.warn("Sound notification audio failed to load:", e);
      setIsReady(false);
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [soundUrl, volume]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Play sound
  const play = useCallback(() => {
    if (!isEnabled || !audioRef.current || !isReady) return;

    // Reset to start if already playing
    audioRef.current.currentTime = 0;

    // Play with user interaction check
    audioRef.current.play().catch((err) => {
      // Browser may block autoplay without user interaction
      if (err.name === "NotAllowedError") {
        console.debug("Sound playback blocked - requires user interaction first");
      } else {
        console.error("Sound playback error:", err);
      }
    });
  }, [isEnabled, isReady]);

  // Toggle enabled state
  const toggle = useCallback(() => {
    setIsEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Set enabled state explicitly
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  return {
    play,
    toggle,
    setEnabled,
    isEnabled,
    isReady,
  };
}

// Hook for tracking new activity with sound
export function useActivitySound(
  activities: Array<{ id: string }>,
  options?: UseSoundNotificationOptions
) {
  const { play, isEnabled, toggle, isReady } = useSoundNotification(options);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid playing on initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      activities.forEach((a) => previousIdsRef.current.add(a.id));
      return;
    }

    // Check for new activities
    const newActivities = activities.filter(
      (a) => !previousIdsRef.current.has(a.id)
    );

    if (newActivities.length > 0) {
      play();
      newActivities.forEach((a) => previousIdsRef.current.add(a.id));
    }
  }, [activities, play]);

  return { isEnabled, toggle, isReady };
}
