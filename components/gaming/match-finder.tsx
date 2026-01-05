"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  X,
  Loader2,
  Gamepad2,
  Swords,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveAccount } from "thirdweb/react";
import { trpc } from "@/lib/trpc/client";

interface Game {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  description?: string;
}

interface Match {
  id: string;
  status: string;
  player1: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  player2?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  game: Game;
}

interface MatchFinderProps {
  game: Game;
  onMatchFound?: (match: Match) => void;
  className?: string;
}

type MatchStatus = "idle" | "searching" | "found" | "connecting" | "error";

export function MatchFinder({
  game,
  onMatchFound,
  className,
}: MatchFinderProps) {
  const account = useActiveAccount();
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [matchId, setMatchId] = useState<string | null>(null);

  // tRPC mutations
  const findMatchMutation = trpc.gaming.matches.find.useMutation();
  const cancelMatchMutation = trpc.gaming.matches.cancel.useMutation();

  // Increment search time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "searching") {
      interval = setInterval(() => {
        setSearchTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // tRPC query for polling match status
  const matchQuery = trpc.gaming.matches.byId.useQuery(
    { id: matchId || "" },
    { enabled: status === "searching" && !!matchId, refetchInterval: 2000 }
  );

  // Poll for match when searching
  useEffect(() => {
    if (status !== "searching" || !matchId) return;

    if (matchQuery.data) {
      const matchData = matchQuery.data;
      if (matchData.status === "IN_PROGRESS" && matchData.player2) {
        // Match found!
        setMatch(matchData as any);
        setStatus("found");

        if (onMatchFound) {
          onMatchFound(matchData as any);
        }
      }
    }
  }, [status, matchId, matchQuery.data, onMatchFound]);

  const startSearching = useCallback(async () => {
    if (!account?.address) {
      setError("Please connect your wallet");
      setStatus("error");
      return;
    }

    setStatus("searching");
    setSearchTime(0);
    setError(null);

    try {
      const data = await findMatchMutation.mutateAsync({
        gameId: game.id,
        walletAddress: account.address,
        matchType: "casual",
      });

      if (data.status === "matched") {
        // Immediately matched
        setMatch(data.match as any);
        setStatus("found");
        if (onMatchFound) {
          onMatchFound(data.match as any);
        }
      } else {
        // Waiting for opponent
        setMatchId((data.match as any).id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start matchmaking");
      setStatus("error");
    }
  }, [account, game.id, onMatchFound, findMatchMutation]);

  const cancelSearch = useCallback(async () => {
    if (matchId && account?.address) {
      try {
        await cancelMatchMutation.mutateAsync({
          matchId,
          walletAddress: account.address,
        });
      } catch (err) {
        console.error("Cancel error:", err);
      }
    }
    setStatus("idle");
    setMatchId(null);
    setSearchTime(0);
  }, [matchId, account, cancelMatchMutation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "p-6 rounded-xl border border-white/10 bg-zinc-900/50",
        className
      )}
    >
      {/* Game Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
          <Gamepad2 className="w-8 h-8 text-[rgb(163,255,18)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{game.name}</h3>
          <Badge variant="secondary">1v1 Match</Badge>
        </div>
      </div>

      {/* Status Display */}
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <Swords className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-6">Ready to find an opponent?</p>
            <Button
              onClick={startSearching}
              disabled={!account}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]"
            >
              <Search className="w-4 h-4 mr-2" />
              Find Match
            </Button>
            {!account && (
              <p className="text-xs text-white/40 mt-2">
                Connect wallet to play
              </p>
            )}
          </motion.div>
        )}

        {status === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-[rgb(163,255,18)] border-t-transparent mx-auto mb-4"
            />
            <p className="text-white font-medium mb-1">Searching for opponent...</p>
            <p className="text-2xl font-bold text-[rgb(163,255,18)] mb-4">
              {formatTime(searchTime)}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/40 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Estimating wait time...
            </div>
            <Button
              variant="outline"
              onClick={cancelSearch}
              className="border-white/20 text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </motion.div>
        )}

        {status === "found" && match && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-16 h-16 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-8 h-8 text-black" />
            </motion.div>
            <p className="text-white font-medium mb-4">Match Found!</p>

            {/* VS Display */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto mb-2">
                  <AvatarImage src={match.player1.avatarUrl} />
                  <AvatarFallback className="bg-zinc-700 text-lg">
                    {match.player1.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-sm">{match.player1.displayName}</p>
              </div>

              <div className="text-2xl font-black text-white/60">VS</div>

              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto mb-2">
                  <AvatarImage src={match.player2?.avatarUrl} />
                  <AvatarFallback className="bg-zinc-700 text-lg">
                    {match.player2?.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-sm">
                  {match.player2?.displayName}
                </p>
              </div>
            </div>

            <Button className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]">
              Start Match
            </Button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-medium mb-2">Matchmaking Failed</p>
            <p className="text-sm text-red-400 mb-6">{error}</p>
            <Button
              onClick={() => setStatus("idle")}
              variant="outline"
              className="border-white/20 text-white"
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
