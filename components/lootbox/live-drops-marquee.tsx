"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Gift, Sparkles, Crown, Gem, Star, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLootboxMarqueeFeed, type FeedItem } from "@/hooks/use-lootbox-feed";
import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";

// Rarity configuration
const rarityConfig = {
  common: {
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.4)",
    gradient: "from-gray-600 via-gray-500 to-gray-600",
    icon: Shield,
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    border: "border-gray-500/30",
  },
  rare: {
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.5)",
    gradient: "from-blue-600 via-blue-400 to-blue-600",
    icon: Star,
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  epic: {
    color: "#a855f7",
    glow: "rgba(168,85,247,0.6)",
    gradient: "from-purple-600 via-purple-400 to-purple-600",
    icon: Gem,
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  mythic: {
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.7)",
    gradient: "from-yellow-600 via-amber-400 to-yellow-600",
    icon: Crown,
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  cosmic: {
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.8)",
    gradient: "from-cyan-600 via-cyan-400 to-cyan-600",
    icon: Sparkles,
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
} as const;

// Marquee variants
const marqueeVariants = cva("relative overflow-hidden", {
  variants: {
    size: {
      sm: "h-12",
      md: "h-16",
      lg: "h-20",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface DropItemProps {
  item: FeedItem;
  size: "sm" | "md" | "lg";
}

function DropItem({ item, size }: DropItemProps) {
  const rarityKey = item.rewardRarity.toLowerCase() as keyof typeof rarityConfig;
  const config = rarityConfig[rarityKey] || rarityConfig.common;
  const RarityIcon = config.icon;

  const sizeConfig = {
    sm: { avatar: "h-6 w-6", image: 24, text: "text-xs", gap: "gap-1.5" },
    md: { avatar: "h-8 w-8", image: 32, text: "text-sm", gap: "gap-2" },
    lg: { avatar: "h-10 w-10", image: 40, text: "text-base", gap: "gap-3" },
  };

  const cfg = sizeConfig[size];

  return (
    <motion.div
      className={cn(
        "flex items-center px-4 py-2 rounded-full border backdrop-blur-sm",
        cfg.gap,
        config.border,
        "bg-black/40"
      )}
      whileHover={{ scale: 1.05 }}
      style={{
        boxShadow: `0 0 20px ${config.glow}`,
      }}
    >
      {/* User avatar */}
      <Avatar className={cn(cfg.avatar, "border", config.border)}>
        {item.userAvatar ? (
          <AvatarImage src={item.userAvatar} />
        ) : (
          <AvatarFallback
            className={cn("text-[10px] font-bold", config.bg, config.text)}
          >
            {item.userDisplayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>

      {/* User name */}
      <span className={cn("text-white font-medium truncate max-w-[80px]", cfg.text)}>
        {item.userDisplayName}
      </span>

      {/* Won text */}
      <span className={cn("text-white/50", cfg.text)}>won</span>

      {/* Reward image */}
      <div
        className={cn(
          "rounded-lg overflow-hidden border-2",
          config.border
        )}
      >
        <Image
          src={item.rewardImage}
          alt={item.rewardName}
          width={cfg.image}
          height={cfg.image}
          className="object-cover"
        />
      </div>

      {/* Reward name with rarity */}
      <div className="flex items-center gap-1">
        <RarityIcon className={cn("h-3 w-3", config.text)} />
        <span className={cn("font-bold truncate max-w-[100px]", config.text, config.text)}>
          {item.rewardName}
        </span>
      </div>

      {/* From lootbox */}
      <span className={cn("text-white/40", cfg.text)}>from</span>
      <span className={cn("text-white/70 font-medium truncate max-w-[80px]", cfg.text)}>
        {item.lootboxName}
      </span>
    </motion.div>
  );
}

interface LiveDropsMarqueeProps extends VariantProps<typeof marqueeVariants> {
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
  enabled?: boolean;
}

export function LiveDropsMarquee({
  size = "md",
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  className,
  enabled = true,
}: LiveDropsMarqueeProps) {
  const { feed, loading, error } = useLootboxMarqueeFeed({ enabled });
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  // Calculate animation duration based on content width
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (containerRef.current && feed.length > 0) {
      const contentWidth = containerRef.current.scrollWidth / 2;
      const calculatedDuration = contentWidth / speed;
      setDuration(calculatedDuration);
    }
  }, [feed, speed]);

  useEffect(() => {
    if (isPaused) {
      controls.stop();
    } else {
      controls.start({
        x: direction === "left" ? "-50%" : "0%",
        transition: {
          duration,
          ease: "linear",
          repeat: Infinity,
        },
      });
    }
  }, [isPaused, direction, duration, controls]);

  if (!enabled || loading || error || feed.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const duplicatedFeed = [...feed, ...feed];

  return (
    <div
      className={cn(
        marqueeVariants({ size }),
        "bg-gradient-to-r from-black via-transparent to-black",
        className
      )}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      {/* Live indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
        <div className="relative">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-red-500 animate-ping" />
        </div>
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          Live Drops
        </span>
      </div>

      {/* Scrolling content */}
      <motion.div
        ref={containerRef}
        className="flex items-center gap-4 h-full pl-32"
        animate={controls}
        initial={{ x: direction === "left" ? "0%" : "-50%" }}
      >
        {duplicatedFeed.map((item, index) => (
          <DropItem
            key={`${item.id}-${index}`}
            item={item}
            size={size as "sm" | "md" | "lg"}
          />
        ))}
      </motion.div>
    </div>
  );
}

// Compact version for embedding
interface LiveDropsTickerProps {
  className?: string;
  maxItems?: number;
  enabled?: boolean;
}

export function LiveDropsTicker({
  className,
  maxItems = 5,
  enabled = true,
}: LiveDropsTickerProps) {
  const { feed, loading } = useLootboxMarqueeFeed({
    limit: maxItems,
    enabled,
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (feed.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % feed.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [feed.length]);

  if (!enabled || loading || feed.length === 0) {
    return null;
  }

  const currentItem = feed[currentIndex];
  const rarityKey = currentItem.rewardRarity.toLowerCase() as keyof typeof rarityConfig;
  const config = rarityConfig[rarityKey] || rarityConfig.common;
  const RarityIcon = config.icon;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>

          <Avatar className="h-6 w-6 border border-white/20">
            {currentItem.userAvatar ? (
              <AvatarImage src={currentItem.userAvatar} />
            ) : (
              <AvatarFallback className="text-[8px] font-bold bg-white/10 text-white">
                {currentItem.userDisplayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <span className="text-white/80 text-xs">
            <span className="font-medium text-white">
              {currentItem.userDisplayName}
            </span>{" "}
            won{" "}
            <span className={cn("font-bold", config.text)}>
              <RarityIcon className="inline h-3 w-3 mr-0.5" />
              {currentItem.rewardName}
            </span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
