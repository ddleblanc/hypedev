/**
 * Challenge Service - Creator-run competitions for Hype Agents
 */
import { prisma } from "@/lib/prisma";
import { ChallengeType, ChallengeStatus } from "@prisma/client";
import { z } from "zod";
import { awardXp, awardCustomXp, XP_SOURCES } from "./xp-service";
import { broadcastNotification, type NotificationEvent } from "@/lib/notification-broadcaster";

// Validation schema for challenge creation
export const CreateChallengeSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  bannerImage: z.string().url().optional(),
  type: z.nativeEnum(ChallengeType),
  targetValue: z.number().int().min(1),
  targetCurrency: z.string().optional(),
  startAt: z.date(),
  endAt: z.date(),
  prizePool: z.number().min(0).optional(),
  prizeNftIds: z.array(z.string()).optional(),
  xpReward: z.number().int().min(0).max(10000).default(1000),
  winnersCount: z.number().int().min(1).max(100).default(3),
  prizeDistribution: z.record(z.number()).optional(),
});

export type CreateChallengeInput = z.infer<typeof CreateChallengeSchema>;

// Challenge type metadata
export const CHALLENGE_TYPE_INFO: Record<
  ChallengeType,
  {
    name: string;
    description: string;
    metric: string;
    icon: string;
  }
> = {
  RACE_TO_TARGET: {
    name: "Race to Target",
    description: "First agent to reach the target wins",
    metric: "referrals",
    icon: "RACE",
  },
  MOST_REFERRALS: {
    name: "Most Referrals",
    description: "Agent with most referrals wins",
    metric: "referrals",
    icon: "TARGET",
  },
  MOST_VOLUME: {
    name: "Most Volume",
    description: "Agent with highest sales volume wins",
    metric: "volume (ETH)",
    icon: "MONEY",
  },
  STREAK_MASTER: {
    name: "Streak Master",
    description: "Longest consecutive days with referrals",
    metric: "days",
    icon: "FIRE",
  },
  VIRAL_WAVE: {
    name: "Viral Wave",
    description: "Most unique link clicks",
    metric: "clicks",
    icon: "WAVE",
  },
  WHALE_HUNTER: {
    name: "Whale Hunter",
    description: "Single highest-value referral",
    metric: "sale amount (ETH)",
    icon: "WHALE",
  },
  CONSISTENCY: {
    name: "Consistency King",
    description: "Most days with at least one referral",
    metric: "active days",
    icon: "CALENDAR",
  },
};

/**
 * Create a new challenge
 */
export async function createChallenge(
  creatorId: string,
  input: CreateChallengeInput
) {
  // Verify campaign belongs to creator
  const campaign = await prisma.affiliateCampaign.findUnique({
    where: { id: input.campaignId },
    select: { creatorId: true, status: true },
  });

  if (!campaign || campaign.creatorId !== creatorId) {
    throw new Error("Campaign not found or unauthorized");
  }

  if (campaign.status !== "ACTIVE") {
    throw new Error("Campaign must be active to add challenges");
  }

  // Validate dates
  if (input.endAt <= input.startAt) {
    throw new Error("End date must be after start date");
  }

  // Default prize distribution
  const prizeDistribution = input.prizeDistribution || {
    "1st": 50,
    "2nd": 30,
    "3rd": 20,
  };

  const now = new Date();
  const challenge = await prisma.affiliateChallenge.create({
    data: {
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      bannerImage: input.bannerImage,
      type: input.type,
      targetValue: input.targetValue,
      targetCurrency: input.targetCurrency,
      startAt: input.startAt,
      endAt: input.endAt,
      prizePool: input.prizePool,
      prizeNftIds: input.prizeNftIds || [],
      xpReward: input.xpReward,
      winnersCount: input.winnersCount,
      prizeDistribution,
      status: input.startAt <= now ? "ACTIVE" : "UPCOMING",
    },
  });

  return challenge;
}

/**
 * Get challenge by ID with participants
 */
export async function getChallengeById(id: string) {
  return prisma.affiliateChallenge.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          name: true,
          creatorId: true,
        },
      },
      participants: {
        orderBy: { currentRank: "asc" },
        take: 50,
        include: {
          agent: {
            select: {
              agentTag: true,
              agentName: true,
              avatar: true,
              currentRank: true,
            },
          },
        },
      },
    },
  });
}

/**
 * List challenges with optional filters
 */
