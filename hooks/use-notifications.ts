"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSoundNotification } from "@/hooks/use-sound-notification";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  actionType: string | null;
  actionStatus: string;
  actionData: Record<string, unknown> | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isTimeSensitive: boolean;
  expiresAt: string | null;
  isRead: boolean;
  readAt: string | null;
  isDismissed: boolean;
  nftId: string | null;
  collectionId: string | null;
  tradeId: string | null;
  offerId: string | null;
  relatedUserId: string | null;
  relatedAddress: string | null;
  metadata: {
    nftImage?: string;
    nftName?: string;
    collectionName?: string;
    price?: number;
    fromUsername?: string;
    fromAddress?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  maxItems?: number;
  pollInterval?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  hasUrgent: boolean;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  performAction: (
    id: string,
    action: string,
    data?: Record<string, unknown>
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
  reconnect: () => void;
}

export function useNotifications({
  enabled = true,
  maxItems = 50,
  pollInterval = 30000,
}: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { user } = useAuth();
  const { play } = useSoundNotification({
    soundUrl: "/sounds/notification.mp3",
    volume: 0.5,
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previousCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  // Use refs for values that shouldn't trigger reconnection
  const maxItemsRef = useRef(maxItems);
  const pollIntervalValueRef = useRef(pollInterval);

  useEffect(() => {
    maxItemsRef.current = maxItems;
  }, [maxItems]);

  useEffect(() => {
    pollIntervalValueRef.current = pollInterval;
  }, [pollInterval]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `/api/notifications?userId=${user.id}&limit=${maxItemsRef.current}`
      );
      const data = await response.json();

      if (data.success) {
        const newNotifications = data.notifications as Notification[];
        const newUnreadCount = newNotifications.filter(
          (n) => !n.isRead && !n.isDismissed
        ).length;

        // Play sound if new unread notifications
        if (newUnreadCount > previousCountRef.current) {
          play();
        }
        previousCountRef.current = newUnreadCount;

        setNotifications(newNotifications);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, play]);

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!enabled || !user?.id) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setError(null);

    try {
      const eventSource = new EventSource(
        `/api/notifications/stream?userId=${user.id}`
      );
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "initial") {
            setNotifications(data.data.slice(0, maxItemsRef.current));
            setIsLoading(false);
          } else if (data.type === "new") {
            const newNotification = data.data as Notification;
            setNotifications((prev) => {
              const updated = [newNotification, ...prev].slice(
                0,
                maxItemsRef.current
              );
              return updated;
            });
            play();
          } else if (data.type === "update") {
            const updatedNotification = data.data as Partial<Notification> & {
              id: string;
            };
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id
                  ? { ...n, ...updatedNotification }
                  : n
              )
            );
          } else if (data.type === "delete") {
            const { id } = data.data as { id: string };
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          }
        } catch (err) {
          console.error("Error parsing notification SSE data:", err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          reconnectAttemptsRef.current++;

          setError(`Connection lost. Reconnecting in ${delay / 1000}s...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          // Fall back to polling
          setError("Live updates unavailable. Polling for updates...");
          startPolling();
        }
      };
    } catch (err) {
      console.error("Error creating notification EventSource:", err);
      setError("Failed to establish live connection");
      // Fall back to polling
      startPolling();
    }
  }, [enabled, user?.id, play]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, pollIntervalValueRef.current);
  }, [fetchNotifications]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    stopPolling();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, stopPolling]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );

      try {
        const response = await fetch(`/api/notifications/${id}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          // Revert on failure
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === id ? { ...n, isRead: false, readAt: null } : n
            )
          );
        }
      } catch (err) {
        console.error("Failed to mark as read:", err);
        // Revert on error
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: false, readAt: null } : n
          )
        );
      }
    },
    [user?.id]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      }))
    );

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        // Refresh to get correct state
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      await fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  // Dismiss notification
  const dismiss = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      // Optimistic update - remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      try {
        const response = await fetch(`/api/notifications/${id}/dismiss`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          // Refresh to get correct state
          await fetchNotifications();
        }
      } catch (err) {
        console.error("Failed to dismiss:", err);
        await fetchNotifications();
      }
    },
    [user?.id, fetchNotifications]
  );

  // Perform action on notification
  const performAction = useCallback(
    async (
      id: string,
      action: string,
      data?: Record<string, unknown>
    ): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const response = await fetch(`/api/notifications/${id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, action, data }),
        });

        const result = await response.json();

        if (result.success) {
          // Update notification status
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === id
                ? {
                    ...n,
                    actionStatus: "COMPLETED",
                    isRead: true,
                    readAt: new Date().toISOString(),
                  }
                : n
            )
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to perform action:", err);
        return false;
      }
    },
    [user?.id]
  );

  // Initial fetch and SSE connection
  useEffect(() => {
    if (!enabled || !user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Connect to SSE
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      stopPolling();
    };
  }, [enabled, user?.id, fetchNotifications, connect, stopPolling]);

  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead && !n.isDismissed).length,
    [notifications]
  );

  const hasUrgent = useMemo(
    () =>
      notifications.some(
        (n) =>
          (n.priority === "URGENT" || n.isTimeSensitive) &&
          !n.isRead &&
          !n.isDismissed
      ),
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    hasUrgent,
    isLoading,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    performAction,
    refresh: fetchNotifications,
    reconnect,
  };
}
