/**
 * Achievement Service - Unlock detection and progress tracking for Hype Agents
 */
import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENTS,
  AchievementDefinition,
  RANK_ORDER,
  getAchievementById,
  TIER_ORDER,
} from "./achievements";
import { awardCustomXp } from "./xp-service";
import { AchievementTier } from "@prisma/client";

/**
 * Stats needed for achievement checks
 */
interface AgentStats {
  totalReferrals: number;
  totalEarningsEth: number;
  currentStreak: number;
  longestStreak: number;
  challengesJoined: number;
  challengeWins: number;
  challengeTop3Finishes: number;
  rank: string;
  joinedAt: Date;
  activeCampaigns: number;
}

/**
 * Platform launch date for early adopter achievement
 */
const PLATFORM_LAUNCH_DATE = new Date("2026-01-01");

/**
 * Get agent stats for achievement checks
 */
export async function getAgentStats(agentId: string): Promise<AgentStats> {
  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: {
      totalReferrals: true,
      totalEarnings: true,
      currentStreak: true,
      longestStreak: true,
      currentRank: true,
      createdAt: true,
    },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  // Count active campaign links
  const activeCampaigns = await prisma.affiliateLink.count({
    where: {
      agentId,
      isActive: true,
      campaign: { status: "ACTIVE" },
    },
  });

  // Count challenge participation stats
  const challengeStats = await prisma.challengeParticipant.aggregate({
    where: { agentId },
    _count: { _all: true },
  });

  const challengeWins = await prisma.challengeParticipant.count({
    where: { agentId, finalRank: 1 },
  });

  const challengeTop3 = await prisma.challengeParticipant.count({
    where: {
      agentId,
      finalRank: { lte: 3, gte: 1 },
    },
  });

  return {
    totalReferrals: agent.totalReferrals,
    totalEarningsEth: Number(agent.totalEarnings),
    currentStreak: agent.currentStreak,
    longestStreak: agent.longestStreak,
    challengesJoined: challengeStats._count._all,
    challengeWins,
    challengeTop3Finishes: challengeTop3,
    rank: agent.currentRank,
    joinedAt: agent.createdAt,
    activeCampaigns,
  };
}

/**
 * Check if agent meets achievement requirement
 */
