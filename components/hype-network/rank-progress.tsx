"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AgentRank } from "@prisma/client";
import {
  RANK_COLORS,
  getAllRanks,
  RANK_THRESHOLDS,
  formatXp,
} from "@/lib/hype-network";
import { Check, Lock } from "lucide-react";

interface RankProgressProps {
  currentRank: AgentRank;
  totalXp: number;
  compact?: boolean;
  className?: string;
}

export function RankProgress({
  currentRank,
  totalXp,
  compact = false,
  className,
}: RankProgressProps) {
  const allRanks = getAllRanks();
  const currentIndex = allRanks.findIndex((r) => r.rank === currentRank);

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-1">
          {allRanks.map((rank, index) => {
            const isAchieved = index <= currentIndex;
            const isCurrent = rank.rank === currentRank;

            return (
              <div
                key={rank.rank}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  isAchieved ? rank.colors.bg : "bg-zinc-800",
                  isCurrent && "ring-2 ring-white/30"
                )}
                title={`${rank.name}: ${formatXp(rank.threshold)} XP`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{allRanks[0].icon} Rookie</span>
          <span>{allRanks[allRanks.length - 1].icon} Mythic</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Visual ladder */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-800" />

        {allRanks.map((rank, index) => {
          const isAchieved = index <= currentIndex;
          const isCurrent = rank.rank === currentRank;
          const isNext = index === currentIndex + 1;

          return (
            <motion.div
              key={rank.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative flex items-center gap-4 py-3",
                !isAchieved && "opacity-40"
              )}
            >
              {/* Node */}
              <div
                className={cn(
                  "relative z-10 h-8 w-8 rounded-full flex items-center justify-center",
                  isAchieved ? rank.colors.bg : "bg-zinc-800",
                  isCurrent && "ring-2 ring-white ring-offset-2 ring-offset-black"
                )}
              >
                {isAchieved && !isCurrent ? (
                  <Check className="h-4 w-4 text-white" />
                ) : !isAchieved ? (
                  <Lock className="h-3 w-3 text-zinc-600" />
                ) : (
                  <span className="text-sm">{rank.icon}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-semibold",
                      isAchieved ? rank.colors.text : "text-zinc-500"
                    )}
                  >
                    {rank.name}
                  </span>
                  <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {rank.multiplier.toFixed(1)}x
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {formatXp(rank.threshold)} XP required
                </div>
              </div>

              {/* Status */}
              <div className="text-right">
                {isCurrent && (
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    Current
                  </span>
                )}
                {isNext && (
                  <span className="text-xs text-zinc-400">
                    {formatXp(rank.threshold - totalXp)} XP to go
                  </span>
                )}
                {isAchieved && !isCurrent && (
                  <span className="text-xs text-zinc-500">✓ Achieved</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface RankBadgeProps {
  rank: AgentRank;
  size?: "sm" | "md" | "lg";
  showMultiplier?: boolean;
  className?: string;
}

export function RankBadge({
  rank,
  size = "md",
  showMultiplier = false,
  className,
}: RankBadgeProps) {
  const rankInfo = getAllRanks().find((r) => r.rank === rank)!;
  const colors = RANK_COLORS[rank];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg font-semibold",
        colors.bg,
        colors.text,
        sizeClasses[size],
        className
      )}
    >
      <span>{rankInfo.icon}</span>
      <span>{rankInfo.name}</span>
      {showMultiplier && (
        <span className="opacity-75">({rankInfo.multiplier.toFixed(1)}x)</span>
      )}
    </span>
  );
}

interface XpProgressBarProps {
  currentXp: number;
  currentRank: AgentRank;
  showLabels?: boolean;
  className?: string;
}

export function XpProgressBar({
  currentXp,
  currentRank,
  showLabels = true,
  className,
}: XpProgressBarProps) {
  const allRanks = getAllRanks();
  const currentIndex = allRanks.findIndex((r) => r.rank === currentRank);
  const nextRank = currentIndex < allRanks.length - 1 ? allRanks[currentIndex + 1] : null;
  const colors = RANK_COLORS[currentRank];

  const currentThreshold = RANK_THRESHOLDS[currentRank];
  const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank.rank] : currentThreshold;
  const xpInRank = currentXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = nextRank ? Math.min(100, (xpInRank / xpNeeded) * 100) : 100;

  return (
    <div className={cn("space-y-1", className)}>
      {showLabels && (
        <div className="flex justify-between text-xs">
          <span className={colors.text}>
            {formatXp(currentXp)} XP
          </span>
          {nextRank && (
            <span className="text-zinc-500">
              {formatXp(nextThreshold - currentXp)} to {nextRank.name}
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colors.bg)}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
