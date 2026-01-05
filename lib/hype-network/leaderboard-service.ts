/**
 * Leaderboard Service - Global and period-based rankings for Hype Agents
 */
import { prisma } from "@/lib/prisma";
import { AgentRank } from "@prisma/client";

export type LeaderboardType =
  | "xp"
  | "earnings"
  | "conversions"
  | "streak"
  | "achievements";

export type LeaderboardPeriod = "day" | "week" | "month" | "all";

export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  agentTag: string;
  agentName: string | null;
  avatar: string | null;
  agentRank: AgentRank;
  value: number;
  previousRank?: number;
}

/**
 * Get global leaderboard by type
 */
export async function getGlobalLeaderboard(
  type: LeaderboardType,
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  // For achievements leaderboard, we need a different query
  if (type === "achievements") {
    const agentsWithAchievements = await prisma.hypeAgent.findMany({
      where: { isBanned: false },
      take: limit,
      skip: offset,
      select: {
        id: true,
        agentTag: true,
        agentName: true,
        avatar: true,
        currentRank: true,
        _count: {
          select: { achievements: true },
        },
      },
      orderBy: {
        achievements: { _count: "desc" },
      },
    });

    return agentsWithAchievements.map((agent, index) => ({
      rank: offset + index + 1,
      agentId: agent.id,
      agentTag: agent.agentTag,
      agentName: agent.agentName,
      avatar: agent.avatar,
      agentRank: agent.currentRank,
      value: agent._count.achievements,
    }));
  }

  // Build orderBy based on type
  type OrderByField =
    | "totalXp"
    | "totalEarnings"
    | "totalReferrals"
    | "longestStreak";
  let orderByField: OrderByField;

  switch (type) {
    case "xp":
      orderByField = "totalXp";
      break;
    case "earnings":
      orderByField = "totalEarnings";
      break;
    case "conversions":
      orderByField = "totalReferrals";
      break;
    case "streak":
      orderByField = "longestStreak";
      break;
    default:
      throw new Error(`Invalid leaderboard type: ${type}`);
  }

  const agents = await prisma.hypeAgent.findMany({
    where: { isBanned: false },
    orderBy: { [orderByField]: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      agentTag: true,
      agentName: true,
      avatar: true,
      currentRank: true,
      totalXp: true,
      totalEarnings: true,
      totalReferrals: true,
      longestStreak: true,
    },
  });

  return agents.map((agent, index) => {
    let value: number;
    switch (type) {
      case "xp":
        value = agent.totalXp;
        break;
      case "earnings":
        value = Number(agent.totalEarnings);
        break;
      case "conversions":
        value = agent.totalReferrals;
        break;
      case "streak":
        value = agent.longestStreak;
        break;
      default:
        value = 0;
    }

    return {
      rank: offset + index + 1,
      agentId: agent.id,
      agentTag: agent.agentTag,
      agentName: agent.agentName,
      avatar: agent.avatar,
      agentRank: agent.currentRank,
      value,
    };
  });
}

/**
 * Get agent's position in leaderboard
 */
export async function getAgentLeaderboardPosition(
  agentId: string,
  type: LeaderboardType
): Promise<number> {
  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: {
      totalXp: true,
      totalEarnings: true,
      totalReferrals: true,
      longestStreak: true,
      _count: {
        select: { achievements: true },
      },
    },
  });

  if (!agent) return -1;

  let value: number;
  let countQuery: Record<string, unknown>;

  switch (type) {
    case "xp":
      value = agent.totalXp;
      countQuery = { totalXp: { gt: value } };
      break;
    case "earnings":
      value = Number(agent.totalEarnings);
      countQuery = { totalEarnings: { gt: agent.totalEarnings } };
      break;
    case "conversions":
      value = agent.totalReferrals;
      countQuery = { totalReferrals: { gt: value } };
      break;
    case "streak":
      value = agent.longestStreak;
      countQuery = { longestStreak: { gt: value } };
      break;
    case "achievements": {
      const achievementCount = agent._count.achievements;
      // Count agents with more achievements than this agent
      const allAgents = await prisma.hypeAgent.findMany({
        where: { isBanned: false },
        select: {
          id: true,
          _count: { select: { achievements: true } },
        },
      });
      const rank =
        allAgents.filter((a) => a._count.achievements > achievementCount)
          .length + 1;
      return rank;
    }
    default:
      return -1;
  }

  // Count agents with higher values
  const higherCount = await prisma.hypeAgent.count({
    where: {
      isBanned: false,
      ...countQuery,
    },
  });

  return higherCount + 1;
}

/**
 * Get leaderboard summary for dashboard (agent's position in all leaderboards)
 */
