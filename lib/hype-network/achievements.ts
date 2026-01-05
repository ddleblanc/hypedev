/**
 * Achievement Definitions for Hype Network
 * Each achievement has a unique ID, tier, requirements, and XP reward
 */
import { AchievementTier } from "@prisma/client";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category:
    | "REFERRAL"
    | "VOLUME"
    | "STREAK"
    | "CHALLENGE"
    | "SOCIAL"
    | "RANK"
    | "SPECIAL";
  tier: AchievementTier;
  icon: string;
  requirement: {
    type: string;
    value: number;
    comparison: "gte" | "eq" | "lte";
  };
  xpReward: number;
  secret?: boolean; // Hidden until unlocked
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ===================================
  // REFERRAL ACHIEVEMENTS
  // ===================================
  {
    id: "first_blood",
    name: "First Blood",
    description: "Get your first referral conversion",
    category: "REFERRAL",
    tier: "BRONZE",
    icon: "drop",
    requirement: { type: "total_referrals", value: 1, comparison: "gte" },
    xpReward: 100,
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Reach 10 total conversions",
    category: "REFERRAL",
    tier: "BRONZE",
    icon: "seedling",
    requirement: { type: "total_referrals", value: 10, comparison: "gte" },
    xpReward: 100,
  },
  {
    id: "networker",
    name: "Networker",
    description: "Reach 50 total conversions",
    category: "REFERRAL",
    tier: "SILVER",
    icon: "handshake",
    requirement: { type: "total_referrals", value: 50, comparison: "gte" },
    xpReward: 250,
  },
  {
    id: "influencer",
    name: "True Influencer",
    description: "Reach 250 total conversions",
    category: "REFERRAL",
    tier: "GOLD",
    icon: "star",
    requirement: { type: "total_referrals", value: 250, comparison: "gte" },
    xpReward: 500,
  },
  {
    id: "hype_lord",
    name: "Hype Lord",
    description: "Reach 1000 total conversions",
    category: "REFERRAL",
    tier: "DIAMOND",
    icon: "crown",
    requirement: { type: "total_referrals", value: 1000, comparison: "gte" },
    xpReward: 1000,
  },

  // ===================================
  // VOLUME ACHIEVEMENTS
  // ===================================
  {
    id: "first_earnings",
    name: "Money Maker",
    description: "Earn your first commission",
    category: "VOLUME",
    tier: "BRONZE",
    icon: "dollar",
    requirement: { type: "total_earnings_eth", value: 0.01, comparison: "gte" },
    xpReward: 100,
  },
  {
    id: "eth_hunter",
    name: "ETH Hunter",
    description: "Earn 0.5 ETH in commissions",
    category: "VOLUME",
    tier: "SILVER",
    icon: "target",
    requirement: { type: "total_earnings_eth", value: 0.5, comparison: "gte" },
    xpReward: 250,
  },
  {
    id: "whale_earner",
    name: "Whale Earner",
    description: "Earn 2 ETH in commissions",
    category: "VOLUME",
    tier: "GOLD",
    icon: "whale",
    requirement: { type: "total_earnings_eth", value: 2, comparison: "gte" },
    xpReward: 500,
  },
  {
    id: "crypto_rich",
    name: "Crypto Rich",
    description: "Earn 10 ETH in commissions",
    category: "VOLUME",
    tier: "DIAMOND",
    icon: "diamond",
    requirement: { type: "total_earnings_eth", value: 10, comparison: "gte" },
    xpReward: 1000,
  },

  // ===================================
  // STREAK ACHIEVEMENTS
  // ===================================
  {
    id: "streak_starter",
    name: "Streak Starter",
    description: "Maintain a 3-day activity streak",
    category: "STREAK",
    tier: "BRONZE",
    icon: "flame",
    requirement: { type: "current_streak", value: 3, comparison: "gte" },
    xpReward: 100,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day activity streak",
    category: "STREAK",
    tier: "SILVER",
    icon: "sword",
    requirement: { type: "current_streak", value: 7, comparison: "gte" },
    xpReward: 250,
  },
  {
    id: "streak_machine",
    name: "Streak Machine",
    description: "Maintain a 30-day activity streak",
    category: "STREAK",
    tier: "GOLD",
    icon: "robot",
    requirement: { type: "current_streak", value: 30, comparison: "gte" },
    xpReward: 500,
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Maintain a 100-day activity streak",
    category: "STREAK",
    tier: "DIAMOND",
    icon: "sparkle",
    requirement: { type: "current_streak", value: 100, comparison: "gte" },
    xpReward: 1000,
  },

  // ===================================
  // CHALLENGE ACHIEVEMENTS
  // ===================================
  {
    id: "first_challenge",
    name: "Challenger",
    description: "Join your first challenge",
    category: "CHALLENGE",
    tier: "BRONZE",
    icon: "dumbbell",
    requirement: { type: "challenges_joined", value: 1, comparison: "gte" },
    xpReward: 100,
  },
  {
    id: "podium_finish",
    name: "Podium Finish",
    description: "Finish top 3 in a challenge",
    category: "CHALLENGE",
    tier: "SILVER",
    icon: "trophy",
    requirement: { type: "challenge_top3_finishes", value: 1, comparison: "gte" },
    xpReward: 250,
  },
  {
    id: "champion",
    name: "Champion",
    description: "Win a challenge",
    category: "CHALLENGE",
    tier: "GOLD",
    icon: "medal",
    requirement: { type: "challenge_wins", value: 1, comparison: "gte" },
    xpReward: 500,
  },
  {
    id: "serial_winner",
    name: "Serial Winner",
    description: "Win 10 challenges",
    category: "CHALLENGE",
    tier: "DIAMOND",
    icon: "badge",
    requirement: { type: "challenge_wins", value: 10, comparison: "gte" },
    xpReward: 1000,
  },

  // ===================================
  // RANK ACHIEVEMENTS
  // ===================================
  {
    id: "rank_promoter",
    name: "Promoted",
    description: "Reach Promoter rank",
    category: "RANK",
    tier: "BRONZE",
    icon: "chart-up",
    requirement: { type: "rank", value: 2, comparison: "gte" }, // PROMOTER = rank 2
    xpReward: 100,
  },
  {
    id: "rank_influencer",
    name: "Rising Star",
    description: "Reach Influencer rank",
    category: "RANK",
    tier: "SILVER",
    icon: "star",
    requirement: { type: "rank", value: 3, comparison: "gte" },
    xpReward: 250,
  },
  {
    id: "rank_ambassador",
    name: "Ambassador",
    description: "Reach Ambassador rank",
    category: "RANK",
    tier: "SILVER",
    icon: "badge",
    requirement: { type: "rank", value: 4, comparison: "gte" },
    xpReward: 250,
  },
  {
    id: "rank_elite",
    name: "Elite Status",
    description: "Reach Elite rank",
    category: "RANK",
    tier: "GOLD",
    icon: "sparkle",
    requirement: { type: "rank", value: 5, comparison: "gte" },
    xpReward: 500,
  },
  {
    id: "rank_legendary",
    name: "Legendary",
    description: "Reach Legendary rank",
    category: "RANK",
    tier: "DIAMOND",
    icon: "trident",
    requirement: { type: "rank", value: 6, comparison: "gte" },
    xpReward: 1000,
  },
  {
    id: "rank_mythic",
    name: "Mythic Ascension",
    description: "Reach Mythic rank - the highest honor",
    category: "RANK",
    tier: "DIAMOND",
    icon: "sparkles",
    requirement: { type: "rank", value: 7, comparison: "gte" },
    xpReward: 2000,
  },

  // ===================================
  // SPECIAL / SECRET ACHIEVEMENTS
  // ===================================
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined during the first month of launch",
    category: "SPECIAL",
    tier: "GOLD",
    icon: "rocket",
    requirement: { type: "join_date_before", value: 30, comparison: "lte" }, // Days after launch
    xpReward: 500,
  },
  {
    id: "multi_campaign",
    name: "Multi-Tasker",
    description: "Active in 5 campaigns simultaneously",
    category: "SPECIAL",
    tier: "SILVER",
    icon: "tent",
    requirement: { type: "active_campaigns", value: 5, comparison: "gte" },
    xpReward: 250,
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Complete all challenges in a campaign",
    category: "SPECIAL",
    tier: "GOLD",
    icon: "check",
    requirement: {
      type: "campaign_all_challenges_completed",
      value: 1,
      comparison: "gte",
    },
    xpReward: 500,
    secret: true,
  },
  {
    id: "comeback_king",
    name: "Comeback King",
    description: "Win a challenge after being outside top 10",
    category: "SPECIAL",
    tier: "GOLD",
    icon: "fist",
    requirement: { type: "challenge_comeback_win", value: 1, comparison: "gte" },
    xpReward: 500,
    secret: true,
  },
  {
    id: "whale_hunter",
    name: "Big Game Hunter",
    description: "Refer a single purchase over 5 ETH",
    category: "SPECIAL",
    tier: "DIAMOND",
    icon: "fish",
    requirement: { type: "single_referral_eth", value: 5, comparison: "gte" },
    xpReward: 1000,
    secret: true,
  },
];

