"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface GlobalActivityEvent {
  id: string;
  type: string;
  item: string;
  image: string | null;
  price: string;
  from: string;
  to: string;
  timestamp: string;
  txHash: string;
  collection: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
}

interface UseGlobalActivityStreamOptions {
  enabled?: boolean;
  maxItems?: number;
  onNewActivity?: (activity: GlobalActivityEvent) => void;
}

interface UseGlobalActivityStreamReturn {
  activities: GlobalActivityEvent[];
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useGlobalActivityStream({
  enabled = true,
  maxItems = 50,
  onNewActivity,
}: UseGlobalActivityStreamOptions = {}): UseGlobalActivityStreamReturn {
  const [activities, setActivities] = useState<GlobalActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Use refs for values that shouldn't trigger reconnection
  const maxItemsRef = useRef(maxItems);
  const onNewActivityRef = useRef(onNewActivity);

  useEffect(() => {
    maxItemsRef.current = maxItems;
  }, [maxItems]);

  useEffect(() => {
    onNewActivityRef.current = onNewActivity;
  }, [onNewActivity]);

  const connect = useCallback(() => {
    if (!enabled) return;

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
      const eventSource = new EventSource("/api/activity/global-stream");
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
            setActivities(data.activities.slice(0, maxItemsRef.current));
          } else if (data.type === "new") {
            setActivities((prev) => {
              const newActivities = [...data.activities, ...prev].slice(
                0,
                maxItemsRef.current
              );
              return newActivities;
            });

            // Notify about new activities
            if (onNewActivityRef.current) {
              data.activities.forEach((activity: GlobalActivityEvent) => {
                onNewActivityRef.current!(activity);
              });
            }
          }
        } catch (err) {
          console.error("Error parsing global SSE data:", err);
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
          setError("Failed to connect. Please refresh the page.");
        }
      };
    } catch (err) {
      console.error("Error creating global EventSource:", err);
      setError("Failed to establish connection");
    }
  }, [enabled]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Connect on mount
  useEffect(() => {
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
    };
  }, [connect]);

  return {
    activities,
    isConnected,
    error,
    reconnect,
  };
}
