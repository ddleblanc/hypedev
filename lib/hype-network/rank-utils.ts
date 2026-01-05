/**
 * Rank Display Utilities - UI helpers for displaying agent ranks
 */
import { AgentRank } from "@prisma/client";
import { RANK_THRESHOLDS, RANK_MULTIPLIERS } from "./xp-service";

// Rank display names
export const RANK_DISPLAY_NAMES: Record<AgentRank, string> = {
  ROOKIE: "Rookie",
  PROMOTER: "Promoter",
  INFLUENCER: "Influencer",
  AMBASSADOR: "Ambassador",
  ELITE: "Elite",
  LEGENDARY: "Legendary",
  MYTHIC: "Mythic",
};

// Rank colors (Tailwind classes)
export const RANK_COLORS: Record<
  AgentRank,
  { bg: string; text: string; border: string; glow: string }
> = {
  ROOKIE: {
    bg: "bg-zinc-700",
    text: "text-zinc-300",
    border: "border-zinc-500",
    glow: "shadow-zinc-500/20",
  },
  PROMOTER: {
    bg: "bg-green-900",
    text: "text-green-400",
    border: "border-green-600",
    glow: "shadow-green-500/20",
  },
  INFLUENCER: {
    bg: "bg-blue-900",
    text: "text-blue-400",
    border: "border-blue-600",
    glow: "shadow-blue-500/20",
  },
  AMBASSADOR: {
    bg: "bg-purple-900",
    text: "text-purple-400",
    border: "border-purple-600",
    glow: "shadow-purple-500/20",
  },
  ELITE: {
    bg: "bg-amber-900",
    text: "text-amber-400",
    border: "border-amber-600",
    glow: "shadow-amber-500/20",
  },
  LEGENDARY: {
    bg: "bg-orange-900",
    text: "text-orange-400",
    border: "border-orange-600",
    glow: "shadow-orange-500/20",
  },
  MYTHIC: {
    bg: "bg-gradient-to-r from-pink-600 to-purple-600",
    text: "text-white",
    border: "border-pink-500",
    glow: "shadow-pink-500/30",
  },
};

// Rank icons (emoji)
export const RANK_ICONS: Record<AgentRank, string> = {
  ROOKIE: "🌱",
  PROMOTER: "📢",
  INFLUENCER: "⭐",
  AMBASSADOR: "🎖️",
  ELITE: "💎",
  LEGENDARY: "👑",
  MYTHIC: "🔥",
};

// Rank descriptions
export const RANK_DESCRIPTIONS: Record<AgentRank, string> = {
  ROOKIE: "Just starting out. Every referral counts!",
  PROMOTER: "Building your network. Keep pushing!",
  INFLUENCER: "Your reach is growing. People notice you!",
  AMBASSADOR: "A trusted voice in the community.",
  ELITE: "Top-tier performance. The elite few.",
  LEGENDARY: "Your reputation precedes you.",
  MYTHIC: "The pinnacle. A living legend.",
};

// Perks unlocked at each rank
export const RANK_PERKS: Record<AgentRank, string[]> = {
  ROOKIE: ["Access to public campaigns"],
  PROMOTER: ["Custom link slugs", "Basic analytics"],
  INFLUENCER: ["Priority campaign access", "Weekly payouts"],
  AMBASSADOR: ["Early campaign access", "Custom landing pages"],
  ELITE: ["VIP campaign invites", "Daily payouts", "Dedicated support"],
  LEGENDARY: ["Exclusive campaigns", "Revenue share tier 2", "Beta features"],
  MYTHIC: ["All perks unlocked", "Custom commission rates", "Direct creator access"],
};

export interface RankInfo {
  rank: AgentRank;
  name: string;
  icon: string;
  colors: (typeof RANK_COLORS)[AgentRank];
  multiplier: number;
  threshold: number;
  description: string;
  perks: string[];
}

/**
 * Get rank badge component props
 */
export function getRankBadgeProps(rank: AgentRank): RankInfo {
  return {
    rank,
    name: RANK_DISPLAY_NAMES[rank],
    icon: RANK_ICONS[rank],
    colors: RANK_COLORS[rank],
    multiplier: RANK_MULTIPLIERS[rank],
    threshold: RANK_THRESHOLDS[rank],
    description: RANK_DESCRIPTIONS[rank],
    perks: RANK_PERKS[rank],
  };
}

/**
 * Format XP number with abbreviation
 */
export function formatXp(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toLocaleString();
}

/**
 * Format earnings with ETH symbol
 */
export function formatEarnings(earnings: string | number): string {
  const value = typeof earnings === "string" ? parseFloat(earnings) : earnings;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K Ξ`;
  }
  return `${value.toFixed(4)} Ξ`;
}

/**
 * Get all ranks with their info
 */
export function getAllRanks(): RankInfo[] {
  return (Object.keys(RANK_THRESHOLDS) as AgentRank[]).map((rank) =>
    getRankBadgeProps(rank)
  );
}

/**
 * Get rank index (0-based)
 */
export function getRankIndex(rank: AgentRank): number {
  const ranks = Object.keys(RANK_THRESHOLDS) as AgentRank[];
  return ranks.indexOf(rank);
}

/**
 * Check if rank A is higher than rank B
 */
export function isHigherRank(rankA: AgentRank, rankB: AgentRank): boolean {
  return getRankIndex(rankA) > getRankIndex(rankB);
}

/**
 * Get the total number of ranks
 */
export function getTotalRanks(): number {
  return Object.keys(RANK_THRESHOLDS).length;
}

/**
 * Format streak with fire emoji
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return "0";
  if (streak >= 30) return `${streak} 🔥🔥🔥`;
  if (streak >= 7) return `${streak} 🔥🔥`;
  return `${streak} 🔥`;
}

/**
 * Get motivational message based on progress
 */
export function getProgressMessage(
  rankProgress: number,
  currentRank: AgentRank
): string {
  if (currentRank === "MYTHIC") {
    return "You've reached the pinnacle!";
  }

  if (rankProgress >= 90) {
    return "Almost there! One more push!";
  }
  if (rankProgress >= 75) {
    return "The next rank is within reach!";
  }
  if (rankProgress >= 50) {
    return "Halfway to the next rank!";
  }
  if (rankProgress >= 25) {
    return "Making steady progress!";
  }
  return "Keep grinding for XP!";
}
