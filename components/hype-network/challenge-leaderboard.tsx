"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RANK_COLORS, RANK_ICONS } from "@/lib/hype-network/rank-utils";
import { AgentRank, ChallengeType } from "@prisma/client";
import { TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";

interface LeaderboardEntry {
  rank: number | null;
  previousRank: number | null;
  agentTag: string;
  agentName: string | null;
  avatar: string | null;
  agentRank: AgentRank;
  currentValue: number;
  percentComplete: number;
  completedAt: Date | null;
}

interface ChallengeLeaderboardProps {
  entries: LeaderboardEntry[];
  challengeType: ChallengeType;
  targetValue: number;
  currentAgentTag?: string;
  isLoading?: boolean;
}

const RANK_MEDALS: Record<number, { emoji: string; bg: string }> = {
  1: { emoji: "", bg: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50" },
  2: { emoji: "", bg: "bg-gradient-to-r from-zinc-400/20 to-slate-400/20 border-zinc-400/50" },
  3: { emoji: "", bg: "bg-gradient-to-r from-orange-700/20 to-amber-700/20 border-orange-700/50" },
};

export function ChallengeLeaderboard({
  entries,
  challengeType,
  targetValue,
  currentAgentTag,
  isLoading,
}: ChallengeLeaderboardProps) {
  const formatValue = (value: number) => {
    if (challengeType === "MOST_VOLUME" || challengeType === "WHALE_HUNTER") {
      return `${(value / 1000).toFixed(3)} ETH`;
    }
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-lg bg-zinc-900/50 animate-pulse"
          >
            <div className="w-10 h-10 bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-24" />
              <div className="h-3 bg-zinc-800 rounded w-16" />
            </div>
            <div className="h-4 bg-zinc-800 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <div className="text-4xl mb-3">🏁</div>
        <div className="font-medium">No participants yet</div>
        <div className="text-sm mt-1">Be the first to join!</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isCurrentAgent = entry.agentTag === currentAgentTag;
        const rankChange = entry.previousRank
          ? entry.previousRank - (entry.rank || 0)
          : 0;
        const medal = entry.rank ? RANK_MEDALS[entry.rank] : null;
        const rankColors = RANK_COLORS[entry.agentRank];

        return (
          <motion.div
            key={entry.agentTag}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              isCurrentAgent
                ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                : medal
                  ? medal.bg
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
            )}
          >
            {/* Rank */}
            <div className="w-10 flex justify-center">
              {entry.rank === 1 && (
                <span className="text-2xl">🥇</span>
              )}
              {entry.rank === 2 && (
                <span className="text-2xl">🥈</span>
              )}
              {entry.rank === 3 && (
                <span className="text-2xl">🥉</span>
              )}
              {entry.rank && entry.rank > 3 && (
                <span className="text-lg font-bold text-zinc-400">
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* Rank change indicator */}
            <div className="w-6 flex justify-center">
              {rankChange > 0 && (
                <div className="flex items-center text-green-400 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>{rankChange}</span>
                </div>
              )}
              {rankChange < 0 && (
                <div className="flex items-center text-red-400 text-xs">
                  <TrendingDown className="h-3 w-3" />
                  <span>{Math.abs(rankChange)}</span>
                </div>
              )}
              {rankChange === 0 && entry.previousRank && (
                <Minus className="h-3 w-3 text-zinc-500" />
              )}
            </div>

            {/* Avatar */}
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                rankColors.bg
              )}
            >
              {entry.avatar ? (
                <img
                  src={entry.avatar}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg">{RANK_ICONS[entry.agentRank]}</span>
              )}
            </div>

            {/* Agent info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {entry.agentName || entry.agentTag.split("#")[0]}
                {isCurrentAgent && (
                  <span className="text-xs text-primary ml-2">(You)</span>
                )}
              </div>
              <div className="text-xs text-zinc-500 truncate">
                {entry.agentTag}
              </div>
            </div>

            {/* Progress */}
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-sm">
                {formatValue(entry.currentValue)}
              </div>
              <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, entry.percentComplete)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                  className={cn(
                    "h-full rounded-full",
                    entry.percentComplete >= 100 ? "bg-green-500" : "bg-primary"
                  )}
                />
              </div>
            </div>

            {/* Completion badge */}
            {entry.completedAt && (
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
