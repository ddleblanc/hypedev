/**
 * Hype Network tRPC Router
 * Gamified affiliate system for HPX
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../index";
import {
  calculateRankProgress,
  getXpToNextRank,
  getNextRank,
  awardXp,
  awardCustomXp,
  XP_SOURCES,
  type XpSource,
} from "@/lib/hype-network/xp-service";
import {
  getStreakStatus,
  getStreakLeaderboard,
  getStreakMilestones,
} from "@/lib/hype-network/streak-service";
import {
  RANK_DISPLAY_NAMES,
  RANK_COLORS,
  RANK_ICONS,
  RANK_PERKS,
  getAllRanks,
} from "@/lib/hype-network/rank-utils";
import {
  createCampaign,
  getCampaignById,
  getActiveCampaigns,
  getCreatorCampaigns,
  updateCampaign,
  cancelCampaign,
  canJoinCampaign,
  getCampaignStats,
  getCampaignLeaderboard,
  CreateCampaignSchema,
  UpdateCampaignSchema,
} from "@/lib/hype-network/campaign-service";
import {
  createAffiliateLink,
  getAgentLinks,
  getLinkStats,
  deactivateLink,
  reactivateLink,
} from "@/lib/hype-network/link-service";
import {
  getEarningsSummary,
  getCommissionHistory,
  canRequestPayout,
  requestPayout,
  getPayoutHistory,
} from "@/lib/hype-network/commission-service";
import {
  createChallenge,
  getChallengeById,
  listChallenges,
  joinChallenge,
  hasJoinedChallenge,
  getAgentChallenges,
  getChallengeLeaderboard,
  cancelChallenge,
  claimPrize,
  getUnclaimedPrizes,
  CreateChallengeSchema,
} from "@/lib/hype-network/challenge-service";
import {
  checkAndUnlockAchievements,
  getAgentAchievements,
  getAchievementShowcase,
  getAgentAchievementStats,
  getRarestAchievements,
  getRecentAchievements,
} from "@/lib/hype-network/achievement-service";
import {
  getGlobalLeaderboard,
  getAgentLeaderboardPosition,
  getLeaderboardSummary,
  getTopAgentsByPeriod,
  getLeaderboardStats,
  getRankDistribution,
  type LeaderboardType,
} from "@/lib/hype-network/leaderboard-service";
import { ACHIEVEMENTS, getAchievementById } from "@/lib/hype-network/achievements";

// Validation schemas
const RegisterAgentSchema = z.object({
  agentName: z.string().min(2).max(32).optional(),
  agentTag: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9_]+$/, "Tag must be uppercase alphanumeric"),
});

const UpdateAgentProfileSchema = z.object({
  agentName: z.string().min(2).max(32).optional(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

const GetAgentByTagSchema = z.object({
  agentTag: z.string(),
});

// Agent sub-router
const agentRouter = router({
  // Get current user's agent profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
        _count: {
          select: {
            links: true,
            commissions: true,
            achievements: true,
            challengeParticipations: true,
          },
        },
      },
    });

    return agent;
  }),

  // Register as a Hype Agent
  register: protectedProcedure
    .input(RegisterAgentSchema)
    .mutation(async ({ ctx, input }) => {
      // Get user ID from wallet
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found. Please create a profile first.",
        });
      }

      // Check if already registered
      const existing = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a Hype Agent",
        });
      }

      // Generate unique tag with discriminator
      let fullTag: string;
      let tagExists = true;
      let attempts = 0;

      do {
        const discriminator = Math.floor(1000 + Math.random() * 9000);
        fullTag = `${input.agentTag}#${discriminator}`;

        const existingTag = await ctx.prisma.hypeAgent.findUnique({
          where: { agentTag: fullTag },
        });

        tagExists = !!existingTag;
        attempts++;
      } while (tagExists && attempts < 10);

      if (tagExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Unable to generate unique tag. Please try a different tag.",
        });
      }

      // Create agent
      const agent = await ctx.prisma.hypeAgent.create({
        data: {
          userId: user.id,
          agentName: input.agentName,
          agentTag: fullTag,
        },
      });

      return agent;
    }),

  // Get agent by tag
  byTag: publicProcedure
    .input(GetAgentByTagSchema)
    .query(async ({ ctx, input }) => {
      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { agentTag: input.agentTag },
        include: {
          user: {
            select: {
              username: true,
              profilePicture: true,
            },
          },
        },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      // Don't expose sensitive data for public queries
      return {
        id: agent.id,
        agentTag: agent.agentTag,
        agentName: agent.agentName,
        avatar: agent.avatar,
        bio: agent.bio,
        currentRank: agent.currentRank,
        totalReferrals: agent.totalReferrals,
        totalChallengesWon: agent.totalChallengesWon,
        isVerified: agent.isVerified,
        user: agent.user,
        createdAt: agent.createdAt,
      };
    }),

  // Update agent profile
  update: protectedProcedure
    .input(UpdateAgentProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found. Please register first.",
        });
      }

      const updated = await ctx.prisma.hypeAgent.update({
        where: { id: agent.id },
        data: {
          agentName: input.agentName,
          avatar: input.avatar,
          bio: input.bio,
        },
      });

      return updated;
    }),

  // Get agent stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
      select: {
        totalXp: true,
        currentRank: true,
        rankProgress: true,
        totalReferrals: true,
        totalEarnings: true,
        totalCampaigns: true,
        totalChallengesWon: true,
        currentStreak: true,
        longestStreak: true,
        commissionMultiplier: true,
        isVerified: true,
        lastReferralAt: true,
      },
    });

    if (!agent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found. Please register first.",
      });
    }

    return agent;
  }),
});

// Progression sub-router
const progressionRouter = router({
  // Get detailed rank info for current agent
  rankInfo: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        totalXp: true,
        currentRank: true,
        rankProgress: true,
        commissionMultiplier: true,
      },
    });

    if (!agent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found. Please register first.",
      });
    }

    const nextRank = getNextRank(agent.currentRank);
    const xpToNext = getXpToNextRank(agent.totalXp, agent.currentRank);
    const allRanks = getAllRanks();

    return {
      currentRank: {
        rank: agent.currentRank,
        name: RANK_DISPLAY_NAMES[agent.currentRank],
        icon: RANK_ICONS[agent.currentRank],
        colors: RANK_COLORS[agent.currentRank],
        perks: RANK_PERKS[agent.currentRank],
      },
      nextRank: nextRank
        ? {
            rank: nextRank,
            name: RANK_DISPLAY_NAMES[nextRank],
            icon: RANK_ICONS[nextRank],
            colors: RANK_COLORS[nextRank],
            perks: RANK_PERKS[nextRank],
          }
        : null,
      totalXp: agent.totalXp,
      rankProgress: agent.rankProgress,
      xpToNextRank: xpToNext,
      commissionMultiplier: agent.commissionMultiplier,
      allRanks: allRanks.map((r) => ({
        rank: r.rank,
        name: r.name,
        icon: r.icon,
        threshold: r.threshold,
        multiplier: r.multiplier,
        isAchieved: r.threshold <= agent.totalXp,
        isCurrent: r.rank === agent.currentRank,
      })),
    };
  }),

  // Get streak status
  streakStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!agent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found. Please register first.",
      });
    }

    const status = await getStreakStatus(agent.id);
    const milestones = getStreakMilestones(status.currentStreak);

    return {
      ...status,
      milestones,
    };
  }),

  // Get streak leaderboard
  streakLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const leaderboard = await getStreakLeaderboard(input.limit);
      return leaderboard;
    }),

  // Award XP (admin only - for testing/manual awards)
  awardXp: protectedProcedure
    .input(
      z.object({
        source: z.enum([
          "REFERRAL_CONVERSION",
          "FIRST_SALE_BONUS",
          "CHALLENGE_JOIN",
          "CHALLENGE_TOP_3",
          "CHALLENGE_WIN",
          "DAILY_STREAK",
          "STREAK_MILESTONE_7",
          "STREAK_MILESTONE_30",
          "REFERRED_AGENT_SALE",
          "ACHIEVEMENT_UNLOCK",
          "CAMPAIGN_FIRST_CONVERSION",
          "HIGH_VALUE_SALE",
        ] as [XpSource, ...XpSource[]]),
        multiplier: z.number().min(0.1).max(10).default(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found. Please register first.",
        });
      }

      const result = await awardXp(agent.id, input.source, input.multiplier);

      return {
        ...result,
        source: input.source,
      };
    }),

  // Get available XP sources info
  xpSources: publicProcedure.query(() => {
    return Object.entries(XP_SOURCES).map(([key, value]) => ({
      source: key as XpSource,
      baseXp: value,
    }));
  }),
});

// Campaigns sub-router - Full Phase 3 implementation
const campaignsRouter = router({
  // List active campaigns
  list: publicProcedure
    .input(
      z
        .object({
          featured: z.boolean().optional(),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { featured, limit = 20, cursor } = input ?? {};
      return getActiveCampaigns({ featured, limit, cursor });
    }),

  // Get featured campaigns
  featured: publicProcedure.query(async () => {
    const result = await getActiveCampaigns({ featured: true, limit: 5 });
    return result.items;
  }),

  // Get campaign by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const campaign = await getCampaignById(input.id);
      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }
      return campaign;
    }),

  // Get campaign stats
  stats: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const stats = await getCampaignStats(input.id);
      if (!stats) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }
      return stats;
    }),

  // Get campaign leaderboard
  leaderboard: publicProcedure
    .input(
      z.object({
        campaignId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getCampaignLeaderboard(input.campaignId, {
        limit: input.limit,
        cursor: input.cursor,
      });
    }),

  // Create a new campaign (creator only)
  create: protectedProcedure
    .input(CreateCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true, isCreator: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      if (!user.isCreator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only verified creators can create campaigns",
        });
      }

      return createCampaign(user.id, input);
    }),

  // Update campaign
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: UpdateCampaignSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return updateCampaign(input.id, user.id, input.data);
    }),

  // Cancel campaign
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return cancelCampaign(input.id, user.id);
    }),

  // Get my campaigns (creator)
  mine: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "ENDED", "CANCELLED"]).optional(),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return getCreatorCampaigns(user.id, input);
    }),

  // Join a campaign (agent)
  join: protectedProcedure
    .input(
      z.object({
        campaignId: z.string().uuid(),
        customCode: z.string().min(4).max(32).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Get agent
      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a registered Hype Agent to join campaigns",
        });
      }

      // Check if can join
      const eligibility = await canJoinCampaign(agent.id, input.campaignId);
      if (!eligibility.canJoin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: eligibility.reason || "Cannot join campaign",
        });
      }

      // Create affiliate link
      const link = await createAffiliateLink(
        agent.id,
        input.campaignId,
        input.customCode
      );

      return link;
    }),

  // Check if user has joined a campaign
  hasJoined: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        return { hasJoined: false, link: null };
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        return { hasJoined: false, link: null };
      }

      const link = await ctx.prisma.affiliateLink.findUnique({
        where: {
          agentId_campaignId: {
            agentId: agent.id,
            campaignId: input.campaignId,
          },
        },
      });

      return {
        hasJoined: !!link,
        link,
      };
    }),
});

// Links sub-router
const linksRouter = router({
  // Get my affiliate links
  mine: protectedProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found. Please register first.",
        });
      }

      return getAgentLinks(agent.id, input);
    }),

  // Get link stats
  stats: protectedProcedure
    .input(z.object({ linkId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      const stats = await getLinkStats(input.linkId, agent.id);
      if (!stats) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Link not found",
        });
      }

      return stats;
    }),

  // Deactivate link
  deactivate: protectedProcedure
    .input(z.object({ linkId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      return deactivateLink(input.linkId, agent.id);
    }),

  // Reactivate link
  reactivate: protectedProcedure
    .input(z.object({ linkId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      return reactivateLink(input.linkId, agent.id);
    }),
});

// Achievements sub-router (Phase 6)
const achievementsRouter = router({
  // Get all available achievements
  list: publicProcedure.query(() => {
    return ACHIEVEMENTS.filter((a) => !a.secret);
  }),

  // Get achievement by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return getAchievementById(input.id);
    }),

  // Get my achievements with progress
  mine: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return [];
    }

    return getAgentAchievements(agent.id);
  }),

  // Get agent achievements (public)
  byAgent: publicProcedure
    .input(z.object({ agentTag: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { agentTag: input.agentTag },
      });

      if (!agent) {
        return [];
      }

      return getAgentAchievements(agent.id);
    }),

  // Get achievement showcase (top achievements for profile display)
  showcase: publicProcedure
    .input(
      z.object({
        agentTag: z.string(),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { agentTag: input.agentTag },
      });

      if (!agent) {
        return [];
      }

      return getAchievementShowcase(agent.id, input.limit);
    }),

  // Get my achievement stats
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return null;
    }

    return getAgentAchievementStats(agent.id);
  }),

  // Get rarest achievements globally
  rarest: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ input }) => {
      return getRarestAchievements(input.limit);
    }),

  // Get recently unlocked achievements globally
  recent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ input }) => {
      return getRecentAchievements(input.limit);
    }),

  // Check and unlock achievements (called after XP events)
  checkUnlocks: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return [];
    }

    return checkAndUnlockAchievements(agent.id);
  }),
});

// Leaderboards sub-router (Phase 6 - fully implemented)
const leaderboardsRouter = router({
  // Global leaderboard by type
  global: publicProcedure
    .input(
      z.object({
        type: z
          .enum(["xp", "earnings", "conversions", "streak", "achievements"])
          .default("xp"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return getGlobalLeaderboard(
        input.type as LeaderboardType,
        input.limit,
        input.offset
      );
    }),

  // My position in each leaderboard
  myPosition: protectedProcedure
    .input(
      z.object({
        type: z.enum(["xp", "earnings", "conversions", "streak", "achievements"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        return -1;
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
      });

      if (!agent) {
        return -1;
      }

      return getAgentLeaderboardPosition(agent.id, input.type as LeaderboardType);
    }),

  // My leaderboard summary (position in all leaderboards)
  mySummary: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return null;
    }

    return getLeaderboardSummary(agent.id);
  }),

  // Top agents by time period (based on XP gained)
  topByPeriod: publicProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month", "all"]).default("week"),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      return getTopAgentsByPeriod(input.period, input.limit);
    }),

  // Leaderboard stats
  stats: publicProcedure.query(async () => {
    return getLeaderboardStats();
  }),

  // Rank distribution
  rankDistribution: publicProcedure.query(async () => {
    return getRankDistribution();
  }),
});

// Earnings sub-router (Phase 4)
const earningsRouter = router({
  // Earnings summary
  summary: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found. Please register first.",
      });
    }

    return getEarningsSummary(agent.id);
  }),

  // Commission history
  history: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["PENDING", "APPROVED", "PROCESSING", "PAID", "DISPUTED", "CANCELLED"])
          .optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        return { items: [], nextCursor: null };
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
      });

      if (!agent) {
        return { items: [], nextCursor: null };
      }

      return getCommissionHistory(agent.id, input);
    }),

  // Check if can request payout
  canPayout: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return { canRequest: false, reason: "User not found", availableAmount: 0 };
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return { canRequest: false, reason: "Not an agent", availableAmount: 0 };
    }

    return canRequestPayout(agent.id);
  }),

  // Request payout
  requestPayout: protectedProcedure
    .input(
      z.object({
        recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found. Please register first.",
        });
      }

      try {
        const payoutId = await requestPayout(agent.id, input.recipientAddress);
        return { payoutId };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to request payout",
        });
      }
    }),

  // Payout history
  payouts: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        return { items: [], nextCursor: null };
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
      });

      if (!agent) {
        return { items: [], nextCursor: null };
      }

      return getPayoutHistory(agent.id, input);
    }),
});

// Challenges sub-router (Phase 5)
const challengesRouter = router({
  // List challenges
  list: publicProcedure
    .input(
      z
        .object({
          campaignId: z.string().uuid().optional(),
          status: z.enum(["UPCOMING", "ACTIVE", "CALCULATING", "COMPLETED", "CANCELLED"]).optional(),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return listChallenges(input);
    }),

  // Get challenge by ID with participants
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const challenge = await getChallengeById(input.id);
      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }
      return challenge;
    }),

  // Get challenge leaderboard
  leaderboard: publicProcedure
    .input(
      z.object({
        challengeId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return getChallengeLeaderboard(input.challengeId, input.limit);
    }),

  // Join a challenge
  join: protectedProcedure
    .input(z.object({ challengeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "You must be a Hype Agent first",
        });
      }

      try {
        return await joinChallenge(agent.id, input.challengeId);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to join challenge",
        });
      }
    }),

  // Check if joined a challenge
  hasJoined: protectedProcedure
    .input(z.object({ challengeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        return { hasJoined: false, participant: null };
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        return { hasJoined: false, participant: null };
      }

      return hasJoinedChallenge(agent.id, input.challengeId);
    }),

  // Create a challenge (creator only)
  create: protectedProcedure
    .input(CreateChallengeSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true, isCreator: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      if (!user.isCreator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only verified creators can create challenges",
        });
      }

      try {
        return await createChallenge(user.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to create challenge",
        });
      }
    }),

  // Cancel a challenge (creator only)
  cancel: protectedProcedure
    .input(z.object({ challengeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      try {
        return await cancelChallenge(input.challengeId, user.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to cancel challenge",
        });
      }
    }),

  // Get my challenges (agent)
  mine: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!agent) {
      return [];
    }

    return getAgentChallenges(agent.id);
  }),

  // Get my unclaimed prizes
  myPrizes: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    const agent = await ctx.prisma.hypeAgent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!agent) {
      return [];
    }

    return getUnclaimedPrizes(agent.id);
  }),

  // Claim a prize
  claimPrize: protectedProcedure
    .input(
      z.object({
        participantId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      const agent = await ctx.prisma.hypeAgent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!agent) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "You must be a Hype Agent to claim prizes",
        });
      }

      try {
        return await claimPrize(input.participantId, agent.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to claim prize",
        });
      }
    }),
});

// Main Hype Network router
export const hypeNetworkRouter = router({
  agent: agentRouter,
  progression: progressionRouter,
  campaigns: campaignsRouter,
  links: linksRouter,
  leaderboards: leaderboardsRouter,
  achievements: achievementsRouter,
  earnings: earningsRouter,
  challenges: challengesRouter,
});
