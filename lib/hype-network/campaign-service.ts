/**
 * Campaign Service - Affiliate campaign management for Hype Network
 */
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";
import { z } from "zod";

// Zod schemas for validation
export const CreateCampaignSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  bannerImage: z.string().url().optional(),
  collectionId: z.string().uuid().optional(),
  lootboxId: z.string().uuid().optional(),
  baseCommissionBps: z.number().min(100).max(5000).default(500), // 1% - 50%
  bonusCommissionBps: z.number().min(0).max(2000).optional(),
  totalBudget: z.number().min(0).optional(),
  maxAgents: z.number().min(1).optional(),
  startAt: z.date(),
  endAt: z.date(),
  xpPerReferral: z.number().min(0).max(1000).default(100),
  xpBonusFirstSale: z.number().min(0).max(2000).default(500),
  isPublic: z.boolean().default(true),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  bannerImage: z.string().url().optional().nullable(),
  baseCommissionBps: z.number().min(100).max(5000).optional(),
  bonusCommissionBps: z.number().min(0).max(2000).optional().nullable(),
  totalBudget: z.number().min(0).optional().nullable(),
  maxAgents: z.number().min(1).optional().nullable(),
  endAt: z.date().optional(),
  xpPerReferral: z.number().min(0).max(1000).optional(),
  xpBonusFirstSale: z.number().min(0).max(2000).optional(),
  isPublic: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
});

export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

/**
 * Create a new affiliate campaign
 */
