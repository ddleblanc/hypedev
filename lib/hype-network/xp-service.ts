/**
 * XP Service - Centralized XP calculation and awarding for Hype Agents
 */
import { prisma } from "@/lib/prisma";
import { AgentRank } from "@prisma/client";

// XP thresholds for each rank
export const RANK_THRESHOLDS: Record<AgentRank, number> = {
  ROOKIE: 0,
  PROMOTER: 1000,
  INFLUENCER: 5000,
  AMBASSADOR: 15000,
  ELITE: 50000,
  LEGENDARY: 150000,
  MYTHIC: 500000,
};

// Commission multipliers per rank
export const RANK_MULTIPLIERS: Record<AgentRank, number> = {
  ROOKIE: 1.0,
  PROMOTER: 1.1,
  INFLUENCER: 1.25,
  AMBASSADOR: 1.4,
  ELITE: 1.6,
  LEGENDARY: 1.8,
  MYTHIC: 2.0,
};

// XP sources and their base values
export const XP_SOURCES = {
  REFERRAL_CONVERSION: 100,
  FIRST_SALE_BONUS: 500,
  CHALLENGE_JOIN: 200,
  CHALLENGE_TOP_3: 500,
  CHALLENGE_WIN: 2000,
  DAILY_STREAK: 10,
  STREAK_MILESTONE_7: 100,
  STREAK_MILESTONE_30: 500,
  REFERRED_AGENT_SALE: 50,
  ACHIEVEMENT_UNLOCK: 100, // Base, varies by achievement
  CAMPAIGN_FIRST_CONVERSION: 250,
  HIGH_VALUE_SALE: 200, // Sales over threshold
} as const;

export type XpSource = keyof typeof XP_SOURCES;

export interface AwardXpResult {
  previousXp: number;
  newXp: number;
  xpAwarded: number;
  previousRank: AgentRank;
  newRank: AgentRank;
  didRankUp: boolean;
  newMultiplier: number;
  rankProgress: number;
}

/**
 * Calculate rank based on total XP
 */
export function calculateRank(totalXp: number): AgentRank {
  const ranks = Object.entries(RANK_THRESHOLDS).sort(
    (a, b) => b[1] - a[1]
  ) as [AgentRank, number][];

  for (const [rank, threshold] of ranks) {
    if (totalXp >= threshold) {
      return rank;
    }
  }

  return "ROOKIE";
}

/**
 * Calculate progress to next rank (0-100)
 */
export function calculateRankProgress(
  totalXp: number,
  currentRank: AgentRank
): number {
  const ranks = Object.keys(RANK_THRESHOLDS) as AgentRank[];
  const currentIndex = ranks.indexOf(currentRank);

  // Already max rank
  if (currentIndex === ranks.length - 1) {
    return 100;
  }

  const currentThreshold = RANK_THRESHOLDS[currentRank];
  const nextRank = ranks[currentIndex + 1];
  const nextThreshold = RANK_THRESHOLDS[nextRank];

  const xpInCurrentRank = totalXp - currentThreshold;
  const xpNeededForNext = nextThreshold - currentThreshold;

  return Math.min(100, Math.floor((xpInCurrentRank / xpNeededForNext) * 100));
}

/**
 * Get XP needed to reach next rank
 */
export function getXpToNextRank(
  totalXp: number,
  currentRank: AgentRank
): number | null {
  const ranks = Object.keys(RANK_THRESHOLDS) as AgentRank[];
  const currentIndex = ranks.indexOf(currentRank);

  if (currentIndex === ranks.length - 1) {
    return null; // Max rank
  }

  const nextRank = ranks[currentIndex + 1];
  return RANK_THRESHOLDS[nextRank] - totalXp;
}

/**
 * Get the next rank name
 */
export function getNextRank(currentRank: AgentRank): AgentRank | null {
  const ranks = Object.keys(RANK_THRESHOLDS) as AgentRank[];
  const currentIndex = ranks.indexOf(currentRank);

  if (currentIndex === ranks.length - 1) {
    return null;
  }

  return ranks[currentIndex + 1];
}

/**
 * Award XP to an agent and handle rank-up
 */
