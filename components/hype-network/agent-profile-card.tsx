"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AgentRank } from "@prisma/client";
import {
  RANK_DISPLAY_NAMES,
  RANK_COLORS,
  RANK_ICONS,
  formatXp,
  formatEarnings,
  getXpToNextRank,
  getProgressMessage,
} from "@/lib/hype-network";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Trophy, Zap } from "lucide-react";

interface AgentProfileCardProps {
  agent: {
    agentTag: string;
    agentName: string | null;
    avatar: string | null;
    totalXp: number;
    currentRank: AgentRank;
    rankProgress: number;
    totalReferrals: number;
    totalEarnings: string;
    currentStreak: number;
    longestStreak: number;
    commissionMultiplier: number;
    isVerified: boolean;
    user?: {
      username: string | null;
      profilePicture: string | null;
    };
  };
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

export function AgentProfileCard({
  agent,
  showStats = true,
  compact = false,
  className,
}: AgentProfileCardProps) {
  const rankColors = RANK_COLORS[agent.currentRank];
  const xpToNext = getXpToNextRank(agent.totalXp, agent.currentRank);
  const progressMessage = getProgressMessage(agent.rankProgress, agent.currentRank);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3",
          rankColors.border,
          "bg-black/40 backdrop-blur-sm",
          className
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "relative h-10 w-10 rounded-full overflow-hidden ring-2",
            rankColors.border
          )}
        >
          {agent.avatar || agent.user?.profilePicture ? (
            <img
              src={agent.avatar || agent.user?.profilePicture || ""}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "h-full w-full flex items-center justify-center text-lg",
                rankColors.bg
              )}
            >
              {RANK_ICONS[agent.currentRank]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">
              {agent.agentName || agent.agentTag.split("#")[0]}
            </span>
            {agent.isVerified && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                ✓
              </Badge>
            )}
          </div>
          <div className="text-xs text-zinc-500">{agent.agentTag}</div>
        </div>

        {/* Rank Badge */}
        <div
          className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            rankColors.bg,
            rankColors.text
          )}
        >
          {RANK_ICONS[agent.currentRank]} {RANK_DISPLAY_NAMES[agent.currentRank]}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        rankColors.border,
        "bg-black/40 backdrop-blur-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "relative h-16 w-16 rounded-full overflow-hidden",
            "ring-2",
            rankColors.border
          )}
        >
          {agent.avatar || agent.user?.profilePicture ? (
            <img
              src={agent.avatar || agent.user?.profilePicture || ""}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "h-full w-full flex items-center justify-center text-2xl",
                rankColors.bg
              )}
            >
              {RANK_ICONS[agent.currentRank]}
            </div>
          )}
          {agent.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
              <svg
                className="h-3 w-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg">
              {agent.agentName || agent.agentTag.split("#")[0]}
            </span>
            {agent.isVerified && (
              <span className="text-blue-400 text-xs">✓ Verified</span>
            )}
          </div>
          <div className="text-sm text-zinc-400">{agent.agentTag}</div>
        </div>

        {/* Rank Badge */}
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            rankColors.bg,
            rankColors.text,
            "font-semibold text-sm"
          )}
        >
          {RANK_ICONS[agent.currentRank]} {RANK_DISPLAY_NAMES[agent.currentRank]}
        </div>
      </div>

      {/* XP Progress */}
      <div className="mt-5">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-zinc-400 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5" />
            {formatXp(agent.totalXp)} XP
          </span>
          {xpToNext !== null && (
            <span className="text-zinc-500">
              {formatXp(xpToNext)} to next rank
            </span>
          )}
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full", rankColors.bg)}
            initial={{ width: 0 }}
            animate={{ width: `${agent.rankProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1 text-xs text-zinc-500">{progressMessage}</div>
      </div>

      {/* Multiplier */}
      <div className="mt-4 flex items-center justify-between text-sm bg-zinc-900/50 rounded-lg p-3">
        <span className="text-zinc-400 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Commission Multiplier
        </span>
        <span className={cn("font-bold text-lg", rankColors.text)}>
          {agent.commissionMultiplier.toFixed(1)}x
        </span>
      </div>

      {/* Stats Grid */}
      {showStats && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatBox
            icon={<Trophy className="h-4 w-4 text-amber-400" />}
            label="Referrals"
            value={agent.totalReferrals}
          />
          <StatBox
            icon={<span className="text-sm">Ξ</span>}
            label="Earned"
            value={formatEarnings(agent.totalEarnings)}
          />
          <StatBox
            icon={<Flame className="h-4 w-4 text-orange-400" />}
            label="Streak"
            value={agent.currentStreak}
            suffix={agent.currentStreak > 0 ? "🔥" : ""}
          />
          <StatBox
            icon={<TrendingUp className="h-4 w-4 text-green-400" />}
            label="Best Streak"
            value={agent.longestStreak}
          />
        </div>
      )}
    </div>
  );
}

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
}

function StatBox({ icon, label, value, suffix = "" }: StatBoxProps) {
  return (
    <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
      </div>
      <div className="text-lg font-bold text-white">
        {value}
        {suffix}
      </div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