export async function getLeaderboardSummary(agentId: string) {
  const [xpRank, earningsRank, conversionsRank, achievementsRank] =
    await Promise.all([
      getAgentLeaderboardPosition(agentId, "xp"),
      getAgentLeaderboardPosition(agentId, "earnings"),
      getAgentLeaderboardPosition(agentId, "conversions"),
      getAgentLeaderboardPosition(agentId, "achievements"),
    ]);

  const totalAgents = await prisma.hypeAgent.count({ where: { isBanned: false } });

  const calculatePercentile = (rank: number) =>
    rank > 0 && totalAgents > 0
      ? Math.round(((totalAgents - rank) / totalAgents) * 100)
      : 0;

  return {
    xp: {
      rank: xpRank,
      total: totalAgents,
      percentile: calculatePercentile(xpRank),
    },
    earnings: {
      rank: earningsRank,
      total: totalAgents,
      percentile: calculatePercentile(earningsRank),
    },
    conversions: {
      rank: conversionsRank,
      total: totalAgents,
      percentile: calculatePercentile(conversionsRank),
    },
    achievements: {
      rank: achievementsRank,
      total: totalAgents,
      percentile: calculatePercentile(achievementsRank),
    },
  };
}

/**
 * Get top agents by XP gained in a time period
 */
export async function getTopAgentsByPeriod(
  period: LeaderboardPeriod,
  limit: number = 10
): Promise<
  {
    rank: number;
    agent: {
      id: string;
      agentTag: string;
      agentName: string | null;
      avatar: string | null;
      currentRank: AgentRank;
    };
    xpGained: number;
  }[]
> {
  if (period === "all") {
    // For all-time, just use total XP
    const agents = await prisma.hypeAgent.findMany({
      where: { isBanned: false },
      orderBy: { totalXp: "desc" },
      take: limit,
      select: {
        id: true,
        agentTag: true,
        agentName: true,
        avatar: true,
        currentRank: true,
        totalXp: true,
      },
    });

    return agents.map((agent, index) => ({
      rank: index + 1,
      agent: {
        id: agent.id,
        agentTag: agent.agentTag,
        agentName: agent.agentName,
        avatar: agent.avatar,
        currentRank: agent.currentRank,
      },
      xpGained: agent.totalXp,
    }));
  }

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "day":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0);
  }

  // Get XP gains in period from XP log
  const xpGains = await prisma.agentXpLog.groupBy({
    by: ["agentId"],
    where: {
      createdAt: { gte: startDate },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  if (xpGains.length === 0) {
    return [];
  }

  const agentIds = xpGains.map((g) => g.agentId);
  const agents = await prisma.hypeAgent.findMany({
    where: { id: { in: agentIds } },
    select: {
      id: true,
      agentTag: true,
      agentName: true,
      avatar: true,
      currentRank: true,
    },
  });

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return xpGains
    .map((gain, index) => {
      const agent = agentMap.get(gain.agentId);
      if (!agent) return null;
      return {
        rank: index + 1,
        agent,
        xpGained: gain._sum.amount || 0,
      };
    })
    .filter(
      (
        e
      ): e is {
        rank: number;
        agent: NonNullable<typeof e>["agent"];
        xpGained: number;
      } => e !== null
    );
}

/**
 * Get stats about the leaderboard
 */
export async function getLeaderboardStats() {
  const [totalAgents, totalXp, totalEarnings, totalReferrals] =
    await Promise.all([
      prisma.hypeAgent.count({ where: { isBanned: false } }),
      prisma.hypeAgent.aggregate({
        where: { isBanned: false },
        _sum: { totalXp: true },
      }),
      prisma.hypeAgent.aggregate({
        where: { isBanned: false },
        _sum: { totalEarnings: true },
      }),
      prisma.hypeAgent.aggregate({
        where: { isBanned: false },
        _sum: { totalReferrals: true },
      }),
    ]);

  return {
    totalAgents,
    totalXp: totalXp._sum.totalXp || 0,
    totalEarnings: Number(totalEarnings._sum.totalEarnings || 0),
    totalReferrals: totalReferrals._sum.totalReferrals || 0,
  };
}

/**
 * Get rank distribution
 */
export async function getRankDistribution(): Promise<
  { rank: AgentRank; count: number; percentage: number }[]
> {
  const totalAgents = await prisma.hypeAgent.count({ where: { isBanned: false } });

  const distribution = await prisma.hypeAgent.groupBy({
    by: ["currentRank"],
    where: { isBanned: false },
    _count: { currentRank: true },
    orderBy: { currentRank: "asc" },
  });

  const rankOrder: AgentRank[] = [
    "ROOKIE",
    "PROMOTER",
    "INFLUENCER",
    "AMBASSADOR",
    "ELITE",
    "LEGENDARY",
    "MYTHIC",
  ];

  return rankOrder.map((rank) => {
    const found = distribution.find((d) => d.currentRank === rank);
    const count = found?._count.currentRank || 0;
    return {
      rank,
      count,
      percentage: totalAgents > 0 ? (count / totalAgents) * 100 : 0,
    };
  });
}