function meetsRequirement(
  stats: AgentStats,
  requirement: AchievementDefinition["requirement"]
): boolean {
  let currentValue: number;

  switch (requirement.type) {
    case "total_referrals":
      currentValue = stats.totalReferrals;
      break;
    case "total_earnings_eth":
      currentValue = stats.totalEarningsEth;
      break;
    case "current_streak":
      currentValue = stats.currentStreak;
      break;
    case "longest_streak":
      currentValue = stats.longestStreak;
      break;
    case "challenges_joined":
      currentValue = stats.challengesJoined;
      break;
    case "challenge_wins":
      currentValue = stats.challengeWins;
      break;
    case "challenge_top3_finishes":
      currentValue = stats.challengeTop3Finishes;
      break;
    case "rank":
      currentValue = RANK_ORDER[stats.rank] || 0;
      break;
    case "join_date_before": {
      // Days since platform launch
      const daysSinceLaunch = Math.floor(
        (stats.joinedAt.getTime() - PLATFORM_LAUNCH_DATE.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      currentValue = daysSinceLaunch;
      break;
    }
    case "active_campaigns":
      currentValue = stats.activeCampaigns;
      break;
    default:
      // Special achievements that require event-based tracking
      return false;
  }

  switch (requirement.comparison) {
    case "gte":
      return currentValue >= requirement.value;
    case "lte":
      return currentValue <= requirement.value;
    case "eq":
      return currentValue === requirement.value;
    default:
      return false;
  }
}

/**
 * Calculate progress towards an achievement (0-100)
 */
function calculateProgress(
  stats: AgentStats,
  requirement: AchievementDefinition["requirement"]
): number {
  let currentValue: number;
  const targetValue = requirement.value;

  switch (requirement.type) {
    case "total_referrals":
      currentValue = stats.totalReferrals;
      break;
    case "total_earnings_eth":
      currentValue = stats.totalEarningsEth;
      break;
    case "current_streak":
      currentValue = stats.currentStreak;
      break;
    case "longest_streak":
      currentValue = stats.longestStreak;
      break;
    case "challenges_joined":
      currentValue = stats.challengesJoined;
      break;
    case "challenge_wins":
      currentValue = stats.challengeWins;
      break;
    case "challenge_top3_finishes":
      currentValue = stats.challengeTop3Finishes;
      break;
    case "rank":
      currentValue = RANK_ORDER[stats.rank] || 0;
      break;
    case "active_campaigns":
      currentValue = stats.activeCampaigns;
      break;
    default:
      return 0;
  }

  if (requirement.comparison === "lte") {
    // For "less than or equal" requirements like early adopter
    return currentValue <= targetValue ? 100 : 0;
  }

  return Math.min(100, (currentValue / targetValue) * 100);
}

/**
 * Check and unlock achievements for an agent
 * Returns newly unlocked achievements
 */
export async function checkAndUnlockAchievements(
  agentId: string
): Promise<AchievementDefinition[]> {
  const stats = await getAgentStats(agentId);

  // Get already unlocked achievements
  const unlockedRecords = await prisma.agentAchievement.findMany({
    where: { agentId },
    select: { achievementId: true },
  });
  const unlockedSet = new Set(unlockedRecords.map((a) => a.achievementId));

  const newlyUnlocked: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (unlockedSet.has(achievement.id)) continue;

    // Skip special event-based achievements that can't be detected from stats
    if (
      [
        "campaign_all_challenges_completed",
        "challenge_comeback_win",
        "single_referral_eth",
      ].includes(achievement.requirement.type)
    ) {
      continue;
    }

    // Check if requirement is met
    if (meetsRequirement(stats, achievement.requirement)) {
      // Unlock the achievement
      await prisma.agentAchievement.create({
        data: {
          agentId,
          achievementId: achievement.id,
          tier: achievement.tier,
        },
      });

      // Award XP for the achievement
      await awardCustomXp(
        agentId,
        achievement.xpReward,
        `Achievement: ${achievement.name}`
      );

      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/**
 * Unlock a specific achievement for an agent (for event-based achievements)
 */
export async function unlockAchievement(
  agentId: string,
  achievementId: string
): Promise<AchievementDefinition | null> {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return null;

  // Check if already unlocked
  const existing = await prisma.agentAchievement.findUnique({
    where: {
      agentId_achievementId: {
        agentId,
        achievementId,
      },
    },
  });

  if (existing) return null;

  // Unlock the achievement
  await prisma.agentAchievement.create({
    data: {
      agentId,
      achievementId: achievement.id,
      tier: achievement.tier,
    },
  });

  // Award XP
  await awardCustomXp(
    agentId,
    achievement.xpReward,
    `Achievement: ${achievement.name}`
  );

  return achievement;
}

export interface AchievementWithProgress extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
}

/**
 * Get agent's achievements with progress
 */
export async function getAgentAchievements(
  agentId: string
): Promise<AchievementWithProgress[]> {
  const stats = await getAgentStats(agentId);

  const unlocked = await prisma.agentAchievement.findMany({
    where: { agentId },
    select: {
      achievementId: true,
      unlockedAt: true,
    },
  });
  const unlockedMap = new Map(
    unlocked.map((a) => [a.achievementId, a.unlockedAt])
  );

  return ACHIEVEMENTS.filter((a) => !a.secret || unlockedMap.has(a.id)).map(
    (achievement) => {
      const isUnlocked = unlockedMap.has(achievement.id);
      const progress = isUnlocked
        ? 100
        : calculateProgress(stats, achievement.requirement);

      return {
        ...achievement,
        unlocked: isUnlocked,
        unlockedAt: unlockedMap.get(achievement.id) ?? null,
        progress,
      };
    }
  );
}

/**
 * Get achievement showcase (top achievements for profile display)
 */
export async function getAchievementShowcase(
  agentId: string,
  limit: number = 5
): Promise<(AchievementDefinition & { unlockedAt: Date })[]> {
  const achievements = await prisma.agentAchievement.findMany({
    where: { agentId },
    orderBy: [
      // Prioritize higher tiers (using raw SQL ordering)
      { unlockedAt: "desc" },
    ],
    take: limit * 2, // Get more to sort by tier
  });

  // Sort by tier (highest first), then by recency
  const sorted = achievements
    .map((a) => ({
      ...getAchievementById(a.achievementId),
      unlockedAt: a.unlockedAt,
      tier: a.tier,
    }))
    .filter((a): a is NonNullable<typeof a> & { unlockedAt: Date } =>
      Boolean(a.id)
    )
    .sort((a, b) => {
      const tierDiff = TIER_ORDER[b.tier] - TIER_ORDER[a.tier];
      if (tierDiff !== 0) return tierDiff;
      return b.unlockedAt.getTime() - a.unlockedAt.getTime();
    })
    .slice(0, limit);

  return sorted as (AchievementDefinition & { unlockedAt: Date })[];
}

/**
 * Get agent's unlocked achievement count by tier
 */
export async function getAgentAchievementStats(agentId: string) {
  const achievements = await prisma.agentAchievement.groupBy({
    by: ["tier"],
    where: { agentId },
    _count: { tier: true },
  });

  const tierCounts: Record<AchievementTier, number> = {
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    DIAMOND: 0,
  };

  for (const a of achievements) {
    tierCounts[a.tier] = a._count.tier;
  }

  const total = Object.values(tierCounts).reduce((a, b) => a + b, 0);
  const totalAvailable = ACHIEVEMENTS.length;

  return {
    tierCounts,
    total,
    totalAvailable,
    percentComplete: Math.round((total / totalAvailable) * 100),
  };
}

/**
 * Get rarest achievements across all agents
 */
export async function getRarestAchievements(limit: number = 10) {
  const totalAgents = await prisma.hypeAgent.count();

  const achievementCounts = await prisma.agentAchievement.groupBy({
    by: ["achievementId"],
    _count: { achievementId: true },
    orderBy: { _count: { achievementId: "asc" } },
    take: limit,
  });

  return achievementCounts
    .map((ac) => ({
      achievement: getAchievementById(ac.achievementId),
      count: ac._count.achievementId,
      percentage:
        totalAgents > 0 ? (ac._count.achievementId / totalAgents) * 100 : 0,
    }))
    .filter((a) => a.achievement);
}

/**
 * Get recently unlocked achievements globally
 */
export async function getRecentAchievements(limit: number = 10) {
  const recent = await prisma.agentAchievement.findMany({
    orderBy: { unlockedAt: "desc" },
    take: limit,
    include: {
      agent: {
        select: {
          id: true,
          agentTag: true,
          agentName: true,
          avatar: true,
          currentRank: true,
        },
      },
    },
  });

  return recent.map((r) => ({
    achievement: getAchievementById(r.achievementId),
    agent: r.agent,
    unlockedAt: r.unlockedAt,
  }));
}