// Achievement tier colors for UI
export const ACHIEVEMENT_TIER_COLORS: Record<
  AchievementTier,
  {
    bg: string;
    border: string;
    text: string;
    glow: string;
    gradient: string;
  }
> = {
  BRONZE: {
    bg: "bg-amber-900/30",
    border: "border-amber-600",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
    gradient: "from-amber-600 to-amber-800",
  },
  SILVER: {
    bg: "bg-zinc-400/20",
    border: "border-zinc-400",
    text: "text-zinc-300",
    glow: "shadow-zinc-400/20",
    gradient: "from-zinc-300 to-zinc-500",
  },
  GOLD: {
    bg: "bg-yellow-500/20",
    border: "border-yellow-500",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/30",
    gradient: "from-yellow-400 to-yellow-600",
  },
  DIAMOND: {
    bg: "bg-cyan-400/20",
    border: "border-cyan-400",
    text: "text-cyan-300",
    glow: "shadow-cyan-400/40",
    gradient: "from-cyan-300 to-cyan-500",
  },
};

// Tier display order (for sorting)
export const TIER_ORDER: Record<AchievementTier, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  DIAMOND: 4,
};

// Map rank enum to numeric value for comparison
export const RANK_ORDER: Record<string, number> = {
  ROOKIE: 1,
  PROMOTER: 2,
  INFLUENCER: 3,
  AMBASSADOR: 4,
  ELITE: 5,
  LEGENDARY: 6,
  MYTHIC: 7,
};