export async function awardXp(
  agentId: string,
  source: XpSource,
  multiplier: number = 1.0,
  metadata?: Record<string, unknown>
): Promise<AwardXpResult> {
  const baseXp = XP_SOURCES[source];
  const xpToAward = Math.floor(baseXp * multiplier);

  // Get current state
  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: {
      totalXp: true,
      currentRank: true,
      commissionMultiplier: true,
    },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  const previousXp = agent.totalXp;
  const previousRank = agent.currentRank;
  const newXp = previousXp + xpToAward;
  const newRank = calculateRank(newXp);
  const didRankUp = newRank !== previousRank;
  const newMultiplier = RANK_MULTIPLIERS[newRank];
  const rankProgress = calculateRankProgress(newXp, newRank);

  // Update agent and log XP event in a transaction
  await prisma.$transaction([
    prisma.hypeAgent.update({
      where: { id: agentId },
      data: {
        totalXp: newXp,
        currentRank: newRank,
        rankProgress,
        commissionMultiplier: newMultiplier,
      },
    }),
    prisma.agentXpLog.create({
      data: {
        agentId,
        amount: xpToAward,
        source,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    }),
  ]);

  // Log XP event
  console.log(`[XP] Agent ${agentId}: +${xpToAward} XP (${source})`, {
    previousXp,
    newXp,
    didRankUp,
    metadata,
  });

  return {
    previousXp,
    newXp,
    xpAwarded: xpToAward,
    previousRank,
    newRank,
    didRankUp,
    newMultiplier,
    rankProgress,
  };
}

/**
 * Award custom XP amount (for variable rewards)
 */
export async function awardCustomXp(
  agentId: string,
  xpAmount: number,
  reason: string
): Promise<AwardXpResult> {
  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: {
      totalXp: true,
      currentRank: true,
    },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  const previousXp = agent.totalXp;
  const previousRank = agent.currentRank;
  const newXp = previousXp + xpAmount;
  const newRank = calculateRank(newXp);
  const didRankUp = newRank !== previousRank;
  const newMultiplier = RANK_MULTIPLIERS[newRank];
  const rankProgress = calculateRankProgress(newXp, newRank);

  // Update agent and log XP event in a transaction
  await prisma.$transaction([
    prisma.hypeAgent.update({
      where: { id: agentId },
      data: {
        totalXp: newXp,
        currentRank: newRank,
        rankProgress,
        commissionMultiplier: newMultiplier,
      },
    }),
    prisma.agentXpLog.create({
      data: {
        agentId,
        amount: xpAmount,
        source: "CUSTOM",
        metadata: { reason },
      },
    }),
  ]);

  console.log(`[XP] Agent ${agentId}: +${xpAmount} XP (${reason})`);

  return {
    previousXp,
    newXp,
    xpAwarded: xpAmount,
    previousRank,
    newRank,
    didRankUp,
    newMultiplier,
    rankProgress,
  };
}

/**
 * Award XP for a referral conversion
 * Handles first sale bonus and campaign XP bonuses
 */
export async function awardReferralXp(
  agentId: string,
  campaignXpBonus: number = 0,
  isFirstSale: boolean = false,
  isFirstCampaignConversion: boolean = false
): Promise<AwardXpResult> {
  let totalXp = XP_SOURCES.REFERRAL_CONVERSION + campaignXpBonus;

  if (isFirstSale) {
    totalXp += XP_SOURCES.FIRST_SALE_BONUS;
  }

  if (isFirstCampaignConversion) {
    totalXp += XP_SOURCES.CAMPAIGN_FIRST_CONVERSION;
  }

  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: { totalXp: true, currentRank: true, totalReferrals: true },
  });

  if (!agent) throw new Error("Agent not found");

  const previousXp = agent.totalXp;
  const previousRank = agent.currentRank;
  const newXp = previousXp + totalXp;
  const newRank = calculateRank(newXp);
  const didRankUp = newRank !== previousRank;
  const newMultiplier = RANK_MULTIPLIERS[newRank];
  const rankProgress = calculateRankProgress(newXp, newRank);

  // Update agent and log XP event in a transaction
  await prisma.$transaction([
    prisma.hypeAgent.update({
      where: { id: agentId },
      data: {
        totalXp: newXp,
        currentRank: newRank,
        rankProgress,
        commissionMultiplier: newMultiplier,
        totalReferrals: { increment: 1 },
      },
    }),
    prisma.agentXpLog.create({
      data: {
        agentId,
        amount: totalXp,
        source: "REFERRAL_CONVERSION",
        metadata: {
          campaignXpBonus,
          isFirstSale,
          isFirstCampaignConversion,
        },
      },
    }),
  ]);

  return {
    previousXp,
    newXp,
    xpAwarded: totalXp,
    previousRank,
    newRank,
    didRankUp,
    newMultiplier,
    rankProgress,
  };
}

/**
 * Award XP for streak milestones
 */
export async function awardStreakXp(
  agentId: string,
  currentStreak: number
): Promise<AwardXpResult | null> {
  // Check for milestone
  if (currentStreak === 7) {
    return awardXp(agentId, "STREAK_MILESTONE_7");
  }
  if (currentStreak === 30) {
    return awardXp(agentId, "STREAK_MILESTONE_30");
  }
  if (currentStreak > 0 && currentStreak % 7 === 0) {
    // Weekly streak bonus
    return awardXp(agentId, "DAILY_STREAK", currentStreak / 7);
  }

  return null;
}

/**
 * Calculate commission with rank multiplier
 */
export function calculateCommission(
  baseCommissionBps: number,
  saleAmount: number,
  agentMultiplier: number,
  bonusCommissionBps: number = 0
): {
  baseCommission: number;
  bonusCommission: number;
  totalCommission: number;
  effectiveRate: number;
} {
  const baseRate = baseCommissionBps / 10000;
  const bonusRate = bonusCommissionBps / 10000;

  const baseCommission = saleAmount * baseRate * agentMultiplier;
  const bonusCommission = saleAmount * bonusRate;
  const totalCommission = baseCommission + bonusCommission;
  const effectiveRate = ((baseCommissionBps * agentMultiplier) + bonusCommissionBps) / 100;

  return {
    baseCommission,
    bonusCommission,
    totalCommission,
    effectiveRate,
  };
}
