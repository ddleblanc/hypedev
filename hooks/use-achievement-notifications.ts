"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import type { AchievementDefinition } from "@/lib/hype-network/achievements";

interface UseAchievementNotificationsReturn {
  // Current achievement to display in modal (one at a time)
  currentAchievement: AchievementDefinition | null;
  // All pending achievements (for toast notification)
  pendingAchievements: AchievementDefinition[];
  // Whether the modal is open
  isModalOpen: boolean;
  // Close the current modal and move to next
  dismissCurrent: () => void;
  // Dismiss all pending achievements
  dismissAll: () => void;
  // Check for new achievements (call after XP events)
  checkForUnlocks: () => Promise<void>;
  // Is currently checking
  isChecking: boolean;
}

/**
 * Hook to manage achievement unlock notifications
 *
 * Usage:
 * ```tsx
 * const {
 *   currentAchievement,
 *   pendingAchievements,
 *   isModalOpen,
 *   dismissCurrent,
 *   dismissAll,
 *   checkForUnlocks,
 * } = useAchievementNotifications();
 *
 * // After any action that might trigger achievements:
 * await handleReferral();
 * await checkForUnlocks();
 *
 * // In your component:
 * <AchievementUnlockModal
 *   achievement={currentAchievement}
 *   isOpen={isModalOpen}
 *   onClose={dismissCurrent}
 * />
 * ```
 */
export function useAchievementNotifications(): UseAchievementNotificationsReturn {
  const [queue, setQueue] = useState<AchievementDefinition[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isCheckingRef = useRef(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkUnlocksMutation = trpc.hypeNetwork.achievements.checkUnlocks.useMutation();

  // Current achievement is the first in queue
  const currentAchievement = queue[0] ?? null;

  // Open modal when we have achievements in queue
  useEffect(() => {
    if (queue.length > 0 && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [queue, isModalOpen]);

  /**
   * Check for new achievement unlocks
   */
  const checkForUnlocks = useCallback(async () => {
    if (isCheckingRef.current) return;

    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      const newlyUnlocked = await checkUnlocksMutation.mutateAsync();

      if (newlyUnlocked && newlyUnlocked.length > 0) {
        setQueue((prev) => [...prev, ...(newlyUnlocked as AchievementDefinition[])]);
      }
    } catch (error) {
      console.error("Failed to check for achievement unlocks:", error);
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, [checkUnlocksMutation]);

  /**
   * Dismiss the current achievement and show next
   */
  const dismissCurrent = useCallback(() => {
    setIsModalOpen(false);

    // Wait for modal animation to complete before removing from queue
    setTimeout(() => {
      setQueue((prev) => prev.slice(1));
    }, 300);
  }, []);

  /**
   * Dismiss all pending achievements
   */
  const dismissAll = useCallback(() => {
    setIsModalOpen(false);

    setTimeout(() => {
      setQueue([]);
    }, 300);
  }, []);

  return {
    currentAchievement,
    pendingAchievements: queue,
    isModalOpen,
    dismissCurrent,
    dismissAll,
    checkForUnlocks,
    isChecking,
  };
}

/**
 * Hook to automatically check for achievements on mount
 * and optionally at intervals
 */
export function useAutoCheckAchievements(options?: {
  enabled?: boolean;
  checkOnMount?: boolean;
  intervalMs?: number;
}) {
  const {
    enabled = true,
    checkOnMount = true,
    intervalMs,
  } = options ?? {};

  const notifications = useAchievementNotifications();
  const hasCheckedOnMount = useRef(false);

  // Check on mount
  useEffect(() => {
    if (enabled && checkOnMount && !hasCheckedOnMount.current) {
      hasCheckedOnMount.current = true;
      notifications.checkForUnlocks();
    }
  }, [enabled, checkOnMount, notifications]);

  // Optional interval check
  useEffect(() => {
    if (!enabled || !intervalMs) return;

    const interval = setInterval(() => {
      notifications.checkForUnlocks();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs, notifications]);

  return notifications;
}

/**
 * Context for providing achievement notifications app-wide
 * Use this if you want a single notification system across the app
 */
export { useAchievementNotifications as useAchievementNotificationsContext };
