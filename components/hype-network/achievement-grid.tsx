"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { AchievementTier } from "@prisma/client";
import {
  ACHIEVEMENT_TIER_COLORS,
  TIER_ORDER,
  type AchievementDefinition,
} from "@/lib/hype-network/achievements";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock, CheckCircle2, Award, Sparkles } from "lucide-react";

interface AchievementWithProgress extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
}

type CategoryFilter = "all" | AchievementDefinition["category"];

const categoryLabels: Record<AchievementDefinition["category"], string> = {
  REFERRAL: "Referrals",
  VOLUME: "Volume",
  STREAK: "Streaks",
  CHALLENGE: "Challenges",
  SOCIAL: "Social",
  RANK: "Ranks",
  SPECIAL: "Special",
};

interface AchievementGridProps {
  agentTag?: string;
  className?: string;
}

export function AchievementGrid({ agentTag, className }: AchievementGridProps) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [hoveredAchievement, setHoveredAchievement] =
    useState<AchievementWithProgress | null>(null);

  // Use different query based on whether viewing own or another agent's achievements
  const { data: achievements, isLoading } = agentTag
    ? trpc.hypeNetwork.achievements.byAgent.useQuery({ agentTag })
    : trpc.hypeNetwork.achievements.mine.useQuery();

  const { data: stats } = agentTag
    ? { data: null }
    : trpc.hypeNetwork.achievements.myStats.useQuery();

  const filteredAchievements = (achievements as AchievementWithProgress[])?.filter(
    (a: AchievementWithProgress) => category === "all" || a.category === category
  );

  // Group by tier for display
  const tierGroups = filteredAchievements?.reduce(
    (acc, achievement) => {
      const tier = achievement.tier;
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(achievement);
      return acc;
    },
    {} as Record<AchievementTier, AchievementWithProgress[]>
  );

  // Sort tiers by order
  const sortedTiers = Object.entries(tierGroups || {}).sort(
    ([a], [b]) =>
      TIER_ORDER[b as AchievementTier] - TIER_ORDER[a as AchievementTier]
  ) as [AchievementTier, AchievementWithProgress[]][];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Header */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-black/30 rounded-lg p-3 border border-zinc-800">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-zinc-500">Total Unlocked</div>
          </div>
          <div
            className={cn(
              "rounded-lg p-3 border",
              ACHIEVEMENT_TIER_COLORS.BRONZE.bg,
              ACHIEVEMENT_TIER_COLORS.BRONZE.border
            )}
          >
            <div className="text-2xl font-bold">{stats.tierCounts.BRONZE}</div>
            <div className="text-xs text-amber-400/70">Bronze</div>
          </div>
          <div
            className={cn(
              "rounded-lg p-3 border",
              ACHIEVEMENT_TIER_COLORS.SILVER.bg,
              ACHIEVEMENT_TIER_COLORS.SILVER.border
            )}
          >
            <div className="text-2xl font-bold">{stats.tierCounts.SILVER}</div>
            <div className="text-xs text-zinc-300/70">Silver</div>
          </div>
          <div
            className={cn(
              "rounded-lg p-3 border",
              ACHIEVEMENT_TIER_COLORS.GOLD.bg,
              ACHIEVEMENT_TIER_COLORS.GOLD.border
            )}
          >
            <div className="text-2xl font-bold">{stats.tierCounts.GOLD}</div>
            <div className="text-xs text-yellow-400/70">Gold</div>
          </div>
          <div
            className={cn(
              "rounded-lg p-3 border",
              ACHIEVEMENT_TIER_COLORS.DIAMOND.bg,
              ACHIEVEMENT_TIER_COLORS.DIAMOND.border
            )}
          >
            <div className="text-2xl font-bold">{stats.tierCounts.DIAMOND}</div>
            <div className="text-xs text-cyan-300/70">Diamond</div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <Tabs
        value={category}
        onValueChange={(v) => setCategory(v as CategoryFilter)}
      >
        <TabsList className="flex flex-wrap h-auto gap-1 bg-black/30 p-1">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          {(Object.keys(categoryLabels) as AchievementDefinition["category"][]).map(
            (cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {categoryLabels[cat]}
              </TabsTrigger>
            )
          )}
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      )}

      {/* Achievement Tiers */}
      <AnimatePresence mode="popLayout">
        {sortedTiers.map(([tier, tierAchievements]) => (
          <motion.div
            key={tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {/* Tier Header */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r",
                  ACHIEVEMENT_TIER_COLORS[tier].gradient
                )}
              >
                {tier}
              </div>
              <div className="text-sm text-zinc-500">
                {tierAchievements.filter((a) => a.unlocked).length} /{" "}
                {tierAchievements.length}
              </div>
            </div>

            {/* Achievement Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              <TooltipProvider delayDuration={200}>
                {tierAchievements.map((achievement) => (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        onHoverStart={() => setHoveredAchievement(achievement)}
                        onHoverEnd={() => setHoveredAchievement(null)}
                        className={cn(
                          "aspect-square rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer border transition-all",
                          achievement.unlocked
                            ? cn(
                                ACHIEVEMENT_TIER_COLORS[tier].bg,
                                ACHIEVEMENT_TIER_COLORS[tier].border,
                                "shadow-lg",
                                ACHIEVEMENT_TIER_COLORS[tier].glow
                              )
                            : "bg-zinc-900/50 border-zinc-800 opacity-60 hover:opacity-80"
                        )}
                      >
                        {/* Icon */}
                        <div className="text-3xl mb-1">
                          {achievement.unlocked ? (
                            <span className="filter drop-shadow-lg">
                              {getAchievementEmoji(achievement.icon)}
                            </span>
                          ) : (
                            <Lock className="h-6 w-6 text-zinc-600" />
                          )}
                        </div>

                        {/* Name */}
                        <div
                          className={cn(
                            "text-xs font-medium text-center line-clamp-2",
                            achievement.unlocked
                              ? ACHIEVEMENT_TIER_COLORS[tier].text
                              : "text-zinc-600"
                          )}
                        >
                          {achievement.unlocked ? achievement.name : "???"}
                        </div>

                        {/* Progress */}
                        {!achievement.unlocked && achievement.progress > 0 && (
                          <div className="w-full mt-2">
                            <Progress
                              value={achievement.progress}
                              className="h-1 bg-zinc-800"
                            />
                          </div>
                        )}

                        {/* Unlocked Check */}
                        {achievement.unlocked && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className={cn(
                        "max-w-[200px] p-3 border",
                        ACHIEVEMENT_TIER_COLORS[tier].bg,
                        ACHIEVEMENT_TIER_COLORS[tier].border
                      )}
                    >
                      <div className="space-y-2">
                        <div className="font-bold">{achievement.name}</div>
                        <p className="text-xs text-zinc-300">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Sparkles className="h-3 w-3" />
                            +{achievement.xpReward} XP
                          </span>
                          {achievement.unlocked && achievement.unlockedAt && (
                            <span className="text-zinc-500">
                              {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {!achievement.unlocked && (
                          <Progress
                            value={achievement.progress}
                            className="h-1.5"
                          />
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && filteredAchievements?.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No achievements in this category yet</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact achievement showcase for profile cards
 */
export function AchievementShowcase({
  agentTag,
  limit = 5,
  className,
}: {
  agentTag: string;
  limit?: number;
  className?: string;
}) {
  const { data: showcase } = trpc.hypeNetwork.achievements.showcase.useQuery({
    agentTag,
    limit,
  });

  if (!showcase?.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <TooltipProvider delayDuration={200}>
        {showcase.map((achievement) => (
          <Tooltip key={achievement.id}>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center border shadow",
                  ACHIEVEMENT_TIER_COLORS[achievement.tier].bg,
                  ACHIEVEMENT_TIER_COLORS[achievement.tier].border,
                  ACHIEVEMENT_TIER_COLORS[achievement.tier].glow
                )}
              >
                <span className="text-sm">
                  {getAchievementEmoji(achievement.icon)}
                </span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="font-bold">{achievement.name}</div>
              <div className="text-zinc-400">{achievement.description}</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
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