export async function listChallenges(options?: {
  campaignId?: string;
  status?: ChallengeStatus;
  limit?: number;
  cursor?: string;
}) {
  const { campaignId, status, limit = 20, cursor } = options ?? {};

  const challenges = await prisma.affiliateChallenge.findMany({
    where: {
      ...(campaignId && { campaignId }),
      ...(status && { status }),
    },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: { startAt: "desc" },
    include: {
      campaign: {
        select: { name: true },
      },
    },
  });

  let nextCursor: string | null = null;
  if (challenges.length > limit) {
    const next = challenges.pop();
    nextCursor = next?.id ?? null;
  }

  return { items: challenges, nextCursor };
}

/**
 * Join a challenge
 */
export async function joinChallenge(agentId: string, challengeId: string) {
  const challenge = await prisma.affiliateChallenge.findUnique({
    where: { id: challengeId },
    select: {
      status: true,
      campaignId: true,
      participantCount: true,
    },
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  if (challenge.status !== "ACTIVE" && challenge.status !== "UPCOMING") {
    throw new Error("Challenge is not accepting participants");
  }

  // Verify agent is part of campaign
  const link = await prisma.affiliateLink.findUnique({
    where: {
      agentId_campaignId: { agentId, campaignId: challenge.campaignId },
    },
  });

  if (!link) {
    throw new Error("You must join the campaign first");
  }

  // Check if already joined
  const existing = await prisma.challengeParticipant.findUnique({
    where: {
      challengeId_agentId: { challengeId, agentId },
    },
  });

  if (existing) {
    throw new Error("Already joined this challenge");
  }

  // Join challenge in transaction
  const [participant] = await prisma.$transaction([
    prisma.challengeParticipant.create({
      data: {
        challengeId,
        agentId,
        currentValue: 0,
        percentComplete: 0,
      },
    }),
    prisma.affiliateChallenge.update({
      where: { id: challengeId },
      data: { participantCount: { increment: 1 } },
    }),
  ]);

  // Award join XP
  await awardXp(agentId, "CHALLENGE_JOIN");

  return participant;
}

/**
 * Check if agent has joined a challenge
 */
export async function hasJoinedChallenge(
  agentId: string,
  challengeId: string
): Promise<{ hasJoined: boolean; participant: unknown | null }> {
  const participant = await prisma.challengeParticipant.findUnique({
    where: {
      challengeId_agentId: { challengeId, agentId },
    },
  });

  return {
    hasJoined: !!participant,
    participant,
  };
}

/**
 * Get agent's challenges
 */
export async function getAgentChallenges(agentId: string) {
  return prisma.challengeParticipant.findMany({
    where: { agentId },
    include: {
      challenge: {
        include: {
          campaign: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

/**
 * Update participant progress
 * Called when relevant action happens (referral, click, etc.)
 */
export async function updateChallengeProgress(
  agentId: string,
  campaignId: string,
  update: {
    referralCount?: number;
    volume?: number;
    clicks?: number;
    saleAmount?: number;
  }
) {
  // Find active challenges for this campaign
  const challenges = await prisma.affiliateChallenge.findMany({
    where: {
      campaignId,
      status: "ACTIVE",
    },
  });

  for (const challenge of challenges) {
    // Check if agent is participating
    const participant = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_agentId: { challengeId: challenge.id, agentId },
      },
    });

    if (!participant) continue;

    // Calculate new value based on challenge type
    let newValue = participant.currentValue;

    switch (challenge.type) {
      case "RACE_TO_TARGET":
      case "MOST_REFERRALS":
        if (update.referralCount) {
          newValue += update.referralCount;
        }
        break;

      case "MOST_VOLUME":
        if (update.volume) {
          // Store as wei-like integer (volume * 1000 for precision)
          newValue = Math.round(
            (participant.currentValue + update.volume * 1000)
          );
        }
        break;

      case "VIRAL_WAVE":
        if (update.clicks) {
          newValue += update.clicks;
        }
        break;

      case "WHALE_HUNTER":
        if (update.saleAmount) {
          // Only update if this is a higher sale
          const saleAsInt = Math.round(update.saleAmount * 1000);
          if (saleAsInt > participant.currentValue) {
            newValue = saleAsInt;
          }
        }
        break;

      case "STREAK_MASTER":
      case "CONSISTENCY":
        // These are calculated via daily cron
        break;
    }

    if (newValue !== participant.currentValue) {
      const percentComplete = Math.min(
        100,
        (newValue / challenge.targetValue) * 100
      );

      const updateData: {
        currentValue: number;
        percentComplete: number;
        completedAt?: Date;
      } = {
        currentValue: newValue,
        percentComplete,
      };

      // For RACE_TO_TARGET, mark completion time
      if (
        challenge.type === "RACE_TO_TARGET" &&
        newValue >= challenge.targetValue &&
        !participant.completedAt
      ) {
        updateData.completedAt = new Date();
      }

      await prisma.challengeParticipant.update({
        where: { id: participant.id },
        data: updateData,
      });
    }
  }
}

/**
 * Update daily streak/consistency challenges
 * Called by daily cron
 */
export async function updateDailyChallenges() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Find active streak/consistency challenges
  const challenges = await prisma.affiliateChallenge.findMany({
    where: {
      status: "ACTIVE",
      type: { in: ["STREAK_MASTER", "CONSISTENCY"] },
    },
    include: {
      participants: {
        include: {
          agent: {
            select: { id: true, currentStreak: true, lastReferralAt: true },
          },
        },
      },
    },
  });

  for (const challenge of challenges) {
    for (const participant of challenge.participants) {
      const agent = participant.agent;

      if (challenge.type === "STREAK_MASTER") {
        // Update based on agent's current streak
        if (agent.currentStreak > participant.currentValue) {
          const percentComplete = Math.min(
            100,
            (agent.currentStreak / challenge.targetValue) * 100
          );

          await prisma.challengeParticipant.update({
            where: { id: participant.id },
            data: {
              currentValue: agent.currentStreak,
              percentComplete,
            },
          });
        }
      }

      if (challenge.type === "CONSISTENCY") {
        // Count unique days with referrals during challenge period
        const activeDays = await prisma.affiliateCommission.groupBy({
          by: ["createdAt"],
          where: {
            agentId: agent.id,
            createdAt: {
              gte: challenge.startAt,
              lte: challenge.endAt,
            },
          },
        });

        const uniqueDays = new Set(
          activeDays.map((d) => d.createdAt.toISOString().split("T")[0])
        ).size;

        if (uniqueDays !== participant.currentValue) {
          const percentComplete = Math.min(
            100,
            (uniqueDays / challenge.targetValue) * 100
          );

          await prisma.challengeParticipant.update({
            where: { id: participant.id },
            data: {
              currentValue: uniqueDays,
              percentComplete,
            },
          });
        }
      }
    }
  }
}

/**
 * Calculate and update challenge rankings
 */
export async function updateChallengeRankings(challengeId: string) {
  const challenge = await prisma.affiliateChallenge.findUnique({
    where: { id: challengeId },
    select: { type: true },
  });

  if (!challenge) return;

  // Get participants ordered by score
  const participants = await prisma.challengeParticipant.findMany({
    where: { challengeId },
    orderBy:
      challenge.type === "RACE_TO_TARGET"
        ? [{ completedAt: "asc" }, { currentValue: "desc" }]
        : { currentValue: "desc" },
  });

  // Update ranks in batch
  const updates = participants.map((participant, index) =>
    prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        previousRank: participant.currentRank,
        currentRank: index + 1,
      },
    })
  );

  await prisma.$transaction(updates);
}

/**
 * End challenge and distribute prizes
 */
export async function endChallenge(challengeId: string) {
  const challenge = await prisma.affiliateChallenge.findUnique({
    where: { id: challengeId },
    include: {
      participants: {
        orderBy: [{ completedAt: "asc" }, { currentValue: "desc" }],
        include: {
          agent: {
            select: { userId: true, agentName: true, agentTag: true },
          },
        },
      },
    },
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  if (challenge.status !== "ACTIVE") {
    throw new Error("Challenge is not active");
  }

  // Mark as calculating
  await prisma.affiliateChallenge.update({
    where: { id: challengeId },
    data: { status: "CALCULATING" },
  });

  // Calculate final rankings
  const rankedParticipants = [...challenge.participants];

  // For RACE_TO_TARGET, sort by completion time first
  if (challenge.type === "RACE_TO_TARGET") {
    rankedParticipants.sort((a, b) => {
      if (a.completedAt && b.completedAt) {
        return a.completedAt.getTime() - b.completedAt.getTime();
      }
      if (a.completedAt) return -1;
      if (b.completedAt) return 1;
      return b.currentValue - a.currentValue;
    });
  }

  // Get prize distribution
  const distribution = challenge.prizeDistribution as Record<string, number>;
  const prizePool = Number(challenge.prizePool || 0);
  const nftPrizes = challenge.prizeNftIds || [];

  // Track winners for notifications
  const winners: Array<{
    rank: number;
    userId: string;
    agentName: string | null;
    prizeAmount: number;
    prizeNftId: string | null;
  }> = [];

  // Update participants with final ranks and prizes
  for (let i = 0; i < rankedParticipants.length; i++) {
    const participant = rankedParticipants[i];
    const rank = i + 1;
    let prizeAmount = 0;
    let prizeNftId: string | null = null;
    let xpAwarded = 0;

    // Calculate prize for winners
    if (rank <= challenge.winnersCount) {
      const placeKey = getPlaceKey(rank);
      const percentage = distribution[placeKey] || 0;
      prizeAmount = (prizePool * percentage) / 100;

      // Assign NFT prize if available for this rank position
      if (nftPrizes.length > 0 && rank <= nftPrizes.length) {
        prizeNftId = nftPrizes[rank - 1]; // 0-indexed array, 1-indexed rank
      }

      // Award XP based on placement
      if (rank === 1) {
        xpAwarded = XP_SOURCES.CHALLENGE_WIN;
      } else if (rank <= 3) {
        xpAwarded = XP_SOURCES.CHALLENGE_TOP_3;
      }

      // Track winner for notification
      winners.push({
        rank,
        userId: participant.agent.userId,
        agentName: participant.agent.agentName,
        prizeAmount,
        prizeNftId,
      });
    }

    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        finalRank: rank,
        prizeAmount: prizeAmount > 0 ? prizeAmount : null,
        prizeNftId,
        xpAwarded,
      },
    });

    // Award XP to agent
    if (xpAwarded > 0) {
      if (rank === 1) {
        await awardXp(participant.agentId, "CHALLENGE_WIN");
      } else if (rank <= 3) {
        await awardXp(participant.agentId, "CHALLENGE_TOP_3");
      }

      // Also award the challenge's custom XP reward
      if (rank === 1 && challenge.xpReward > 0) {
        await awardCustomXp(
          participant.agentId,
          challenge.xpReward,
          `Challenge win: ${challenge.name}`
        );
      }
    }

    // Update agent's total challenges won
    if (rank === 1) {
      await prisma.hypeAgent.update({
        where: { id: participant.agentId },
        data: { totalChallengesWon: { increment: 1 } },
      });
    }
  }

  // Update challenge status to completed
  await prisma.affiliateChallenge.update({
    where: { id: challengeId },
    data: { status: "COMPLETED" },
  });

  // Send notifications to winners
  await notifyWinners(challenge.id, challenge.name, winners);

  return { winnersCount: Math.min(challenge.winnersCount, rankedParticipants.length) };
}

