"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Tag,
  Gavel,
  Sparkles,
  ArrowRight,
  Activity,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { useActivitySound } from "@/hooks/use-sound-notification";
import type { ActivityItem } from "@/types/homepage";

interface LiveActivityFeedProps {
  className?: string;
  autoScroll?: boolean;
  refreshInterval?: number;
  enableSound?: boolean;
}

const activityConfig: Record<
  ActivityItem["type"],
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  sale: {
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    label: "SOLD",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-l-green-500",
    glowColor: "shadow-green-500/20",
  },
  listing: {
    icon: <Tag className="w-3.5 h-3.5" />,
    label: "LISTED",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-l-blue-500",
    glowColor: "shadow-blue-500/20",
  },
  bid: {
    icon: <Gavel className="w-3.5 h-3.5" />,
    label: "BID",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-l-purple-500",
    glowColor: "shadow-purple-500/20",
  },
  mint: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: "MINTED",
    color: "text-[rgb(163,255,18)]",
    bgColor: "bg-[rgb(163,255,18)]/20",
    borderColor: "border-l-[rgb(163,255,18)]",
    glowColor: "shadow-[rgb(163,255,18)]/20",
  },
  transfer: {
    icon: <ArrowRight className="w-3.5 h-3.5" />,
    label: "TRANSFER",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-l-orange-500",
    glowColor: "shadow-orange-500/20",
  },
};

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ActivityCard({ activity, isNew = false }: { activity: ActivityItem; isNew?: boolean }) {
  const config = activityConfig[activity.type];
  const fromName = activity.fromUsername || formatAddress(activity.from);
  const toName = activity.toUsername || (activity.to ? formatAddress(activity.to) : null);

  // Build description based on activity type
  const getDescription = () => {
    switch (activity.type) {
      case "sale":
        return toName ? (
          <span className="text-white/60 text-xs">
            <span className="text-white/80 font-medium">{toName}</span>
            {" bought from "}
            <span className="text-white/80">{fromName}</span>
          </span>
        ) : (
          <span className="text-white/60 text-xs">sold by {fromName}</span>
        );
      case "listing":
        return (
          <span className="text-white/60 text-xs">
            listed by <span className="text-white/80">{fromName}</span>
          </span>
        );
      case "bid":
        return (
          <span className="text-white/60 text-xs">
            bid by <span className="text-white/80">{fromName}</span>
          </span>
        );
      case "mint":
        return (
          <span className="text-white/60 text-xs">
            minted by <span className="text-white/80">{fromName}</span>
          </span>
        );
      case "transfer":
        return toName ? (
          <span className="text-white/60 text-xs">
            <span className="text-white/80">{fromName}</span>
            {" → "}
            <span className="text-white/80">{toName}</span>
          </span>
        ) : (
          <span className="text-white/60 text-xs">from {fromName}</span>
        );
      default:
        return <span className="text-white/60 text-xs">by {fromName}</span>;
    }
  };

  return (
    <Link
      href={`/collection/${activity.collection.slug}`}
      className={cn(
        "flex-shrink-0 w-72 p-4",
        "bg-zinc-900/80 hover:bg-zinc-800/80 backdrop-blur-sm",
        "transition-all duration-300 rounded-xl",
        "border-l-4 border border-white/5",
        config.borderColor,
        "hover:shadow-lg",
        config.glowColor,
        isNew && "ring-2 ring-[rgb(163,255,18)]/30 animate-pulse"
      )}
    >
      <div className="flex items-start gap-3">
        {/* NFT Image */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
          <MediaRenderer
            src={activity.nft.image}
            alt={activity.nft.name}
            className="w-full h-full object-cover"
          />
          {/* Type badge overlay */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 py-0.5 px-1.5",
              "flex items-center justify-center gap-1",
              config.bgColor,
              config.color,
              "backdrop-blur-sm text-[10px] font-bold"
            )}
          >
            {config.icon}
            {config.label}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate mb-0.5">
            {activity.nft.name}
          </p>
          <p className="text-white/40 text-xs truncate mb-2">
            {activity.collection.name}
          </p>

          {/* Description */}
          {getDescription()}
        </div>
      </div>

      {/* Price Section - Larger and more prominent */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        {activity.price ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[rgb(163,255,18)] font-bold text-xl">
              {activity.price}
            </span>
            <span className="text-white/50 text-sm font-medium">
              {activity.priceCurrency}
            </span>
          </div>
        ) : (
          <span className="text-white/30 text-sm">—</span>
        )}

        {/* Timestamp */}
        <span className="text-white/30 text-xs">
          {activity.timestamp}
        </span>
      </div>
    </Link>
  );
}

