"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  seed?: number;
}

interface BracketMatch {
  id: string;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  score1: number | null;
  score2: number | null;
  status: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
}

interface TournamentBracketProps {
  tournament: {
    id: string;
    name: string;
    format: string;
    status: string;
  };
  brackets: Record<number, BracketMatch[]>;
  participants?: Player[];
  totalRounds: number;
  className?: string;
}

function MatchCard({
  match,
  roundIndex,
  matchIndex,
}: {
  match: BracketMatch;
  roundIndex: number;
  matchIndex: number;
}) {
  const isComplete = match.status === "completed";
  const isInProgress = match.status === "in_progress";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: roundIndex * 0.1 + matchIndex * 0.05 }}
      className={cn(
        "relative bg-zinc-900/50 border rounded-lg p-3 w-48 transition-all",
        isInProgress && "border-[rgb(163,255,18)] ring-1 ring-[rgb(163,255,18)]/30",
        isComplete && "border-white/20",
        !isComplete && !isInProgress && "border-white/10"
      )}
    >
      {/* Match Number */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs text-white/60 border border-white/10">
        {match.matchNumber}
      </div>

      {/* Status Badge */}
      {isInProgress && (
        <Badge className="absolute -top-2 right-2 bg-[rgb(163,255,18)] text-black text-[10px]">
          LIVE
        </Badge>
      )}

      {/* Players */}
      <div className="space-y-2">
        <PlayerSlot
          player={match.player1}
          score={match.score1}
          isWinner={match.winner?.id === match.player1?.id}
          showScore={isComplete}
        />
        <div className="border-t border-white/10" />
        <PlayerSlot
          player={match.player2}
          score={match.score2}
          isWinner={match.winner?.id === match.player2?.id}
          showScore={isComplete}
        />
      </div>

      {/* Time */}
      {match.scheduledAt && !isComplete && (
        <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
          <Clock className="w-3 h-3" />
          {new Date(match.scheduledAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </motion.div>
  );
}

function PlayerSlot({
  player,
  score,
  isWinner,
  showScore,
}: {
  player: Player | null;
  score: number | null;
  isWinner: boolean;
  showScore: boolean;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-2 h-8">
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
          <User className="w-3 h-3 text-white/20" />
        </div>
        <span className="text-sm text-white/30 italic">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-8 transition-colors",
        isWinner && "bg-[rgb(163,255,18)]/10 -mx-2 px-2 rounded"
      )}
    >
      <Avatar className="w-6 h-6">
        <AvatarImage src={player.avatarUrl || undefined} />
        <AvatarFallback className="bg-zinc-700 text-xs">
          {player.displayName?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "text-sm truncate flex-1",
          isWinner ? "text-[rgb(163,255,18)] font-medium" : "text-white"
        )}
      >
        {player.displayName}
      </span>
      {showScore && score !== null && (
        <span
          className={cn(
            "text-sm font-bold",
            isWinner ? "text-[rgb(163,255,18)]" : "text-white/60"
          )}
        >
          {score}
        </span>
      )}
      {isWinner && <Trophy className="w-3 h-3 text-[rgb(163,255,18)]" />}
    </div>
  );
}

export function TournamentBracket({
  tournament,
  brackets,
  totalRounds,
  className,
}: TournamentBracketProps) {
  const rounds = useMemo(() => {
    return Object.entries(brackets)
      .map(([round, matches]) => ({
        round: parseInt(round),
        matches,
      }))
      .sort((a, b) => a.round - b.round);
  }, [brackets]);

  const getRoundName = (round: number, total: number) => {
    if (round === total) return "Finals";
    if (round === total - 1) return "Semifinals";
    if (round === total - 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  if (rounds.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">Brackets not yet generated</p>
        <p className="text-sm text-white/40 mt-1">
          Brackets will appear once the tournament starts
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto pb-4", className)}>
      <div className="flex gap-8 min-w-max p-4">
        {rounds.map(({ round, matches }) => (
          <div key={round} className="flex flex-col">
            {/* Round Header */}
            <div className="text-center mb-4">
              <h4 className="text-sm font-medium text-white">
                {getRoundName(round, totalRounds)}
              </h4>
              <p className="text-xs text-white/40">{matches.length} matches</p>
            </div>

            {/* Matches */}
            <div
              className="flex flex-col justify-around flex-1 gap-4"
              style={{
                minHeight: `${Math.pow(2, totalRounds - round) * 80}px`,
              }}
            >
              {matches.map((match, index) => (
                <div
                  key={match.id}
                  className="flex items-center"
                  style={{
                    marginTop:
                      round > 1 ? `${Math.pow(2, round - 1) * 40}px` : 0,
                    marginBottom:
                      round > 1 ? `${Math.pow(2, round - 1) * 40}px` : 0,
                  }}
                >
                  <MatchCard
                    match={match}
                    roundIndex={round}
                    matchIndex={index}
                  />

                  {/* Connector lines */}
                  {round < totalRounds && (
                    <div className="relative w-8 h-full">
                      <div className="absolute top-1/2 left-0 w-4 h-px bg-white/20" />
                      {index % 2 === 0 ? (
                        <div className="absolute top-1/2 right-0 w-px h-full bg-white/20" />
                      ) : (
                        <div className="absolute bottom-1/2 right-0 w-px h-full bg-white/20" />
                      )}
                      <div className="absolute top-1/2 left-4 w-4 h-px bg-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