/**
 * Get achievement by ID
 */
export function getAchievementById(
  id: string
): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(
  category: AchievementDefinition["category"]
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Get achievements by tier
 */
export function getAchievementsByTier(
  tier: AchievementTier
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => a.tier === tier);
}

/**
 * Get all achievement IDs
 */
export function getAllAchievementIds(): string[] {
  return ACHIEVEMENTS.map((a) => a.id);
}

/**
 * Get total XP available from achievements
 */
export function getTotalAchievementXp(): number {
  return ACHIEVEMENTS.reduce((sum, a) => sum + a.xpReward, 0);
}

/**
 * Get achievement count by tier
 */
export function getAchievementCountByTier(): Record<AchievementTier, number> {
  return {
    BRONZE: ACHIEVEMENTS.filter((a) => a.tier === "BRONZE").length,
    SILVER: ACHIEVEMENTS.filter((a) => a.tier === "SILVER").length,
    GOLD: ACHIEVEMENTS.filter((a) => a.tier === "GOLD").length,
    DIAMOND: ACHIEVEMENTS.filter((a) => a.tier === "DIAMOND").length,
  };
}

/**
 * Get public achievements (non-secret)
 */
export function getPublicAchievements(): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => !a.secret);
}

/**
 * Get secret achievements
 */
export function getSecretAchievements(): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => a.secret);
}
