/**
 * Link Service - Affiliate link generation and tracking for Hype Network
 */
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { awardReferralXp } from "./xp-service";
import { updateStreak } from "./streak-service";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Generate unique link code from agent tag and campaign name
 */
function generateLinkCode(agentTag: string, campaignName: string): string {
  // Extract first part of agent tag (before #)
  const agentPart = agentTag.split("#")[0].slice(0, 10).toUpperCase();
  // Create short campaign identifier
  const campaignPart = campaignName
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
  // Add unique suffix
  const suffix = nanoid(4).toUpperCase();

  return `${agentPart}-${campaignPart}-${suffix}`;
}

/**
 * Generate a short unique code (for custom codes)
 */
function generateShortCode(): string {
  return nanoid(8).toUpperCase();
}

/**
 * Create affiliate link for agent joining a campaign
 */
export async function createAffiliateLink(
  agentId: string,
  campaignId: string,
  customCode?: string
) {
  // Get agent and campaign
  const [agent, campaign] = await Promise.all([
    prisma.hypeAgent.findUnique({
      where: { id: agentId },
      select: { id: true, agentTag: true, totalCampaigns: true },
    }),
    prisma.affiliateCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        totalAgents: true,
        status: true,
        maxAgents: true,
      },
    }),
  ]);

  if (!agent) {
    throw new Error("Agent not found");
  }

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status !== "ACTIVE") {
    throw new Error("Campaign is not active");
  }

  if (campaign.maxAgents && campaign.totalAgents >= campaign.maxAgents) {
    throw new Error("Campaign has reached maximum agents");
  }

  // Generate or validate code
  let code = customCode?.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!code) {
    code = generateLinkCode(agent.agentTag, campaign.name);
  }

  // Ensure code length is reasonable
  if (code.length < 4 || code.length > 32) {
    throw new Error("Link code must be between 4 and 32 characters");
  }

  // Check code uniqueness
  const existing = await prisma.affiliateLink.findUnique({
    where: { code },
  });

  if (existing) {
    // Try generating a new unique code
    code = `${code}-${nanoid(3).toUpperCase()}`;
    const stillExists = await prisma.affiliateLink.findUnique({
      where: { code },
    });
    if (stillExists) {
      throw new Error("Link code already exists. Please try a different custom code.");
    }
  }

  // Create link and update counters in transaction
  const link = await prisma.$transaction(async (tx) => {
    // Create the affiliate link
    const newLink = await tx.affiliateLink.create({
      data: {
        agentId,
        campaignId,
        code,
      },
    });

    // Update campaign agent count
    await tx.affiliateCampaign.update({
      where: { id: campaignId },
      data: { totalAgents: { increment: 1 } },
    });

    // Update agent campaign count
    await tx.hypeAgent.update({
      where: { id: agentId },
      data: { totalCampaigns: { increment: 1 } },
    });

    // Create campaign leaderboard entry for this agent
    await tx.campaignLeaderboard.create({
      data: {
        campaignId,
        agentId,
      },
    });

    return newLink;
  });

  console.log(`[Link] Created affiliate link: ${code} for agent ${agent.agentTag}`);

  return link;
}

/**
 * Get affiliate link by code
 */
export async function getLinkByCode(code: string) {
  return prisma.affiliateLink.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      agent: {
        select: { id: true, agentTag: true, agentName: true, avatar: true },
      },
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
          collectionId: true,
          lootboxId: true,
          collection: {
            select: { address: true, slug: true, name: true },
          },
          lootbox: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}

/**
 * Get all links for an agent
 */
export async function getAgentLinks(agentId: string, options?: {
  limit?: number;
  cursor?: string;
  isActive?: boolean;
}) {
  const { limit = 20, cursor, isActive } = options || {};

  const links = await prisma.affiliateLink.findMany({
    where: {
      agentId,
      ...(isActive !== undefined && { isActive }),
    },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
          baseCommissionBps: true,
          endAt: true,
          collection: {
            select: { name: true, image: true },
          },
          lootbox: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  const hasMore = links.length > limit;
  const items = hasMore ? links.slice(0, -1) : links;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/**
 * Get link stats by ID
 */
export async function getLinkStats(linkId: string, agentId?: string) {
  const link = await prisma.affiliateLink.findUnique({
    where: { id: linkId },
    include: {
      campaign: {
        select: { name: true, status: true, baseCommissionBps: true },
      },
      commissions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          saleAmount: true,
          totalCommission: true,
          buyerAddress: true,
          createdAt: true,
        },
      },
      _count: {
        select: { clickEvents: true, commissions: true },
      },
    },
  });

  if (!link) {
    return null;
  }

  // Verify ownership if agentId provided
  if (agentId && link.agentId !== agentId) {
    throw new Error("Not authorized to view this link");
  }

  // Get click stats for last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentClicks = await prisma.affiliateLinkClick.groupBy({
    by: ["createdAt"],
    where: {
      linkId,
      createdAt: { gte: sevenDaysAgo },
    },
    _count: true,
  });

  return {
    ...link,
    clickHistory: recentClicks,
  };
}