export async function createCampaign(
  creatorId: string,
  input: CreateCampaignInput
) {
  // Validate dates
  if (input.endAt <= input.startAt) {
    throw new Error("End date must be after start date");
  }

  // Require either collection or lootbox
  if (!input.collectionId && !input.lootboxId) {
    throw new Error("Campaign must be linked to a collection or lootbox");
  }

  // Cannot link to both
  if (input.collectionId && input.lootboxId) {
    throw new Error("Campaign can only be linked to one target (collection or lootbox)");
  }

  // Determine initial status based on dates
  const now = new Date();
  let status: CampaignStatus = "DRAFT";
  if (input.startAt <= now && input.endAt > now) {
    status = "ACTIVE";
  } else if (input.startAt > now) {
    status = "SCHEDULED";
  }

  const campaign = await prisma.affiliateCampaign.create({
    data: {
      creatorId,
      name: input.name,
      description: input.description,
      bannerImage: input.bannerImage,
      collectionId: input.collectionId,
      lootboxId: input.lootboxId,
      baseCommissionBps: input.baseCommissionBps,
      bonusCommissionBps: input.bonusCommissionBps,
      totalBudget: input.totalBudget,
      maxAgents: input.maxAgents,
      startAt: input.startAt,
      endAt: input.endAt,
      xpPerReferral: input.xpPerReferral,
      xpBonusFirstSale: input.xpBonusFirstSale ?? 500,
      isPublic: input.isPublic,
      status,
    },
    include: {
      collection: {
        select: { id: true, name: true, image: true, address: true },
      },
      lootbox: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  console.log(`[Campaign] Created campaign: ${campaign.id} (${campaign.name})`);

  return campaign;
}

/**
 * Get campaign by ID with full details
 */
export async function getCampaignById(campaignId: string) {
  return prisma.affiliateCampaign.findUnique({
    where: { id: campaignId },
    include: {
      collection: {
        select: { id: true, name: true, image: true, address: true, slug: true },
      },
      lootbox: {
        select: { id: true, name: true, image: true },
      },
      creator: {
        select: { id: true, username: true, profilePicture: true, walletAddress: true },
      },
      _count: {
        select: { links: true, challenges: true },
      },
    },
  });
}

/**
 * Get active campaigns for agents to join
 */
export async function getActiveCampaigns(options?: {
  limit?: number;
  cursor?: string;
  featured?: boolean;
  creatorId?: string;
}) {
  const { limit = 20, cursor, featured, creatorId } = options || {};

  const campaigns = await prisma.affiliateCampaign.findMany({
    where: {
      status: "ACTIVE",
      isPublic: true,
      ...(featured !== undefined && { isFeatured: featured }),
      ...(creatorId && { creatorId }),
    },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: [
      { isFeatured: "desc" },
      { totalAgents: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      collection: {
        select: { id: true, name: true, image: true, address: true, slug: true },
      },
      lootbox: {
        select: { id: true, name: true, image: true },
      },
      creator: {
        select: { id: true, username: true, profilePicture: true },
      },
      _count: {
        select: { links: true },
      },
    },
  });

  const hasMore = campaigns.length > limit;
  const items = hasMore ? campaigns.slice(0, -1) : campaigns;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/**
 * Get campaigns created by a specific user
 */
export async function getCreatorCampaigns(creatorId: string, options?: {
  limit?: number;
  cursor?: string;
  status?: CampaignStatus;
}) {
  const { limit = 20, cursor, status } = options || {};

  const campaigns = await prisma.affiliateCampaign.findMany({
    where: {
      creatorId,
      ...(status && { status }),
    },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    include: {
      collection: {
        select: { id: true, name: true, image: true },
      },
      lootbox: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { links: true, challenges: true },
      },
    },
  });

  const hasMore = campaigns.length > limit;
  const items = hasMore ? campaigns.slice(0, -1) : campaigns;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/**
 * Update campaign details
 */
export async function updateCampaign(
  campaignId: string,
  creatorId: string,
  input: UpdateCampaignInput
) {
  // Verify ownership
  const campaign = await prisma.affiliateCampaign.findUnique({
    where: { id: campaignId },
    select: { creatorId: true, status: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.creatorId !== creatorId) {
    throw new Error("Not authorized to update this campaign");
  }

  // Cannot update ended or cancelled campaigns
  if (campaign.status === "ENDED" || campaign.status === "CANCELLED") {
    throw new Error("Cannot update a campaign that has ended or been cancelled");
  }

  return prisma.affiliateCampaign.update({
    where: { id: campaignId },
    data: input,
    include: {
      collection: {
        select: { id: true, name: true, image: true },
      },
      lootbox: {
        select: { id: true, name: true, image: true },
      },
    },
  });
}

/**
 * Cancel a campaign (soft delete)
 */
export async function cancelCampaign(campaignId: string, creatorId: string) {
  const campaign = await prisma.affiliateCampaign.findUnique({
    where: { id: campaignId },
    select: { creatorId: true, status: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.creatorId !== creatorId) {
    throw new Error("Not authorized to cancel this campaign");
  }

  if (campaign.status === "ENDED" || campaign.status === "CANCELLED") {
    throw new Error("Campaign is already ended or cancelled");
  }

  return prisma.affiliateCampaign.update({
    where: { id: campaignId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Check if agent can join campaign
 */
export async function canJoinCampaign(
  agentId: string,
  campaignId: string
): Promise<{ canJoin: boolean; reason?: string }> {
  const campaign = await prisma.affiliateCampaign.findUnique({
    where: { id: campaignId },
    select: {
      status: true,
      maxAgents: true,
      totalAgents: true,
      isPublic: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!campaign) {
    return { canJoin: false, reason: "Campaign not found" };
  }

  const now = new Date();

  if (campaign.status !== "ACTIVE") {
    if (campaign.status === "SCHEDULED" && campaign.startAt > now) {
      return { canJoin: false, reason: "Campaign has not started yet" };
    }
    if (campaign.status === "ENDED" || campaign.endAt < now) {
      return { canJoin: false, reason: "Campaign has ended" };
    }
    if (campaign.status === "CANCELLED") {
      return { canJoin: false, reason: "Campaign was cancelled" };
    }
    return { canJoin: false, reason: "Campaign is not active" };
  }

  if (campaign.maxAgents && campaign.totalAgents >= campaign.maxAgents) {
    return { canJoin: false, reason: "Campaign has reached maximum agents" };
  }

  // Check if already joined
  const existingLink = await prisma.affiliateLink.findUnique({
    where: {
      agentId_campaignId: { agentId, campaignId },
    },
  });

  if (existingLink) {
    return { canJoin: false, reason: "Already joined this campaign" };
  }

  return { canJoin: true };
}

/**
 * Get campaign stats
 */
export async function getCampaignStats(campaignId: string) {
  const campaign = await prisma.affiliateCampaign.findUnique({
    where: { id: campaignId },
    select: {
      totalAgents: true,
      totalReferrals: true,
      totalVolume: true,
      spentBudget: true,
      totalBudget: true,
      _count: {
        select: { links: true, challenges: true },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  // Get top performers - need to fetch agent data separately since no relation
  const topPerformerEntries = await prisma.campaignLeaderboard.findMany({
    where: { campaignId },
    orderBy: { referrals: "desc" },
    take: 5,
  });

  // Fetch agent details for top performers
  const topPerformerAgentIds = topPerformerEntries.map(e => e.agentId);
  const topPerformerAgents = await prisma.hypeAgent.findMany({
    where: { id: { in: topPerformerAgentIds } },
    select: { id: true, agentName: true, agentTag: true, avatar: true, currentRank: true },
  });
  const agentMap = new Map(topPerformerAgents.map(a => [a.id, a]));
  const topPerformers = topPerformerEntries.map(entry => ({
    ...entry,
    agent: agentMap.get(entry.agentId) || null,
  }));

  // Get recent conversions
  const recentConversions = await prisma.affiliateCommission.findMany({
    where: {
      link: { campaignId },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      totalCommission: true,
      createdAt: true,
      agent: {
        select: { agentTag: true },
      },
    },
  });

  return {
    ...campaign,
    budgetRemaining: campaign.totalBudget
      ? Number(campaign.totalBudget) - Number(campaign.spentBudget)
      : null,
    topPerformers,
    recentConversions,
  };
}

/**
 * Update campaign statuses based on dates (to be called by cron)
 */
export async function updateCampaignStatuses() {
  const now = new Date();

  // Activate scheduled campaigns that have started
  const activatedCount = await prisma.affiliateCampaign.updateMany({
    where: {
      status: "SCHEDULED",
      startAt: { lte: now },
      endAt: { gt: now },
    },
    data: { status: "ACTIVE" },
  });

  // End expired campaigns
  const endedCount = await prisma.affiliateCampaign.updateMany({
    where: {
      status: "ACTIVE",
      endAt: { lt: now },
    },
    data: { status: "ENDED" },
  });

  // Also check for budget exhaustion
  const exhaustedCampaigns = await prisma.affiliateCampaign.findMany({
    where: {
      status: "ACTIVE",
      totalBudget: { not: null },
    },
    select: {
      id: true,
      totalBudget: true,
      spentBudget: true,
    },
  });

  let pausedCount = 0;
  for (const campaign of exhaustedCampaigns) {
    if (campaign.totalBudget && Number(campaign.spentBudget) >= Number(campaign.totalBudget)) {
      await prisma.affiliateCampaign.update({
        where: { id: campaign.id },
        data: { status: "PAUSED" },
      });
      pausedCount++;
    }
  }

  console.log(
    `[Campaign Status] Activated: ${activatedCount.count}, Ended: ${endedCount.count}, Paused: ${pausedCount}`
  );

  return {
    activated: activatedCount.count,
    ended: endedCount.count,
    paused: pausedCount,
  };
}

/**
 * Get campaign leaderboard
 */
export async function getCampaignLeaderboard(campaignId: string, options?: {
  limit?: number;
  cursor?: string;
}) {
  const { limit = 20, cursor } = options || {};

  const entries = await prisma.campaignLeaderboard.findMany({
    where: { campaignId },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: [
      { referrals: "desc" },
      { volume: "desc" },
    ],
  });

  const hasMore = entries.length > limit;
  const items = hasMore ? entries.slice(0, -1) : entries;

  // Fetch agent details separately since no relation defined in schema
  const agentIds = items.map(e => e.agentId);
  const agents = await prisma.hypeAgent.findMany({
    where: { id: { in: agentIds } },
    select: {
      id: true,
      agentName: true,
      agentTag: true,
      avatar: true,
      currentRank: true,
    },
  });
  const agentMap = new Map(agents.map(a => [a.id, a]));

  // Add rank numbers and agent data
  const rankedItems = items.map((entry, index) => ({
    ...entry,
    agent: agentMap.get(entry.agentId) || null,
    rank: index + 1,
  }));

  return {
    items: rankedItems,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// Type for campaign leaderboard entry
interface CampaignLeaderboardEntry {
  campaignId: string;
  agentId: string;
}

/**
 * Update campaign leaderboard rankings
 */
export async function updateCampaignLeaderboardRanks(campaignId: string) {
  // Get all entries sorted by performance
  const entries = await prisma.campaignLeaderboard.findMany({
    where: { campaignId },
    orderBy: [
      { referrals: "desc" },
      { volume: "desc" },
      { earnings: "desc" },
    ],
    select: {
      campaignId: true,
      agentId: true,
    },
  });

  // Update ranks in batches
  const updatePromises = entries.map((entry: CampaignLeaderboardEntry, index: number) =>
    prisma.campaignLeaderboard.update({
      where: {
        campaignId_agentId: {
          campaignId: entry.campaignId,
          agentId: entry.agentId,
        },
      },
      data: { rank: index + 1 },
    })
  );

  await Promise.all(updatePromises);

  console.log(`[Campaign] Updated ${entries.length} leaderboard ranks for campaign ${campaignId}`);
}
