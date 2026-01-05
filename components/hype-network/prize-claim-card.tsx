"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Check, Coins, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

interface PrizeClaimCardProps {
  participation: {
    id: string;
    prizeAmount: number | string | null;
    prizeNftId: string | null;
    prizeClaimed: boolean;
    finalRank: number | null;
    challenge: {
      id: string;
      name: string;
      bannerImage?: string | null;
    };
  };
  onClaimed?: () => void;
}

const RANK_MEDALS: Record<number, { emoji: string; color: string }> = {
  1: { emoji: "🥇", color: "text-amber-400" },
  2: { emoji: "🥈", color: "text-zinc-300" },
  3: { emoji: "🥉", color: "text-orange-400" },
};

export function PrizeClaimCard({ participation, onClaimed }: PrizeClaimCardProps) {
  const utils = trpc.useUtils();

  const claimMutation = trpc.hypeNetwork.challenges.claimPrize.useMutation({
    onSuccess: () => {
      utils.hypeNetwork.challenges.myPrizes.invalidate();
      onClaimed?.();
    },
  });

  const handleClaim = () => {
    claimMutation.mutate({
      participantId: participation.id,
    });
  };

  const prizeAmount = participation.prizeAmount
    ? Number(participation.prizeAmount)
    : 0;
  const medal = participation.finalRank
    ? RANK_MEDALS[participation.finalRank]
    : null;

  // Already claimed state
  if (participation.prizeClaimed) {
    return (
      <Card className="bg-white/5 border-white/10 opacity-60">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {participation.challenge.name}
            </p>
            <p className="text-white/60 text-sm">Prize claimed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-[rgb(163,255,18)]/50 transition-colors overflow-hidden">
        {/* Banner if available */}
        {participation.challenge.bannerImage && (
          <div className="h-24 w-full overflow-hidden">
            <img
              src={participation.challenge.bannerImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Trophy and info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/5 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-[rgb(163,255,18)]" />
                </div>
                {medal && (
                  <span className="absolute -top-1 -right-1 text-xl">
                    {medal.emoji}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">
                  {participation.challenge.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {participation.finalRank && (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        medal?.color || "text-zinc-400"
                      )}
                    >
                      Rank #{participation.finalRank}
                    </span>
                  )}
                </div>

                {/* Prize details */}
                <div className="flex items-center gap-3 mt-2">
                  {prizeAmount > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">
                        {prizeAmount.toFixed(4)} ETH
                      </span>
                    </div>
                  )}
                  {participation.prizeNftId && (
                    <div className="flex items-center gap-1 text-sm">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-medium">
                        NFT Prize
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Claim button */}
            <Button
              onClick={handleClaim}
              disabled={claimMutation.isPending}
              className={cn(
                "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]",
                "font-semibold px-6 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {claimMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Prize
                </>
              )}
            </Button>
          </div>

          {/* Error state */}
          <AnimatePresence>
            {claimMutation.error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm mt-3"
              >
                {claimMutation.error.message}
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Skeleton loader for prize claim cards
 */
export function PrizeClaimCardSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-zinc-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-zinc-800 rounded w-40 animate-pulse" />
            <div className="h-4 bg-zinc-800 rounded w-24 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-zinc-800 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no prizes are available
 */
export function NoPrizesState() {
  return (
    <div className="text-center py-12">
      <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
        <Trophy className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No prizes to claim</h3>
      <p className="text-zinc-500 text-sm max-w-sm mx-auto">
        Win challenges to earn prizes! Check out active challenges and compete
        with other agents.
      </p>
    </div>
  );
}