export function LiveActivityFeed({
  className,
  autoScroll = true,
  refreshInterval = 30000,
  enableSound = true,
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const previousActivityIdsRef = useRef<Set<string>>(new Set());

  // Sound notification
  const { toggle: toggleSound, isEnabled: isSoundEnabled } = useActivitySound(
    activities,
    {
      soundUrl: "/sounds/notification.mp3",
      enabled: enableSound,
    }
  );

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch("/api/homepage/activity");
      const data = await response.json();
      if (data.success && data.activities) {
        const newActivities = data.activities as ActivityItem[];

        // Detect new activities
        const currentIds = new Set(newActivities.map((a) => a.id));
        const newIds = new Set<string>();

        newActivities.forEach((activity) => {
          if (!previousActivityIdsRef.current.has(activity.id)) {
            newIds.add(activity.id);
          }
        });

        if (newIds.size > 0 && previousActivityIdsRef.current.size > 0) {
          setNewActivityIds(newIds);
          // Clear new indicator after 3 seconds
          setTimeout(() => setNewActivityIds(new Set()), 3000);
        }

        previousActivityIdsRef.current = currentIds;
        setActivities(newActivities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    // Refresh periodically
    const interval = setInterval(fetchActivities, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchActivities]);

  // Auto-scroll animation with seamless loop
  useEffect(() => {
    if (!autoScroll || isPaused || !scrollRef.current || activities.length === 0) {
      return;
    }

    let scrollPosition = scrollRef.current.scrollLeft;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      if (!scrollRef.current) return;

      scrollPosition += scrollSpeed;
      // Reset at halfway point (where duplicated content begins) for seamless loop
      const halfwayPoint = scrollRef.current.scrollWidth / 2;

      if (scrollPosition >= halfwayPoint) {
        scrollPosition = 0;
      }

      scrollRef.current.scrollLeft = scrollPosition;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoScroll, isPaused, activities]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
          <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 p-4 bg-white/5 rounded-xl animate-pulse border-l-4 border-white/10"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-white/10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-white/10 rounded" />
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-3 w-32 bg-white/10 rounded" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="h-6 w-24 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-12 bg-white/5 rounded-2xl border border-white/10",
          className
        )}
      >
        <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/60">No recent activity</p>
        <p className="text-white/40 text-sm mt-1">
          Check back soon for live updates
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <LiveIndicator variant="glow" label="Live Feed" />
          <span className="text-white/40 text-xs">
            {activities.length} activities
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          {enableSound && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className={cn(
                "text-white/50 hover:text-white h-8 px-2",
                isSoundEnabled && "text-[rgb(163,255,18)]"
              )}
              title={isSoundEnabled ? "Mute notifications" : "Enable notifications"}
            >
              {isSoundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Pause/Play button */}
          {autoScroll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="text-white/50 hover:text-white h-8"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-1.5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-1.5" />
                  Pause
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Scrolling container */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-1"
        style={{ scrollBehavior: isPaused ? "smooth" : "auto" }}
      >
        {/* Duplicate for seamless loop */}
        {[...activities, ...activities].map((activity, index) => (
          <motion.div
            key={`${activity.id}-${index}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: (index % activities.length) * 0.04,
              duration: 0.3,
              ease: [0.32, 0.72, 0, 1],
            }}
          >
            <ActivityCard
              activity={activity}
              isNew={newActivityIds.has(activity.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-12 bottom-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-12 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />

      {/* Activity type legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5">
        {Object.entries(activityConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", config.bgColor.replace("/20", ""))} />
            <span className="text-white/40 text-xs capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
