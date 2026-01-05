"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Sound effect types for lootbox interactions
 */
export type LootboxSoundEffect =
  | "tension-build"
  | "reveal-common"
  | "reveal-rare"
  | "reveal-epic"
  | "reveal-mythic"
  | "reveal-cosmic"
  | "celebration"
  | "purchase-confirm"
  | "notification";

/**
 * Rarity-specific sound mapping
 */
const RARITY_SOUNDS: Record<string, LootboxSoundEffect> = {
  common: "reveal-common",
  rare: "reveal-rare",
  epic: "reveal-epic",
  mythic: "reveal-mythic",
  cosmic: "reveal-cosmic",
};

/**
 * Sound file paths
 */
const SOUND_PATHS: Record<LootboxSoundEffect, string> = {
  "tension-build": "/sounds/lootbox/tension-build.mp3",
  "reveal-common": "/sounds/lootbox/reveal-common.mp3",
  "reveal-rare": "/sounds/lootbox/reveal-rare.mp3",
  "reveal-epic": "/sounds/lootbox/reveal-epic.mp3",
  "reveal-mythic": "/sounds/lootbox/reveal-mythic.mp3",
  "reveal-cosmic": "/sounds/lootbox/reveal-cosmic.mp3",
  celebration: "/sounds/lootbox/celebration.mp3",
  "purchase-confirm": "/sounds/lootbox/purchase-confirm.mp3",
  notification: "/sounds/lootbox/notification.mp3",
};

/**
 * Volume levels for each sound (0-1)
 */
const SOUND_VOLUMES: Record<LootboxSoundEffect, number> = {
  "tension-build": 0.4,
  "reveal-common": 0.5,
  "reveal-rare": 0.6,
  "reveal-epic": 0.7,
  "reveal-mythic": 0.8,
  "reveal-cosmic": 0.9,
  celebration: 0.6,
  "purchase-confirm": 0.5,
  notification: 0.4,
};

interface UseLootboxSoundsOptions {
  enabled?: boolean;
  masterVolume?: number;
}

interface UseLootboxSoundsReturn {
  play: (sound: LootboxSoundEffect) => void;
  playRarityReveal: (rarity: string) => void;
  stop: (sound: LootboxSoundEffect) => void;
  stopAll: () => void;
  preload: () => void;
  setMasterVolume: (volume: number) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

/**
 * Hook for managing lootbox sound effects
 *
 * Features:
 * - Preloading for instant playback
 * - Rarity-appropriate reveal sounds
 * - Volume control per sound and master
 * - Enable/disable toggle
 */
export function useLootboxSounds(
  options: UseLootboxSoundsOptions = {}
): UseLootboxSoundsReturn {
  const { enabled: initialEnabled = true, masterVolume: initialVolume = 1 } =
    options;

  // Audio element pool
  const audioPoolRef = useRef<Map<LootboxSoundEffect, HTMLAudioElement>>(
    new Map()
  );
  const enabledRef = useRef(initialEnabled);
  const masterVolumeRef = useRef(initialVolume);

  // Create or get audio element
  const getAudioElement = useCallback(
    (sound: LootboxSoundEffect): HTMLAudioElement | null => {
      if (typeof window === "undefined") return null;

      let audio = audioPoolRef.current.get(sound);
      if (!audio) {
        audio = new Audio(SOUND_PATHS[sound]);
        audio.preload = "auto";
        audioPoolRef.current.set(sound, audio);
      }
      return audio;
    },
    []
  );

  // Play a specific sound
  const play = useCallback(
    (sound: LootboxSoundEffect) => {
      if (!enabledRef.current) return;

      const audio = getAudioElement(sound);
      if (!audio) return;

      // Reset and set volume
      audio.currentTime = 0;
      audio.volume = SOUND_VOLUMES[sound] * masterVolumeRef.current;

      // Play with error handling (browser autoplay restrictions)
      audio.play().catch((err) => {
        console.warn(`Could not play sound ${sound}:`, err.message);
      });
    },
    [getAudioElement]
  );

  // Play rarity-appropriate reveal sound
  const playRarityReveal = useCallback(
    (rarity: string) => {
      const normalizedRarity = rarity.toLowerCase();
      const soundEffect = RARITY_SOUNDS[normalizedRarity] || "reveal-common";
      play(soundEffect);
    },
    [play]
  );

  // Stop a specific sound
  const stop = useCallback((sound: LootboxSoundEffect) => {
    const audio = audioPoolRef.current.get(sound);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Stop all sounds
  const stopAll = useCallback(() => {
    for (const audio of audioPoolRef.current.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Preload all sounds
  const preload = useCallback(() => {
    if (typeof window === "undefined") return;

    for (const sound of Object.keys(SOUND_PATHS) as LootboxSoundEffect[]) {
      const audio = getAudioElement(sound);
      if (audio) {
        // Trigger load without playing
        audio.load();
      }
    }
  }, [getAudioElement]);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    masterVolumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  // Enable/disable sounds
  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (!enabled) {
      // Stop all sounds when disabled
      for (const audio of audioPoolRef.current.values()) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const audio of audioPoolRef.current.values()) {
        audio.pause();
        audio.src = "";
      }
      audioPoolRef.current.clear();
    };
  }, []);

  return {
    play,
    playRarityReveal,
    stop,
    stopAll,
    preload,
    setMasterVolume,
    isEnabled: enabledRef.current,
    setEnabled,
  };
}

/**
 * Haptic feedback patterns by rarity
 * Uses the Vibration API for mobile devices
 */
export const HAPTIC_PATTERNS: Record<string, number[]> = {
  common: [50],
  rare: [50, 30, 50],
  epic: [100, 50, 100],
  mythic: [150, 50, 150, 50, 150],
  cosmic: [200, 100, 200, 100, 200, 100, 300],
};

/**
 * Trigger haptic feedback based on rarity
 */
export function triggerHaptic(rarity: string): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

  const normalizedRarity = rarity.toLowerCase();
  const pattern = HAPTIC_PATTERNS[normalizedRarity] || HAPTIC_PATTERNS.common;

  try {
    navigator.vibrate(pattern);
  } catch (err) {
    // Vibration API not supported or blocked
    console.warn("Haptic feedback not available");
  }
}

/**
 * Sound triggers mapped to video progress percentages
 * Use with video's onTimeUpdate event
 */
export const VIDEO_SOUND_TRIGGERS: Record<number, LootboxSoundEffect> = {
  0.45: "tension-build", // Rarity overlay starts
  // 0.75: determined by rarity - use playRarityReveal
  0.9: "celebration", // Victory moment
};
