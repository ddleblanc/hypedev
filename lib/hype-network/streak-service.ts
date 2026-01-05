/**
 * Streak Service - Daily streak tracking for Hype Agents
 */
import { prisma } from "@/lib/prisma";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_GRACE_PERIOD_MS = 36 * 60 * 60 * 1000; // 36 hours grace

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakBroken: boolean;
  streakExtended: boolean;
  isNewRecord: boolean;
  daysSinceLastReferral: number | null;
}

/**
 * Check and update agent streak on referral
 */
export async function updateStreak(agentId: string): Promise<StreakUpdateResult> {
  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastReferralAt: true,
    },
  });

  if (!agent) throw new Error("Agent not found");

  const now = new Date();
  const lastReferral = agent.lastReferralAt;

  let currentStreak = agent.currentStreak;
  let longestStreak = agent.longestStreak;
  let streakBroken = false;
  let streakExtended = false;
  let isNewRecord = false;
  let daysSinceLastReferral: number | null = null;

  if (!lastReferral) {
    // First referral ever
    currentStreak = 1;
    streakExtended = true;
  } else {
    const timeSinceLastReferral = now.getTime() - lastReferral.getTime();
    daysSinceLastReferral = Math.floor(timeSinceLastReferral / ONE_DAY_MS);

    if (timeSinceLastReferral <= ONE_DAY_MS) {
      // Same day - no change to streak (already counted today)
    } else if (timeSinceLastReferral <= STREAK_GRACE_PERIOD_MS) {
      // Within grace period - extend streak
      currentStreak += 1;
      streakExtended = true;
    } else {
      // Streak broken
      streakBroken = true;
      currentStreak = 1;
    }
  }

  // Update longest streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    isNewRecord = true;
  }

  // Save
  await prisma.hypeAgent.update({
    where: { id: agentId },
    data: {
      currentStreak,
      longestStreak,
      lastReferralAt: now,
    },
  });

  return {
    currentStreak,
    longestStreak,
    streakBroken,
    streakExtended,
    isNewRecord,
    daysSinceLastReferral,
  };
}

/**
 * Get streak status for an agent without updating
 */
export async function getStreakStatus(agentId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  isStreakActive: boolean;
  hoursUntilStreakBreaks: number | null;
  lastReferralAt: Date | null;
}> {
  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastReferralAt: true,
    },
  });

  if (!agent) throw new Error("Agent not found");

  const now = new Date();
  let isStreakActive = false;
  let hoursUntilStreakBreaks: number | null = null;

  if (agent.lastReferralAt && agent.currentStreak > 0) {
    const timeSinceLastReferral = now.getTime() - agent.lastReferralAt.getTime();

    if (timeSinceLastReferral < STREAK_GRACE_PERIOD_MS) {
      isStreakActive = true;
      const remainingMs = STREAK_GRACE_PERIOD_MS - timeSinceLastReferral;
      hoursUntilStreakBreaks = Math.floor(remainingMs / (60 * 60 * 1000));
    }
  }

  return {
    currentStreak: agent.currentStreak,
    longestStreak: agent.longestStreak,
    isStreakActive,
    hoursUntilStreakBreaks,
    lastReferralAt: agent.lastReferralAt,
  };
}

/**
 * Check for broken streaks (run daily via cron)
 * Returns number of agents whose streaks were reset
 */
export async function checkBrokenStreaks(): Promise<number> {
  const cutoffTime = new Date(Date.now() - STREAK_GRACE_PERIOD_MS);

  const result = await prisma.hypeAgent.updateMany({
    where: {
      currentStreak: { gt: 0 },
      lastReferralAt: { lt: cutoffTime },
    },
    data: {
      currentStreak: 0,
    },
  });

  if (result.count > 0) {
    console.log(`[Streak] Reset ${result.count} broken streaks`);
  }

  return result.count;
}

/**
 * Get agents with streaks at risk (for notifications)
 */
export async function getAgentsWithStreaksAtRisk(): Promise<
  Array<{
    agentId: string;
    userId: string;
    currentStreak: number;
    hoursRemaining: number;
  }>
> {
  const warningThreshold = 6 * 60 * 60 * 1000; // 6 hours
  const now = new Date();

  // Find agents whose streak will break in the next 6 hours
  const cutoffStart = new Date(now.getTime() - STREAK_GRACE_PERIOD_MS + warningThreshold);
  const cutoffEnd = new Date(now.getTime() - STREAK_GRACE_PERIOD_MS);

  const agents = await prisma.hypeAgent.findMany({
    where: {
      currentStreak: { gt: 0 },
      lastReferralAt: {
        gte: cutoffEnd,
        lt: cutoffStart,
      },
    },
    select: {
      id: true,
      userId: true,
      currentStreak: true,
      lastReferralAt: true,
    },
  });

  return agents.map((agent) => {
    const timeSinceLastReferral = now.getTime() - agent.lastReferralAt!.getTime();
    const remainingMs = STREAK_GRACE_PERIOD_MS - timeSinceLastReferral;
    const hoursRemaining = Math.floor(remainingMs / (60 * 60 * 1000));

    return {
      agentId: agent.id,
      userId: agent.userId,
      currentStreak: agent.currentStreak,
      hoursRemaining,
    };
  });
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(
  limit: number = 10
): Promise<
  Array<{
    agentId: string;
    agentTag: string;
    currentStreak: number;
    longestStreak: number;
    user: { username: string | null; profilePicture: string | null };
  }>
> {
  const agents = await prisma.hypeAgent.findMany({
    where: {
      currentStreak: { gt: 0 },
      isBanned: false,
    },
    orderBy: {
      currentStreak: "desc",
    },
    take: limit,
    select: {
      id: true,
      agentTag: true,
      currentStreak: true,
      longestStreak: true,
      user: {
        select: {
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  return agents.map((agent) => ({
    agentId: agent.id,
    agentTag: agent.agentTag,
    currentStreak: agent.currentStreak,
    longestStreak: agent.longestStreak,
    user: agent.user,
  }));
}

/**
 * Get streak milestones achieved by current streak
 */
export function getStreakMilestones(currentStreak: number): string[] {
  const milestones: string[] = [];

  if (currentStreak >= 3) milestones.push("3-day");
  if (currentStreak >= 7) milestones.push("weekly");
  if (currentStreak >= 14) milestones.push("2-week");
  if (currentStreak >= 30) milestones.push("monthly");
  if (currentStreak >= 60) milestones.push("2-month");
  if (currentStreak >= 90) milestones.push("quarterly");
  if (currentStreak >= 180) milestones.push("half-year");
  if (currentStreak >= 365) milestones.push("yearly");

  return milestones;
}