export interface VisitorInfo {
  ip: string;
  userAgent: string;
  referrer?: string;
}

/**
 * Track a link click
 */
export async function trackClick(code: string, visitorInfo: VisitorInfo) {
  // Find link with campaign info
  const link = await prisma.affiliateLink.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      campaign: {
        select: {
          id: true,
          status: true,
          collectionId: true,
          lootboxId: true,
          collection: {
            select: { address: true, slug: true },
          },
        },
      },
    },
  });

  if (!link || !link.isActive) {
    console.log(`[Link] Invalid or inactive link: ${code}`);
    return null;
  }

  if (link.campaign.status !== "ACTIVE") {
    console.log(`[Link] Campaign not active for link: ${code}`);
    return null;
  }

  // Hash visitor for uniqueness check (privacy-preserving)
  const visitorHash = crypto
    .createHash("sha256")
    .update(`${visitorInfo.ip}:${visitorInfo.userAgent}`)
    .digest("hex")
    .slice(0, 32);

  // Check if unique visitor within last 24 hours
  const existingClick = await prisma.affiliateLinkClick.findFirst({
    where: {
      linkId: link.id,
      visitorHash,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const isUnique = !existingClick;

  // Record click event
  await prisma.affiliateLinkClick.create({
    data: {
      linkId: link.id,
      visitorHash,
      userAgent: visitorInfo.userAgent?.slice(0, 500), // Limit length
      referrer: visitorInfo.referrer?.slice(0, 500),
    },
  });

  // Update link stats atomically
  await prisma.affiliateLink.update({
    where: { id: link.id },
    data: {
      clicks: { increment: 1 },
      ...(isUnique && { uniqueVisitors: { increment: 1 } }),
    },
  });

  console.log(`[Link] Click tracked: ${code} (unique: ${isUnique})`);

  // Determine redirect target
  const redirectTo = link.campaign.collection
    ? `/marketplace/collection/${link.campaign.collection.slug || link.campaign.collection.address}`
    : `/lootboxes/${link.campaign.lootboxId}`;

  return {
    linkId: link.id,
    agentId: link.agentId,
    campaignId: link.campaignId,
    redirectTo,
    visitorHash,
    isUnique,
  };
}

export interface ConversionParams {
  linkId: string;
  buyerAddress: string;
  txHash: string;
  saleAmount: number;
}

/**
 * Record a conversion (sale attributed to affiliate link)
 */
export async function recordConversion(params: ConversionParams) {
  const { linkId, buyerAddress, txHash, saleAmount } = params;

  // Check if this txHash already has a commission
  const existingCommission = await prisma.affiliateCommission.findUnique({
    where: { txHash },
  });

  if (existingCommission) {
    console.log(`[Link] Conversion already recorded for tx: ${txHash}`);
    return existingCommission;
  }

  // Get link with campaign and agent info
  const link = await prisma.affiliateLink.findUnique({
    where: { id: linkId },
    include: {
      agent: {
        select: { id: true, commissionMultiplier: true, totalReferrals: true },
      },
      campaign: {
        select: {
          id: true,
          baseCommissionBps: true,
          bonusCommissionBps: true,
          xpPerReferral: true,
          xpBonusFirstSale: true,
          spentBudget: true,
          totalBudget: true,
        },
      },
      _count: {
        select: { commissions: true },
      },
    },
  });

  if (!link) {
    throw new Error("Link not found");
  }

  const isFirstSale = link._count.commissions === 0;
  const isAgentFirstSale = link.agent.totalReferrals === 0;

  // Calculate commission
  const commissionBps = link.campaign.baseCommissionBps;
  const bonusBps = link.campaign.bonusCommissionBps || 0;
  const multiplier = link.agent.commissionMultiplier;

  const baseCommission = (saleAmount * commissionBps) / 10000;
  const bonusCommission = (saleAmount * bonusBps) / 10000;
  const totalCommission = baseCommission * multiplier + bonusCommission;

  // Calculate XP to award
  const xpToAward =
    link.campaign.xpPerReferral +
    (isFirstSale ? link.campaign.xpBonusFirstSale : 0);

  // Record conversion in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create commission record
    const commission = await tx.affiliateCommission.create({
      data: {
        agentId: link.agentId,
        linkId: link.id,
        txHash,
        buyerAddress: buyerAddress.toLowerCase(),
        saleAmount: new Decimal(saleAmount),
        commissionBps,
        multiplier,
        baseCommission: new Decimal(baseCommission),
        bonusCommission: new Decimal(bonusCommission),
        totalCommission: new Decimal(totalCommission),
        xpAwarded: xpToAward,
      },
    });

    // Update link stats
    const newConversions = link.conversions + 1;
    const newTotalVolume = Number(link.totalVolume) + saleAmount;
    const newTotalEarnings = Number(link.totalEarnings) + totalCommission;
    const newConversionRate = link.clicks > 0
      ? (newConversions / link.clicks) * 100
      : 0;

    await tx.affiliateLink.update({
      where: { id: link.id },
      data: {
        conversions: newConversions,
        totalVolume: new Decimal(newTotalVolume),
        totalEarnings: new Decimal(newTotalEarnings),
        conversionRate: newConversionRate,
      },
    });

    // Update campaign stats
    await tx.affiliateCampaign.update({
      where: { id: link.campaignId },
      data: {
        totalReferrals: { increment: 1 },
        totalVolume: { increment: saleAmount },
        spentBudget: { increment: totalCommission },
      },
    });

    // Update agent earnings
    await tx.hypeAgent.update({
      where: { id: link.agentId },
      data: {
        totalReferrals: { increment: 1 },
        totalEarnings: { increment: totalCommission },
        lastReferralAt: new Date(),
      },
    });

    // Update campaign leaderboard
    await tx.campaignLeaderboard.update({
      where: {
        campaignId_agentId: {
          campaignId: link.campaignId,
          agentId: link.agentId,
        },
      },
      data: {
        referrals: { increment: 1 },
        volume: { increment: saleAmount },
        earnings: { increment: totalCommission },
      },
    });

    // Mark most recent unconverted click as converted
    const recentClick = await tx.affiliateLinkClick.findFirst({
      where: {
        linkId: link.id,
        converted: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentClick) {
      await tx.affiliateLinkClick.update({
        where: { id: recentClick.id },
        data: {
          converted: true,
          convertedAt: new Date(),
          conversionTxHash: txHash,
        },
      });
    }

    return commission;
  });

  // Award XP (outside transaction for isolation)
  try {
    await awardReferralXp(
      link.agentId,
      link.campaign.xpPerReferral,
      isAgentFirstSale,
      isFirstSale
    );
  } catch (xpError) {
    console.error("[Link] Failed to award XP:", xpError);
    // Don't fail the conversion if XP fails
  }

  // Update streak
  try {
    await updateStreak(link.agentId);
  } catch (streakError) {
    console.error("[Link] Failed to update streak:", streakError);
  }

  console.log(
    `[Link] Conversion recorded: ${txHash} - ${totalCommission.toFixed(6)} ETH commission`
  );

  return result;
}

/**
 * Deactivate a link
 */
export async function deactivateLink(linkId: string, agentId: string) {
  const link = await prisma.affiliateLink.findUnique({
    where: { id: linkId },
    select: { agentId: true },
  });

  if (!link) {
    throw new Error("Link not found");
  }

  if (link.agentId !== agentId) {
    throw new Error("Not authorized to deactivate this link");
  }

  return prisma.affiliateLink.update({
    where: { id: linkId },
    data: { isActive: false },
  });
}

/**
 * Reactivate a link
 */
export async function reactivateLink(linkId: string, agentId: string) {
  const link = await prisma.affiliateLink.findUnique({
    where: { id: linkId },
    include: {
      campaign: {
        select: { status: true },
      },
    },
  });

  if (!link) {
    throw new Error("Link not found");
  }

  if (link.agentId !== agentId) {
    throw new Error("Not authorized to reactivate this link");
  }

  if (link.campaign.status !== "ACTIVE") {
    throw new Error("Cannot reactivate link for inactive campaign");
  }

  return prisma.affiliateLink.update({
    where: { id: linkId },
    data: { isActive: true },
  });
}

/**
 * Get referral conversions for a buyer address
 * Used to check attribution before minting
 */
export async function getAttributedLink(buyerAddress: string) {
  // Find most recent commission for this buyer
  const recentCommission = await prisma.affiliateCommission.findFirst({
    where: {
      buyerAddress: buyerAddress.toLowerCase(),
    },
    orderBy: { createdAt: "desc" },
    include: {
      link: {
        select: { id: true, code: true, campaignId: true },
      },
    },
  });

  return recentCommission?.link || null;
}
