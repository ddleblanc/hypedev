"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRankTier } from "@/lib/elympics";
import { trpc } from "@/lib/trpc/client";

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl?: string | null;
  };
  rating: number;
  peakRating?: number | null;
  wins: number;
  losses: number;
  winRate: string;
  streak: number;
  totalEarnings: number;
}

interface LeaderboardProps {
  gameId?: string;
  limit?: number;
  showEarnings?: boolean;
  className?: string;
  currentUserId?: string;
}

const RANK_ICONS = {
  1: <Crown className="w-5 h-5 text-yellow-400" />,
  2: <Medal className="w-5 h-5 text-gray-300" />,
  3: <Medal className="w-5 h-5 text-amber-600" />,
};

export function Leaderboard({
  gameId,
  limit = 50,
  showEarnings = true,
  className,
  currentUserId,
}: LeaderboardProps) {
  const { data, isLoading, error } = trpc.gaming.leaderboard.list.useQuery(
    { gameId, limit, offset: 0 },
    { placeholderData: (prev) => prev }
  );

  const entries: LeaderboardEntry[] = data?.leaderboard || [];

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">{error.message}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">No rankings yet</p>
        <p className="text-sm text-white/40 mt-1">
          Be the first to compete!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-white/40 border-b border-white/10">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Player</div>
        <div className="col-span-2 text-center">Rating</div>
        <div className="col-span-2 text-center">W/L</div>
        <div className="col-span-1 text-center">Streak</div>
        {showEarnings && <div className="col-span-2 text-right">Earnings</div>}
      </div>

      <ScrollArea className="h-[400px]">
        <div className="divide-y divide-white/5">
          {entries.map((entry, index) => {
            const tier = getRankTier(entry.rating);
            const isCurrentUser = entry.user.id === currentUserId;

            return (
              <motion.div
                key={`${entry.user.id}-${entry.rank}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  "grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/5 transition-colors",
                  isCurrentUser && "bg-[rgb(163,255,18)]/10"
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  {entry.rank <= 3 ? (
                    RANK_ICONS[entry.rank as 1 | 2 | 3]
                  ) : (
                    <span className="text-white/60 text-sm font-medium">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Player */}
                <div className="col-span-4 flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={entry.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-zinc-700 text-xs">
                      {entry.user.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrentUser ? "text-[rgb(163,255,18)]" : "text-white"
                      )}
                    >
                      {entry.user.displayName}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0"
                      style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                    >
                      {tier.tier}
                    </Badge>
                  </div>
                </div>

                {/* Rating */}
                <div className="col-span-2 text-center">
                  <span className="text-white font-medium">{entry.rating}</span>
                  {entry.peakRating && entry.peakRating > entry.rating && (
                    <span className="text-xs text-white/40 ml-1">
                      (peak: {entry.peakRating})
                    </span>
                  )}
                </div>

                {/* W/L */}
                <div className="col-span-2 text-center">
                  <span className="text-green-400">{entry.wins}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="text-red-400">{entry.losses}</span>
                  <span className="text-xs text-white/40 ml-1">
                    ({entry.winRate}%)
                  </span>
                </div>

                {/* Streak */}
                <div className="col-span-1 flex items-center justify-center gap-1">
                  {entry.streak > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-sm">
                        {entry.streak}
                      </span>
                    </>
                  ) : entry.streak < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-red-400 text-sm">
                        {Math.abs(entry.streak)}
                      </span>
                    </>
                  ) : (
                    <Minus className="w-3 h-3 text-white/40" />
                  )}
                </div>

                {/* Earnings */}
                {showEarnings && (
                  <div className="col-span-2 text-right">
                    <span className="text-[rgb(163,255,18)] font-medium">
                      {entry.totalEarnings.toFixed(2)} ETH
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
