"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { RANK_COLORS, RANK_ICONS, formatXp, formatEarnings } from "@/lib/hype-network/rank-utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, Flame, Award, Zap } from "lucide-react";

type LeaderboardType = "xp" | "earnings" | "conversions" | "streak" | "achievements";

interface GlobalLeaderboardProps {
  currentAgentId?: string;
  className?: string;
}

const leaderboardTabs: { value: LeaderboardType; label: string; icon: React.ReactNode }[] = [
  { value: "xp", label: "XP", icon: <Zap className="h-3.5 w-3.5" /> },
  { value: "earnings", label: "Earnings", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: "conversions", label: "Referrals", icon: <Trophy className="h-3.5 w-3.5" /> },
  { value: "streak", label: "Streak", icon: <Flame className="h-3.5 w-3.5" /> },
  { value: "achievements", label: "Badges", icon: <Award className="h-3.5 w-3.5" /> },
];

export function GlobalLeaderboard({ currentAgentId, className }: GlobalLeaderboardProps) {
  const [type, setType] = useState<LeaderboardType>("xp");

  const { data: leaderboard, isLoading } = trpc.hypeNetwork.leaderboards.global.useQuery({
    type,
    limit: 50,
  });

  const formatValue = (value: number, leaderboardType: LeaderboardType) => {
    switch (leaderboardType) {
      case "xp":
        return formatXp(value);
      case "earnings":
        return formatEarnings(value);
      case "conversions":
        return `${value.toLocaleString()} refs`;
      case "streak":
        return `${value} days`;
      case "achievements":
        return `${value} badges`;
    }
  };

  return (
    <div className={cn("bg-black/40 backdrop-blur-sm rounded-xl border border-zinc-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xl font-bold mb-4">Global Leaderboard</h2>
        <Tabs value={type} onValueChange={(v) => setType(v as LeaderboardType)}>
          <TabsList className="grid grid-cols-5 w-full bg-zinc-900/50">
            {leaderboardTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-zinc-800"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full bg-zinc-800/50" />
            ))}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {leaderboard?.map((entry, index) => (
            <motion.div
              key={entry.agentId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                "flex items-center gap-4 p-3 hover:bg-zinc-800/30 transition",
                entry.agentId === currentAgentId && "bg-primary/10 border-l-2 border-primary"
              )}
            >
              {/* Rank */}
              <div className="w-12 text-center shrink-0">
                {entry.rank === 1 && <span className="text-2xl">1</span>}
                {entry.rank === 2 && <span className="text-2xl">2</span>}
                {entry.rank === 3 && <span className="text-2xl">3</span>}
                {entry.rank > 3 && (
                  <span
                    className={cn(
                      "text-lg font-bold",
                      entry.rank <= 10 ? "text-amber-400" : "text-zinc-500"
                    )}
                  >
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                  RANK_COLORS[entry.agentRank].bg
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

              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {entry.agentName || entry.agentTag.split("#")[0]}
                </div>
                <div className="text-xs text-zinc-500 truncate">{entry.agentTag}</div>
              </div>

              {/* Rank Badge */}
              <div
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold shrink-0 hidden sm:block",
                  RANK_COLORS[entry.agentRank].bg,
                  RANK_COLORS[entry.agentRank].text
                )}
              >
                {entry.agentRank}
              </div>

              {/* Value */}
              <div className="text-right shrink-0 font-mono font-bold text-sm">
                {formatValue(entry.value, type)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && leaderboard?.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            No agents yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact leaderboard widget for sidebars
 */
export function LeaderboardWidget({
  type = "xp",
  limit = 5,
  className,
}: {
  type?: LeaderboardType;
  limit?: number;
  className?: string;
}) {
  const { data: leaderboard, isLoading } = trpc.hypeNetwork.leaderboards.global.useQuery({
    type,
    limit,
  });

  const formatValue = (value: number, leaderboardType: LeaderboardType) => {
    switch (leaderboardType) {
      case "xp":
        return formatXp(value);
      case "earnings":
        return formatEarnings(value);
      case "conversions":
        return `${value} refs`;
      case "streak":
        return `${value}d`;
      case "achievements":
        return `${value}`;
    }
  };

  return (
    <div className={cn("bg-black/30 rounded-lg border border-zinc-800 p-3", className)}>
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4" />
        Top Agents
      </h3>
      <div className="space-y-2">
        {isLoading && (
          <>
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-zinc-800/50" />
            ))}
          </>
        )}
        {leaderboard?.map((entry) => (
          <div
            key={entry.agentId}
            className="flex items-center gap-2 text-sm"
          >
            <span className="w-5 text-center text-zinc-500 text-xs">
              {entry.rank}
            </span>
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                RANK_COLORS[entry.agentRank].bg
              )}
            >
              {entry.avatar ? (
                <img
                  src={entry.avatar}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span>{RANK_ICONS[entry.agentRank]}</span>
              )}
            </div>
            <span className="flex-1 truncate">
              {entry.agentName || entry.agentTag.split("#")[0]}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {formatValue(entry.value, type)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
