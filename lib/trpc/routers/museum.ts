/**
 * Museum tRPC Router
 * Handles all museum/legends hall related procedures
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../index";
import {
  LegendStatus,
  legendStatsSchema,
  listLegendsInputSchema,
  getLegendBySlugInputSchema,
  getLegendByIdInputSchema,
  listChaptersInputSchema,
  getChapterInputSchema,
  updateProgressSchema,
  checkArtifactUnlockInputSchema,
  recordOwnershipInputSchema,
  type LegendListItem,
  type LegendDetail,
} from "@/lib/museum/types";
import {
  isChapterAvailable,
  getChapterPurchaseData,
  recordChapterPurchase,
  getUserOwnedChapters,
  getCollectionTotalPrice,
  MUSEUM_CHAIN_ID,
} from "@/lib/museum-contracts";

export const museumRouter = router({
  // ============================================
  // LEGEND QUERIES
  // ============================================

  legends: router({
    // List all active legends
    list: publicProcedure
      .input(listLegendsInputSchema)
      .query(async ({ ctx, input }) => {
        const statusFilter = input?.status
          ? [input.status]
          : input?.includeComingSoon !== false
            ? [LegendStatus.ACTIVE, LegendStatus.COMING_SOON]
            : [LegendStatus.ACTIVE];

        const legends = await ctx.prisma.legend.findMany({
          where: {
            status: { in: statusFilter },
          },
          orderBy: { displayOrder: "asc" },
          include: {
            _count: {
              select: { chapters: true },
            },
          },
        });

        return legends.map((legend): LegendListItem => ({
          id: legend.id,
          slug: legend.slug,
          name: legend.name,
          title: legend.title,
          tagline: legend.tagline,
          category: legend.category,
          status: legend.status,
          portraitUrl: legend.portraitUrl,
          bannerUrl: legend.bannerUrl,
          primaryColor: legend.primaryColor,
          chapterCount: legend._count.chapters,
          stats: legendStatsSchema.parse(legend.stats),
        }));
      }),

    // Get legend by slug with all relations
    getBySlug: publicProcedure
      .input(getLegendBySlugInputSchema)
      .query(async ({ ctx, input }) => {
        const legend = await ctx.prisma.legend.findUnique({
          where: { slug: input.slug },
          include: {
            chapters: {
              orderBy: { number: "asc" },
              include: {
                nft: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    listingPrice: true,
                    isListed: true,
                  },
                },
              },
            },
            artifacts: {
              orderBy: { displayOrder: "asc" },
            },
            achievements: true,
            timeline: {
              orderBy: { displayOrder: "asc" },
            },
            quotes: {
              orderBy: { displayOrder: "asc" },
            },
          },
        });

        if (!legend) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Legend not found",
          });
        }

        // Get user progress if authenticated
        let userProgress = null;
        if (ctx.walletAddress) {
          const user = await ctx.prisma.user.findUnique({
            where: { walletAddress: ctx.walletAddress },
            select: { id: true },
          });

          if (user) {
            userProgress = await ctx.prisma.userLegendProgress.findUnique({
              where: {
                userId_legendId: {
                  userId: user.id,
                  legendId: legend.id,
                },
              },
            });
          }
        }

        return {
          ...legend,
          parsedStats: legendStatsSchema.parse(legend.stats),
          userProgress,
        } as LegendDetail;
      }),

    // Get legend by ID
    get: publicProcedure
      .input(getLegendByIdInputSchema)
      .query(async ({ ctx, input }) => {
        const legend = await ctx.prisma.legend.findUnique({
          where: { id: input.id },
          include: {
            chapters: { orderBy: { number: "asc" } },
            artifacts: { orderBy: { displayOrder: "asc" } },
            achievements: true,
            timeline: { orderBy: { displayOrder: "asc" } },
            quotes: { orderBy: { displayOrder: "asc" } },
          },
        });

        if (!legend) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Legend not found",
          });
        }

        return {
          ...legend,
          parsedStats: legendStatsSchema.parse(legend.stats),
        };
      }),
  }),

  // ============================================
  // CHAPTER QUERIES
  // ============================================

  chapters: router({
    // List chapters for a legend
    list: publicProcedure
      .input(listChaptersInputSchema)
      .query(async ({ ctx, input }) => {
        return ctx.prisma.legendChapter.findMany({
          where: { legendId: input.legendId },
          orderBy: { number: "asc" },
          include: {
            nft: {
              select: {
                id: true,
                name: true,
                image: true,
                listingPrice: true,
                isListed: true,
              },
            },
          },
        });
      }),

    // Get single chapter
    get: publicProcedure
      .input(getChapterInputSchema)
      .query(async ({ ctx, input }) => {
        const chapter = await ctx.prisma.legendChapter.findUnique({
          where: { id: input.id },
          include: {
            legend: {
              select: {
                id: true,
                slug: true,
                name: true,
                primaryColor: true,
              },
            },
            nft: true,
          },
        });

        if (!chapter) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chapter not found",
          });
        }

        return chapter;
      }),
  }),

  // ============================================
  // USER PROGRESS
  // ============================================

  progress: router({
    // Get user's progress for a legend
    get: protectedProcedure
      .input(z.object({ legendId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { walletAddress: ctx.walletAddress },
          select: { id: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        let progress = await ctx.prisma.userLegendProgress.findUnique({
          where: {
            userId_legendId: {
              userId: user.id,
              legendId: input.legendId,
            },
          },
        });

        // Create initial progress if doesn't exist
        if (!progress) {
          progress = await ctx.prisma.userLegendProgress.create({
            data: {
              userId: user.id,
              legendId: input.legendId,
              firstVisitAt: new Date(),
              lastVisitAt: new Date(),
            },
          });
        }

        return progress;
      }),

    // Update progress (view chapter, complete quiz, etc.)
    update: protectedProcedure
      .input(updateProgressSchema)
      .mutation(async ({ ctx, input }) => {
        const { legendId, action, targetId, quizScore } = input;

        const user = await ctx.prisma.user.findUnique({
          where: { walletAddress: ctx.walletAddress },
          select: { id: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Get or create progress
        let progress = await ctx.prisma.userLegendProgress.findUnique({
          where: {
            userId_legendId: {
              userId: user.id,
              legendId,
            },
          },
        });

        if (!progress) {
          progress = await ctx.prisma.userLegendProgress.create({
            data: {
              userId: user.id,
              legendId,
              firstVisitAt: new Date(),
              lastVisitAt: new Date(),
            },
          });
        }

        // Update based on action
        const updateData: {
          lastVisitAt: Date;
          chaptersViewed?: string[];
          timelineEventsViewed?: string[];
          quizzesCompleted?: string[];
          quizScore?: number;
          artifactsFound?: string[];
          trailerWatchedAt?: Date;
          curatorPoints?: number;
          discoveryLevel?: number;
        } = {
          lastVisitAt: new Date(),
        };

        switch (action) {
          case "view_chapter":
            if (targetId && !progress.chaptersViewed.includes(targetId)) {
              updateData.chaptersViewed = [...progress.chaptersViewed, targetId];
              updateData.curatorPoints = progress.curatorPoints + 10;
            }
            break;

          case "view_timeline_event":
            if (targetId && !progress.timelineEventsViewed.includes(targetId)) {
              updateData.timelineEventsViewed = [...progress.timelineEventsViewed, targetId];
              updateData.curatorPoints = progress.curatorPoints + 5;
            }
            break;

          case "complete_quiz":
            if (targetId && !progress.quizzesCompleted.includes(targetId)) {
              updateData.quizzesCompleted = [...progress.quizzesCompleted, targetId];
              updateData.quizScore = progress.quizScore + (quizScore || 0);
              updateData.curatorPoints = progress.curatorPoints + (quizScore || 100);
            }
            break;

          case "find_artifact":
            if (targetId && !progress.artifactsFound.includes(targetId)) {
              updateData.artifactsFound = [...progress.artifactsFound, targetId];
              updateData.curatorPoints = progress.curatorPoints + 25;
            }
            break;

          case "watch_trailer":
            if (!progress.trailerWatchedAt) {
              updateData.trailerWatchedAt = new Date();
              updateData.curatorPoints = progress.curatorPoints + 50;
            }
            break;
        }

        // Calculate discovery level based on progress
        const totalActions =
          (updateData.chaptersViewed?.length || progress.chaptersViewed.length) +
          (updateData.timelineEventsViewed?.length || progress.timelineEventsViewed.length) +
          (updateData.artifactsFound?.length || progress.artifactsFound.length);

        updateData.discoveryLevel = Math.min(10, Math.floor(totalActions / 3) + 1);

        const updated = await ctx.prisma.userLegendProgress.update({
          where: { id: progress.id },
          data: updateData,
        });

        return updated;
      }),

    // Record chapter ownership (called after NFT purchase)
    recordOwnership: protectedProcedure
      .input(recordOwnershipInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { legendId, chapterId } = input;

        const user = await ctx.prisma.user.findUnique({
          where: { walletAddress: ctx.walletAddress },
          select: { id: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const progress = await ctx.prisma.userLegendProgress.upsert({
          where: {
            userId_legendId: {
              userId: user.id,
              legendId,
            },
          },
          create: {
            userId: user.id,
            legendId,
            chaptersOwned: [chapterId],
            firstVisitAt: new Date(),
            lastVisitAt: new Date(),
          },
          update: {
            chaptersOwned: {
              push: chapterId,
            },
            lastVisitAt: new Date(),
          },
        });

        // Check for achievements
        await checkAndAwardAchievements(ctx.prisma, user.id, legendId);

        return progress;
      }),
  }),

  // ============================================
  // ARTIFACTS
  // ============================================

  artifacts: router({
    list: publicProcedure
      .input(z.object({ legendId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.legendArtifact.findMany({
          where: { legendId: input.legendId },
          orderBy: { displayOrder: "asc" },
        });
      }),

    // Check if artifact is unlocked for user
    checkUnlock: protectedProcedure
      .input(checkArtifactUnlockInputSchema)
      .query(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { walletAddress: ctx.walletAddress },
          select: { id: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const [artifact, progress] = await Promise.all([
          ctx.prisma.legendArtifact.findUnique({
            where: { id: input.artifactId },
          }),
          ctx.prisma.userLegendProgress.findUnique({
            where: {
              userId_legendId: {
                userId: user.id,
                legendId: input.legendId,
              },
            },
          }),
        ]);

        if (!artifact) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artifact not found" });
        }

        // Check unlock condition
        let isUnlocked = false;

        switch (artifact.unlockType) {
          case "FREE":
            isUnlocked = true;
            break;
          case "CHAPTER":
            // Check if user owns the required chapter
            if (artifact.unlockValue && progress) {
              const chapters = await ctx.prisma.legendChapter.findMany({
                where: {
                  legendId: input.legendId,
                  number: parseInt(artifact.unlockValue),
                },
                select: { id: true },
              });
              isUnlocked = chapters.some((c) => progress.chaptersOwned.includes(c.id));
            }
            break;
          case "POINTS":
            isUnlocked = progress
              ? progress.curatorPoints >= parseInt(artifact.unlockValue || "0")
              : false;
            break;
          case "QUIZ":
            isUnlocked = progress
              ? progress.quizzesCompleted.includes(artifact.unlockValue || "")
              : false;
            break;
        }

        return {
          artifact,
          isUnlocked,
          progress: progress || null,
        };
      }),
  }),

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  achievements: router({
    list: publicProcedure
      .input(z.object({ legendId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.legendAchievement.findMany({
          where: { legendId: input.legendId },
        });
      }),

    // Check user's earned achievements
    checkEarned: protectedProcedure
      .input(z.object({ legendId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { walletAddress: ctx.walletAddress },
          select: { id: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const [achievements, progress] = await Promise.all([
          ctx.prisma.legendAchievement.findMany({
            where: { legendId: input.legendId },
          }),
          ctx.prisma.userLegendProgress.findUnique({
            where: {
              userId_legendId: {
                userId: user.id,
                legendId: input.legendId,
              },
            },
          }),
        ]);

        return achievements.map((achievement) => ({
          ...achievement,
          earned: progress?.achievementsEarned.includes(achievement.id) || false,
        }));
      }),
  }),

  // ============================================
  // PURCHASE PROCEDURES
  // ============================================

  purchase: router({
    // Check if user can purchase a chapter
    canPurchase: protectedProcedure
      .input(
        z.object({
          legendId: z.string().uuid(),
          chapterId: z.string().uuid(),
        })
      )
      .query(async ({ ctx, input }) => {
        const availability = await isChapterAvailable(
          input.legendId,
          input.chapterId,
          ctx.walletAddress
        );

        if (!availability.available) {
          return {
            canPurchase: false,
            reason: availability.reason,
          };
        }

        // Get chapter details for price
        const chapter = await ctx.prisma.legendChapter.findUnique({
          where: { id: input.chapterId },
          select: { price: true, edition: true, rarity: true },
        });

        return {
          canPurchase: true,
          price: chapter?.price || 0,
          edition: chapter?.edition || "Open Edition",
          rarity: chapter?.rarity || "Common",
        };
      }),

    // Get purchase preparation data
    preparePurchase: protectedProcedure
      .input(
        z.object({
          legendId: z.string().uuid(),
          chapterId: z.string().uuid(),
        })
      )
      .query(async ({ input }) => {
        try {
          const purchaseData = await getChapterPurchaseData(input.legendId, input.chapterId);
          return purchaseData;
        } catch (error) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error instanceof Error ? error.message : "Failed to prepare purchase",
          });
        }
      }),

    // Record successful purchase
    recordPurchase: protectedProcedure
      .input(
        z.object({
          legendId: z.string().uuid(),
          chapterId: z.string().uuid(),
          transactionHash: z.string(),
          tokenId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { walletAddress: ctx.walletAddress },
          select: { id: true, walletAddress: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        try {
          await recordChapterPurchase(
            user.id,
            input.legendId,
            input.chapterId,
            input.transactionHash,
            input.tokenId,
            user.walletAddress
          );

          // Check and award achievements
          await checkAndAwardAchievements(ctx.prisma, user.id, input.legendId);

          return { success: true };
        } catch (error) {
          console.error("Error recording purchase:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to record purchase",
          });
        }
      }),

    // Get user's owned chapters for a legend
    getOwnedChapters: protectedProcedure
      .input(z.object({ legendId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const ownedChapterIds = await getUserOwnedChapters(ctx.walletAddress, input.legendId);
        return ownedChapterIds;
      }),

    // Get collection purchase info (all chapters)
    getCollectionInfo: publicProcedure
      .input(z.object({ legendId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const legend = await ctx.prisma.legend.findUnique({
          where: { id: input.legendId },
          include: {
            collection: true,
            chapters: {
              orderBy: { number: "asc" },
              select: {
                id: true,
                number: true,
                title: true,
                subtitle: true,
                thumbnailUrl: true,
                price: true,
                rarity: true,
                edition: true,
              },
            },
          },
        });

        if (!legend) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Legend not found",
          });
        }

        const totalPrice = await getCollectionTotalPrice(input.legendId);

        return {
          legendId: legend.id,
          legendName: legend.name,
          contractAddress: legend.collection?.address || null,
          chainId: MUSEUM_CHAIN_ID,
          chapters: legend.chapters,
          totalChapters: legend.chapters.length,
          totalPrice,
          currency: "ETH",
        };
      }),
  }),
});

// Helper function to check and award achievements
async function checkAndAwardAchievements(
  prisma: typeof import("@/lib/prisma").prisma,
  userId: string,
  legendId: string
) {
  const [progress, legend, achievements] = await Promise.all([
    prisma.userLegendProgress.findUnique({
      where: { userId_legendId: { userId, legendId } },
    }),
    prisma.legend.findUnique({
      where: { id: legendId },
      include: { chapters: true },
    }),
    prisma.legendAchievement.findMany({
      where: { legendId },
    }),
  ]);

  if (!progress || !legend) return;

  const newAchievements: string[] = [];

  for (const achievement of achievements) {
    if (progress.achievementsEarned.includes(achievement.id)) continue;

    let earned = false;

    switch (achievement.unlockType) {
      case "FIRST_PURCHASE":
        earned = progress.chaptersOwned.length >= 1;
        break;
      case "CHAPTERS_OWNED":
        earned = progress.chaptersOwned.length >= parseInt(achievement.unlockValue || "1");
        break;
      case "ALL_CHAPTERS":
        earned = progress.chaptersOwned.length >= legend.chapters.length;
        break;
      case "TIMELINE_COMPLETE":
        // Check if all timeline events viewed
        const timelineCount = await prisma.legendTimelineEvent.count({
          where: { legendId },
        });
        earned = progress.timelineEventsViewed.length >= timelineCount;
        break;
      case "QUIZ_SCORE":
        earned = progress.quizScore >= parseInt(achievement.unlockValue || "0");
        break;
      case "ARTIFACTS_FOUND":
        earned = progress.artifactsFound.length >= parseInt(achievement.unlockValue || "1");
        break;
    }

    if (earned) {
      newAchievements.push(achievement.id);
    }
  }

  if (newAchievements.length > 0) {
    await prisma.userLegendProgress.update({
      where: { id: progress.id },
      data: {
        achievementsEarned: [...progress.achievementsEarned, ...newAchievements],
        curatorPoints: progress.curatorPoints + newAchievements.length * 100,
      },
    });
  }
}

export type MuseumRouter = typeof museumRouter;
