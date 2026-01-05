"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow, isPast, isFuture } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChallengeType, ChallengeStatus } from "@prisma/client";
import {
  Target,
  TrendingUp,
  DollarSign,
  Flame,
  Waves,
  Fish,
  Calendar,
  Users,
  Clock,
  Trophy,
  Sparkles,
  CheckCircle,
} from "lucide-react";

// Challenge type icons
const CHALLENGE_ICONS: Record<ChallengeType, React.ReactNode> = {
  RACE_TO_TARGET: <Target className="h-5 w-5" />,
  MOST_REFERRALS: <TrendingUp className="h-5 w-5" />,
  MOST_VOLUME: <DollarSign className="h-5 w-5" />,
  STREAK_MASTER: <Flame className="h-5 w-5" />,
  VIRAL_WAVE: <Waves className="h-5 w-5" />,
  WHALE_HUNTER: <Fish className="h-5 w-5" />,
  CONSISTENCY: <Calendar className="h-5 w-5" />,
};

const CHALLENGE_COLORS: Record<ChallengeType, string> = {
  RACE_TO_TARGET: "from-red-500 to-orange-500",
  MOST_REFERRALS: "from-blue-500 to-cyan-500",
  MOST_VOLUME: "from-green-500 to-emerald-500",
  STREAK_MASTER: "from-orange-500 to-yellow-500",
  VIRAL_WAVE: "from-purple-500 to-pink-500",
  WHALE_HUNTER: "from-indigo-500 to-blue-500",
  CONSISTENCY: "from-teal-500 to-green-500",
};

const CHALLENGE_TYPE_NAMES: Record<ChallengeType, string> = {
  RACE_TO_TARGET: "Race to Target",
  MOST_REFERRALS: "Most Referrals",
  MOST_VOLUME: "Most Volume",
  STREAK_MASTER: "Streak Master",
  VIRAL_WAVE: "Viral Wave",
  WHALE_HUNTER: "Whale Hunter",
  CONSISTENCY: "Consistency King",
};

const CHALLENGE_METRICS: Record<ChallengeType, string> = {
  RACE_TO_TARGET: "referrals",
  MOST_REFERRALS: "referrals",
  MOST_VOLUME: "ETH volume",
  STREAK_MASTER: "day streak",
  VIRAL_WAVE: "clicks",
  WHALE_HUNTER: "ETH (single sale)",
  CONSISTENCY: "active days",
};

interface ChallengeCardProps {
  challenge: {
    id: string;
    name: string;
    description?: string | null;
    type: ChallengeType;
    targetValue: number;
    startAt: Date;
    endAt: Date;
    prizePool?: number | string | null;
    xpReward: number;
    participantCount: number;
    status: ChallengeStatus;
  };
  currentParticipant?: {
    currentRank: number | null;
    currentValue: number;
    percentComplete: number;
  } | null;
  onJoin?: () => void;
  onClick?: () => void;
  isJoining?: boolean;
}

export function ChallengeCard({
  challenge,
  currentParticipant,
  onJoin,
  onClick,
  isJoining,
}: ChallengeCardProps) {
  const isJoined = !!currentParticipant;
  const isActive = challenge.status === "ACTIVE";
  const isUpcoming = challenge.status === "UPCOMING";
  const isCompleted = challenge.status === "COMPLETED";

  const startDate = new Date(challenge.startAt);
  const endDate = new Date(challenge.endAt);

  const timeText = isActive
    ? `${formatDistanceToNow(endDate)} left`
    : isUpcoming
      ? `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`
      : "Ended";

  const prizePoolValue =
    typeof challenge.prizePool === "string"
      ? parseFloat(challenge.prizePool)
      : challenge.prizePool || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "rounded-xl border overflow-hidden bg-black/40 backdrop-blur-sm cursor-pointer transition-colors",
        isActive && "border-orange-500/50 hover:border-orange-500",
        isUpcoming && "border-blue-500/30 hover:border-blue-500/50",
        isCompleted && "border-zinc-700/50 hover:border-zinc-600"
      )}
    >
      {/* Header with gradient */}
      <div
        className={cn(
          "p-4 bg-gradient-to-r",
          CHALLENGE_COLORS[challenge.type],
          isCompleted && "opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            {CHALLENGE_ICONS[challenge.type]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate">{challenge.name}</h3>
            <div className="text-sm text-white/80">
              {CHALLENGE_TYPE_NAMES[challenge.type]}
            </div>
          </div>
          <div
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm",
              isActive && "bg-green-500/20 text-green-300",
              isUpcoming && "bg-blue-500/20 text-blue-300",
              isCompleted && "bg-zinc-500/20 text-zinc-300"
            )}
          >
            {challenge.status}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        {challenge.description && (
          <p className="text-sm text-zinc-400 line-clamp-2">
            {challenge.description}
          </p>
        )}

        {/* Target */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            Target
          </span>
          <span className="font-medium">
            {challenge.type === "MOST_VOLUME" ||
            challenge.type === "WHALE_HUNTER"
              ? `${(challenge.targetValue / 1000).toFixed(3)} ETH`
              : `${challenge.targetValue.toLocaleString()} ${CHALLENGE_METRICS[challenge.type]}`}
          </span>
        </div>

        {/* Prizes */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            Prizes
          </span>
          <div className="flex items-center gap-2">
            {prizePoolValue > 0 && (
              <span className="text-amber-400 font-bold">
                {prizePoolValue.toFixed(2)} ETH
              </span>
            )}
            <span className="text-blue-400 flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" />+{challenge.xpReward} XP
            </span>
          </div>
        </div>

        {/* Participants & Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {challenge.participantCount} agent
            {challenge.participantCount !== 1 ? "s" : ""}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              isActive && "text-orange-400",
              isUpcoming && "text-blue-400",
              isCompleted && "text-zinc-500"
            )}
          >
            <Clock className="h-4 w-4" />
            {timeText}
          </span>
        </div>

        {/* Current participant progress */}
        {isJoined && currentParticipant && (
          <div className="bg-zinc-900/70 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-400">Your progress</span>
              <span className="font-bold text-primary">
                #{currentParticipant.currentRank || "-"}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, currentParticipant.percentComplete)}%`,
                }}
                className={cn(
                  "h-full rounded-full",
                  currentParticipant.percentComplete >= 100
                    ? "bg-green-500"
                    : "bg-primary"
                )}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>{currentParticipant.currentValue.toLocaleString()}</span>
              <span>
                {challenge.type === "MOST_VOLUME" ||
                challenge.type === "WHALE_HUNTER"
                  ? `${(challenge.targetValue / 1000).toFixed(3)} ETH`
                  : challenge.targetValue.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Action */}
        {!isJoined && (isActive || isUpcoming) && onJoin && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            disabled={isJoining}
            className="w-full mt-2"
            variant={isActive ? "default" : "outline"}
          >
            {isJoining ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Joining...
              </span>
            ) : (
              "Join Challenge"
            )}
          </Button>
        )}

        {isJoined && !isCompleted && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-400 mt-2">
            <CheckCircle className="h-4 w-4" />
            Participating
          </div>
        )}
      </div>
    </motion.div>
  );
}
