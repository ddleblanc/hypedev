"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ACHIEVEMENT_TIER_COLORS,
  type AchievementDefinition,
} from "@/lib/hype-network/achievements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Share2, X } from "lucide-react";
import confetti from "canvas-confetti";

interface AchievementUnlockModalProps {
  achievement: AchievementDefinition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementUnlockModal({
  achievement,
  isOpen,
  onClose,
}: AchievementUnlockModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Confetti effect on open
  useEffect(() => {
    if (isOpen && achievement) {
      // Delay confetti slightly for better timing with animation
      const timeout = setTimeout(() => {
        triggerConfetti(achievement.tier);
      }, 300);

      // Show details after animation
      const detailsTimeout = setTimeout(() => {
        setShowDetails(true);
      }, 800);

      return () => {
        clearTimeout(timeout);
        clearTimeout(detailsTimeout);
      };
    } else {
      setShowDetails(false);
    }
  }, [isOpen, achievement]);

  const triggerConfetti = useCallback((tier: AchievementDefinition["tier"]) => {
    const colors = {
      BRONZE: ["#cd7f32", "#b87333", "#8b4513"],
      SILVER: ["#c0c0c0", "#a8a8a8", "#808080"],
      GOLD: ["#ffd700", "#ffb700", "#ffaa00"],
      DIAMOND: ["#00ffff", "#00bfff", "#87ceeb"],
    };

    const tierColors = colors[tier];

    // Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: tierColors,
    });

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: tierColors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: tierColors,
      });
    }, 150);
  }, []);

  const handleShare = useCallback(() => {
    if (!achievement) return;

    const text = `I just unlocked the "${achievement.name}" achievement on HPX! +${achievement.xpReward} XP`;
    const url = window.location.origin;

    if (navigator.share) {
      navigator.share({
        title: "Achievement Unlocked!",
        text,
        url,
      });
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
    }
  }, [achievement]);

  if (!achievement) return null;

  const tierColors = ACHIEVEMENT_TIER_COLORS[achievement.tier];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-md overflow-hidden border-2",
          tierColors.border,
          "bg-gradient-to-b from-zinc-900 to-black"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="py-6 text-center">
          {/* Achievement Unlocked Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <span
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r",
                tierColors.gradient
              )}
            >
              <Sparkles className="h-4 w-4" />
              ACHIEVEMENT UNLOCKED!
            </span>
          </motion.div>

          {/* Badge Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="relative inline-flex items-center justify-center mb-6"
          >
            {/* Glow effect */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 20px 5px ${tierColors.glow}`,
                  `0 0 40px 10px ${tierColors.glow}`,
                  `0 0 20px 5px ${tierColors.glow}`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute inset-0 rounded-full",
                tierColors.bg
              )}
            />

            {/* Badge icon */}
            <div
              className={cn(
                "relative h-28 w-28 rounded-full flex items-center justify-center border-4",
                tierColors.bg,
                tierColors.border
              )}
            >
              <span className="text-5xl filter drop-shadow-lg">
                {getAchievementEmoji(achievement.icon)}
              </span>
            </div>

            {/* Tier badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className={cn(
                "absolute -bottom-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r",
                tierColors.gradient
              )}
            >
              {achievement.tier}
            </motion.div>
          </motion.div>

          {/* Achievement Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className={cn("text-2xl font-bold mb-2", tierColors.text)}>
              {achievement.name}
            </h2>
          </motion.div>

          {/* Details (shown after animation) */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <p className="text-zinc-400">{achievement.description}</p>

                {/* XP Reward */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
                    tierColors.bg,
                    tierColors.border
                  )}
                >
                  <Sparkles className={cn("h-5 w-5", tierColors.text)} />
                  <span className="text-xl font-bold">
                    +{achievement.xpReward} XP
                  </span>
                </motion.div>

                {/* Category */}
                <div className="text-sm text-zinc-500">
                  Category: {achievement.category}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    onClick={onClose}
                    className={cn("bg-gradient-to-r", tierColors.gradient)}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Toast-style notification for multiple achievements
 */
export function AchievementToast({
  achievements,
  onDismiss,
  onViewAll,
}: {
  achievements: AchievementDefinition[];
  onDismiss: () => void;
  onViewAll: () => void;
}) {
  if (achievements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 50, x: "-50%" }}
      className="fixed bottom-4 left-1/2 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 shadow-2xl"
    >
      <div className="flex -space-x-2">
        {achievements.slice(0, 3).map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center border-2 border-zinc-900",
              ACHIEVEMENT_TIER_COLORS[achievement.tier].bg
            )}
          >
            <span className="text-sm">
              {getAchievementEmoji(achievement.icon)}
            </span>
          </div>
        ))}
        {achievements.length > 3 && (
          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-zinc-800 border-2 border-zinc-900 text-xs font-bold">
            +{achievements.length - 3}
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="font-semibold text-sm">
          {achievements.length === 1
            ? "Achievement Unlocked!"
            : `${achievements.length} Achievements Unlocked!`}
        </div>
        <div className="text-xs text-zinc-500">
          +{achievements.reduce((sum, a) => sum + a.xpReward, 0)} XP earned
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={onViewAll}>
        View
      </Button>
      <button onClick={onDismiss} className="text-zinc-500 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/**
 * Map icon names to emoji
 */
function getAchievementEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    drop: "",
    seedling: "",
    handshake: "",
    star: "",
    crown: "",
    dollar: "",
    target: "",
    whale: "",
    diamond: "",
    flame: "",
    sword: "",
    robot: "",
    sparkle: "",
    dumbbell: "",
    trophy: "",
    medal: "",
    badge: "",
    "chart-up": "",
    trident: "",
    sparkles: "",
    rocket: "",
    tent: "",
    check: "",
    fist: "",
    fish: "",
  };

  return iconMap[icon] || "";
}