/**
 * Send notifications to challenge winners
 */
async function notifyWinners(
  challengeId: string,
  challengeName: string,
  winners: Array<{
    rank: number;
    userId: string;
    agentName: string | null;
    prizeAmount: number;
    prizeNftId: string | null;
  }>
) {
  for (const winner of winners) {
    const prizeText = buildPrizeText(winner.prizeAmount, winner.prizeNftId);
    const title = `🏆 You placed #${winner.rank} in ${challengeName}!`;
    const message = prizeText
      ? `${prizeText} Claim your prize now.`
      : "Congratulations on your achievement!";

    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: winner.userId,
          type: "challenge_win",
          title,
          message,
          priority: "HIGH",
          isTimeSensitive: true,
          metadata: {
            challengeId,
            rank: winner.rank,
            prizeAmount: winner.prizeAmount,
            prizeNftId: winner.prizeNftId,
          },
        },
      });

      // Broadcast to active connections
      const event: NotificationEvent = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionType: null,
        actionStatus: notification.actionStatus,
        isTimeSensitive: notification.isTimeSensitive,
        expiresAt: null,
        nftId: null,
        collectionId: null,
        tradeId: null,
        offerId: null,
        relatedUserId: null,
        relatedAddress: null,
        metadata: notification.metadata as Record<string, unknown> | null,
        createdAt: notification.createdAt.toISOString(),
      };

      broadcastNotification(winner.userId, event);
    } catch (error) {
      console.error(
        `[Challenge] Failed to notify winner ${winner.userId}:`,
        error
      );
    }
  }
}

