"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AgentRank } from "@prisma/client";
import {
  RANK_DISPLAY_NAMES,
  RANK_COLORS,
  RANK_ICONS,
  RANK_MULTIPLIERS,
  RANK_PERKS,
  formatXp,
} from "@/lib/hype-network";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Gift, ArrowRight } from "lucide-react";

interface RankUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousRank: AgentRank;
  newRank: AgentRank;
  totalXp: number;
  xpGained?: number;
}

// Confetti particle component
function ConfettiParticle({
  index,
  color,
}: {
  index: number;
  color: string;
}) {
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 0.5;
  const randomDuration = 2 + Math.random() * 2;
  const randomRotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{
        left: `${randomX}%`,
        backgroundColor: color,
        top: -10,
      }}
      initial={{
        y: 0,
        x: 0,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        y: [0, 400],
        x: [0, (Math.random() - 0.5) * 100],
        rotate: [0, randomRotation],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        ease: "easeOut",
      }}
    />
  );
}

// Confetti burst component
function ConfettiBurst({ isActive }: { isActive: boolean }) {
  const colors = [
    "#FFD700", // Gold
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#A855F7", // Purple
    "#3B82F6", // Blue
    "#22C55E", // Green
    "#F472B6", // Pink
    "#FB923C", // Orange
  ];

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          index={i}
          color={colors[i % colors.length]}
        />
      ))}
    </div>
  );
}

export function RankUpModal({
  isOpen,
  onClose,
  previousRank,
  newRank,
  totalXp,
  xpGained,
}: RankUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  const prevColors = RANK_COLORS[previousRank];
  const newColors = RANK_COLORS[newRank];
  const prevMultiplier = RANK_MULTIPLIERS[previousRank];
  const newMultiplier = RANK_MULTIPLIERS[newRank];
  const newPerks = RANK_PERKS[newRank];

  // Reset and trigger animations when modal opens
  useEffect(() => {
    if (isOpen) {
      setAnimationStep(0);
      setShowConfetti(false);

      // Animation sequence
      const timers = [
        setTimeout(() => setAnimationStep(1), 300), // Show old rank
        setTimeout(() => setAnimationStep(2), 1000), // Start transition
        setTimeout(() => {
          setAnimationStep(3); // Show new rank
          setShowConfetti(true);
        }, 1500),
        setTimeout(() => setAnimationStep(4), 2000), // Show details
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setShowConfetti(false);
    setAnimationStep(0);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-black/95 border-zinc-800 overflow-hidden">
        <ConfettiBurst isActive={showConfetti} />

        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white">
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Sparkles className="h-6 w-6 text-amber-400" />
              Rank Up!
              <Sparkles className="h-6 w-6 text-amber-400" />
            </motion.span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-8">
          {/* Rank Transition */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Previous Rank */}
            <AnimatePresence>
              {animationStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: -50 }}
                  animate={{
                    opacity: animationStep >= 3 ? 0.4 : 1,
                    scale: animationStep >= 3 ? 0.8 : 1,
                    x: 0,
                  }}
                  className="text-center"
                >
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto",
                      prevColors.bg
                    )}
                  >
                    {RANK_ICONS[previousRank]}
                  </div>
                  <span
                    className={cn("text-sm font-medium", prevColors.text)}
                  >
                    {RANK_DISPLAY_NAMES[previousRank]}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arrow */}
            <AnimatePresence>
              {animationStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center"
                >
                  <ArrowRight className="h-8 w-8 text-amber-400" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Rank */}
            <AnimatePresence>
              {animationStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100 }}
                  className="text-center"
                >
                  <motion.div
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-2 mx-auto",
                      newColors.bg,
                      "ring-4 ring-white/20"
                    )}
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(255,255,255,0)",
                        "0 0 30px 10px rgba(255,215,0,0.3)",
                        "0 0 0 0 rgba(255,255,255,0)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {RANK_ICONS[newRank]}
                  </motion.div>
                  <span
                    className={cn("text-lg font-bold", newColors.text)}
                  >
                    {RANK_DISPLAY_NAMES[newRank]}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <AnimatePresence>
            {animationStep >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Multiplier Upgrade */}
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Commission Multiplier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 line-through">
                        {prevMultiplier.toFixed(1)}x
                      </span>
                      <ArrowRight className="h-3 w-3 text-zinc-600" />
                      <motion.span
                        className={cn("text-lg font-bold", newColors.text)}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        {newMultiplier.toFixed(1)}x
                      </motion.span>
                    </div>
                  </div>
                </div>

                {/* XP Info */}
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Total XP</span>
                    <span className="text-white font-semibold">
                      {formatXp(totalXp)} XP
                    </span>
                  </div>
                  {xpGained && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-zinc-400">XP Gained</span>
                      <span className="text-green-400 font-semibold">
                        +{formatXp(xpGained)} XP
                      </span>
                    </div>
                  )}
                </div>

                {/* New Perks */}
                {newPerks.length > 0 && (
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-zinc-400 mb-3">
                      <Gift className="h-4 w-4" />
                      <span className="text-sm">New Perks Unlocked</span>
                    </div>
                    <div className="space-y-2">
                      {newPerks.map((perk, index) => (
                        <motion.div
                          key={perk}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-green-400">✓</span>
                          <span className="text-zinc-300">{perk}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Close Button */}
        <AnimatePresence>
          {animationStep >= 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleClose}
                className={cn(
                  "w-full",
                  newColors.bg,
                  "hover:opacity-90 text-white font-semibold"
                )}
              >
                Continue Grinding
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing rank-up modal state
export function useRankUpModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    previousRank: AgentRank;
    newRank: AgentRank;
    totalXp: number;
    xpGained?: number;
  }>({
    isOpen: false,
    previousRank: "ROOKIE",
    newRank: "ROOKIE",
    totalXp: 0,
  });

  const showRankUp = useCallback(
    (data: {
      previousRank: AgentRank;
      newRank: AgentRank;
      totalXp: number;
      xpGained?: number;
    }) => {
      setModalState({
        isOpen: true,
        ...data,
      });
    },
    []
  );

  const hideRankUp = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    showRankUp,
    hideRankUp,
  };
}
