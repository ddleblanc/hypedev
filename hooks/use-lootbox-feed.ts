"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { z } from "zod";

// Zod schema for feed item validation
const feedItemSchema = z.object({
  id: z.string(),
  lootboxId: z.string(),
  lootboxName: z.string(),
  userId: z.string(),
  userDisplayName: z.string(),
  userAvatar: z.string().nullable(),
  rewardName: z.string(),
  rewardImage: z.string(),
  rewardRarity: z.string(),
  valueAtOpen: z.number().nullable(),
  timestamp: z.string(),
});

const feedResponseSchema = z.object({
  success: z.boolean(),
  feed: z.array(feedItemSchema),
  hasMore: z.boolean(),
});

export type FeedItem = z.infer<typeof feedItemSchema>;

export interface UseLootboxFeedOptions {
  rarity?: "rare" | "epic" | "mythic" | "cosmic";
  limit?: number;
  pollingInterval?: number;
  enabled?: boolean;
}

export interface UseLootboxFeedReturn {
  feed: FeedItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasMore: boolean;
}

export function useLootboxFeed(
  options: UseLootboxFeedOptions = {}
): UseLootboxFeedReturn {
  const {
    rarity,
    limit = 20,
    pollingInterval = 10000,
    enabled = true,
  } = options;

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const lastFetchRef = useRef<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!enabled) return;

    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      if (rarity) {
        params.set("rarity", rarity);
      }

      const response = await fetch(`/api/lootboxes/feed?${params.toString()}`);
      const data = await response.json();

      const parsed = feedResponseSchema.safeParse(data);
      if (!parsed.success) {
        console.error("Feed validation error:", parsed.error);
        throw new Error("Invalid feed response");
      }

      if (!parsed.data.success) {
        throw new Error("Failed to fetch feed");
      }

      // Check if we have new items (for polling updates)
      const newItemId = parsed.data.feed[0]?.id;
      if (lastFetchRef.current !== newItemId) {
        setFeed(parsed.data.feed);
        lastFetchRef.current = newItemId || null;
      }

      setHasMore(parsed.data.hasMore);
      setError(null);
    } catch (err) {
      console.error("Error fetching lootbox feed:", err);
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, rarity]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchFeed();
    }
  }, [enabled, fetchFeed]);

  // Polling for updates
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return;

    const intervalId = setInterval(fetchFeed, pollingInterval);
    return () => clearInterval(intervalId);
  }, [enabled, pollingInterval, fetchFeed]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchFeed();
  }, [fetchFeed]);

  return {
    feed,
    loading,
    error,
    refresh,
    hasMore,
  };
}

// Hook specifically for the marquee (rare+ drops only)
export function useLootboxMarqueeFeed(
  options: Omit<UseLootboxFeedOptions, "rarity"> = {}
): UseLootboxFeedReturn {
  return useLootboxFeed({
    ...options,
    rarity: "rare",
    limit: options.limit || 50,
    pollingInterval: options.pollingInterval || 5000,
  });
}