/**
 * Build prize description text
 */
function buildPrizeText(prizeAmount: number, prizeNftId: string | null): string {
  const parts: string[] = [];

  if (prizeAmount > 0) {
    parts.push(`You won ${prizeAmount.toFixed(4)} ETH`);
  }

  if (prizeNftId) {
    parts.push(prizeAmount > 0 ? " and an NFT prize!" : "You won an NFT prize!");
  } else if (prizeAmount > 0) {
    parts.push("!");
  }

  return parts.join("");
}

/**
 * Get challenge leaderboard
 */
export async function getChallengeLeaderboard(
  challengeId: string,
  limit: number = 50
) {
  const participants = await prisma.challengeParticipant.findMany({
    where: { challengeId },
    orderBy: { currentRank: "asc" },
    take: limit,
    include: {
      agent: {
        select: {
          agentTag: true,
          agentName: true,
          avatar: true,
          currentRank: true,
        },
      },
    },
  });

  return participants.map((p) => ({
    rank: p.currentRank,
    previousRank: p.previousRank,
    agentTag: p.agent.agentTag,
    agentName: p.agent.agentName,
    avatar: p.agent.avatar,
    agentRank: p.agent.currentRank,
    currentValue: p.currentValue,
    percentComplete: p.percentComplete,
    completedAt: p.completedAt,
  }));
}

/**
 * Cancel a challenge
 */
export async function cancelChallenge(challengeId: string, creatorId: string) {
  const challenge = await prisma.affiliateChallenge.findUnique({
    where: { id: challengeId },
    include: {
      campaign: {
        select: { creatorId: true },
      },
    },
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  if (challenge.campaign.creatorId !== creatorId) {
    throw new Error("Unauthorized");
  }

  if (challenge.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed challenge");
  }

  await prisma.affiliateChallenge.update({
    where: { id: challengeId },
    data: { status: "CANCELLED" },
  });

  return { success: true };
}

/**
 * Check and update challenge statuses based on dates
 * Called by cron job to manage challenge lifecycle
 */
export async function updateChallengeStatuses() {
  const now = new Date();

  // Start UPCOMING challenges that have reached startAt
  const startedCount = await prisma.affiliateChallenge.updateMany({
    where: {
      status: "UPCOMING",
      startAt: { lte: now },
    },
    data: { status: "ACTIVE" },
  });

  if (startedCount.count > 0) {
    console.log(`[Challenges] Started ${startedCount.count} challenges`);
  }

  // Find ACTIVE challenges that have reached endAt
  const endingChallenges = await prisma.affiliateChallenge.findMany({
    where: {
      status: "ACTIVE",
      endAt: { lte: now },
    },
    select: { id: true, name: true },
  });

  // End each challenge (calculates rankings, distributes prizes)
  for (const challenge of endingChallenges) {
    try {
      await endChallenge(challenge.id);
      console.log(`[Challenges] Ended challenge: ${challenge.name}`);
    } catch (error) {
      console.error(
        `[Challenges] Failed to end challenge ${challenge.id}:`,
        error
      );
    }
  }

  return {
    started: startedCount.count,
    ended: endingChallenges.length,
  };
}

/**
 * Get unclaimed prizes for an agent
 */
export async function getUnclaimedPrizes(agentId: string) {
  return prisma.challengeParticipant.findMany({
    where: {
      agentId,
      prizeClaimed: false,
      challenge: { status: "COMPLETED" },
      OR: [
        { prizeAmount: { not: null } },
        { prizeNftId: { not: null } },
      ],
    },
    include: {
      challenge: {
        select: { id: true, name: true, bannerImage: true },
      },
    },
    orderBy: { challenge: { endAt: "desc" } },
  });
}

/**
 * Claim a prize from a completed challenge
 */
export async function claimPrize(participantId: string, agentId: string) {
  const participant = await prisma.challengeParticipant.findUnique({
    where: { id: participantId },
    include: {
      challenge: {
        select: { status: true, name: true },
      },
    },
  });

  if (!participant) {
    throw new Error("Participation not found");
  }

  if (participant.agentId !== agentId) {
    throw new Error("Unauthorized");
  }

  if (participant.prizeClaimed) {
    throw new Error("Prize already claimed");
  }

  if (participant.challenge.status !== "COMPLETED") {
    throw new Error("Challenge not completed");
  }

  if (!participant.prizeAmount && !participant.prizeNftId) {
    throw new Error("No prize to claim");
  }

  // Mark as claimed
  await prisma.challengeParticipant.update({
    where: { id: participantId },
    data: {
      prizeClaimed: true,
      prizeClaimedAt: new Date(),
    },
  });

  return {
    prizeAmount: participant.prizeAmount ? Number(participant.prizeAmount) : null,
    prizeNftId: participant.prizeNftId,
    challengeName: participant.challenge.name,
  };
}

// Helper function
function getPlaceKey(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}
