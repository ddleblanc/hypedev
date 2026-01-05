/**
 * P2P Trading tRPC Router
 * Handles all P2P trading procedures: trades, messages, and history
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../index";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// =============================================================================
// Constants
// =============================================================================

const TradeStatusValues = [
  "DRAFT",
  "PENDING",
  "COUNTERED",
  "AGREED",
  "ESCROW_DEPLOYED",
  "DEPOSITED",
  "FINALIZED",
  "CANCELED",
  "REJECTED",
] as const;

// =============================================================================
// Input Schemas - Trades
// =============================================================================

const TradeItemSchema = z.object({
  nftId: z.string().optional(),
  side: z.enum(["INITIATOR", "COUNTERPARTY"]),
  tokenAmount: z.number().optional(),
  tokenAddress: z.string().optional(),
  metadata: z.any().optional(),
});

const GetTradesInput = z.object({
  address: z.string().min(1),
  status: z.enum(TradeStatusValues).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const GetTradeByIdInput = z.object({
  id: z.string().uuid(),
});

const CreateTradeInput = z.object({
  initiatorAddress: z.string().min(1),
  counterpartyAddress: z.string().min(1),
  initiatorItems: z
    .array(
      z.object({
        nftId: z.string().optional(),
        tokenAmount: z.number().optional(),
        tokenAddress: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .min(1),
  counterpartyItems: z
    .array(
      z.object({
        nftId: z.string().optional(),
        tokenAmount: z.number().optional(),
        tokenAddress: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .optional(),
  metadata: z.any().optional(),
});

const UpdateTradeInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["message", "counteroffer", "accept", "reject", "cancel"]),
  userAddress: z.string().min(1),
  items: z.array(TradeItemSchema).optional(),
  message: z.string().optional(),
  metadata: z.any().optional(),
});

const FinalizeTradeInput = z.object({
  id: z.string().uuid(),
  userAddress: z.string().min(1),
  transactionHash: z.string().min(1),
});

// =============================================================================
// Input Schemas - Messages
// =============================================================================

const GetMessagesInput = z.object({
  userAddress: z.string().min(1),
  tradeId: z.string().uuid().optional(),
  partnerAddress: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

const SendMessageInput = z.object({
  userAddress: z.string().min(1),
  tradeId: z.string().uuid(),
  message: z.string().min(1),
  messageType: z.enum(["TEXT", "SYSTEM", "COUNTEROFFER", "ACCEPTANCE", "REJECTION"]).default("TEXT"),
  metadata: z.any().optional(),
});

// =============================================================================
// Input Schemas - History
// =============================================================================

const GetHistoryInput = z.object({
  tradeId: z.string().uuid().optional(),
  userAddress: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

// =============================================================================
// Input Schemas - Traders
// =============================================================================

const GetTradersByAddressesInput = z.object({
  addresses: z.array(z.string().min(1)),
  nftId: z.string().optional(),
});

const GetTradersListInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

// =============================================================================
// Trade Include Configuration
// =============================================================================

const tradeInclude = {
  initiator: {
    select: {
      id: true,
      username: true,
      walletAddress: true,
      profilePicture: true,
    },
  },
  counterparty: {
    select: {
      id: true,
      username: true,
      walletAddress: true,
      profilePicture: true,
    },
  },
  items: {
    include: {
      nft: {
        include: {
          collection: {
            select: {
              name: true,
              symbol: true,
              image: true,
            },
          },
        },
      },
    },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: "desc" as const },
    include: {
      user: {
        select: {
          username: true,
          profilePicture: true,
        },
      },
    },
  },
  _count: {
    select: {
      items: true,
      messages: true,
    },
  },
} as const;

const tradeDetailInclude = {
  initiator: {
    select: {
      id: true,
      username: true,
      walletAddress: true,
      profilePicture: true,
    },
  },
  counterparty: {
    select: {
      id: true,
      username: true,
      walletAddress: true,
      profilePicture: true,
    },
  },
  items: {
    include: {
      nft: {
        include: {
          collection: {
            select: {
              name: true,
              symbol: true,
              image: true,
            },
          },
        },
      },
    },
  },
  messages: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          walletAddress: true,
          profilePicture: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  history: {
    include: {
      user: {
        select: {
          username: true,
          profilePicture: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

// =============================================================================
// Trades Router
// =============================================================================

const tradesRouter = router({
  /**
   * Get all trades for a user
   */
  list: publicProcedure.input(GetTradesInput).query(async ({ ctx, input }) => {
    const { address, status, page, limit } = input;
    const skip = (page - 1) * limit;

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Build where clause
    const where: {
      OR: Array<{ initiatorId: string } | { counterpartyId: string }>;
      status?: (typeof TradeStatusValues)[number];
    } = {
      OR: [{ initiatorId: user.id }, { counterpartyId: user.id }],
    };

    if (status) {
      where.status = status;
    }

    const [trades, total] = await Promise.all([
      ctx.prisma.trade.findMany({
        where,
        include: tradeInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      ctx.prisma.trade.count({ where }),
    ]);

    return {
      success: true as const,
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get a single trade by ID
   */
  byId: publicProcedure.input(GetTradeByIdInput).query(async ({ ctx, input }) => {
    const trade = await ctx.prisma.trade.findUnique({
      where: { id: input.id },
      include: tradeDetailInclude,
    });

    if (!trade) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trade not found",
      });
    }

    return trade;
  }),

  /**
   * Create a new trade offer
   */
  create: protectedProcedure.input(CreateTradeInput).mutation(async ({ ctx, input }) => {
    const { initiatorAddress, counterpartyAddress, initiatorItems, counterpartyItems, metadata } =
      input;

    // Verify the caller is the initiator
    if (ctx.walletAddress.toLowerCase() !== initiatorAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create trades from your own wallet",
      });
    }

    // Find both users
    const [initiator, counterparty] = await Promise.all([
      auth.getUserByWallet(initiatorAddress),
      auth.getUserByWallet(counterpartyAddress),
    ]);

    if (!initiator || !counterparty) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "One or both users not found",
      });
    }

    if (initiator.id === counterparty.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot trade with yourself",
      });
    }

    // Create trade with items
    const trade = await ctx.prisma.trade.create({
      data: {
        initiatorId: initiator.id,
        counterpartyId: counterparty.id,
        status: "PENDING",
        metadata: metadata as Prisma.InputJsonValue | undefined,
        items: {
          create: [
            // Initiator items
            ...initiatorItems.map((item) => ({
              nftId: item.nftId,
              side: "INITIATOR" as const,
              tokenAmount: item.tokenAmount,
              tokenAddress: item.tokenAddress,
              metadata: item.metadata as Prisma.InputJsonValue | undefined,
            })),
            // Counterparty items
            ...(counterpartyItems || []).map((item) => ({
              nftId: item.nftId,
              side: "COUNTERPARTY" as const,
              tokenAmount: item.tokenAmount,
              tokenAddress: item.tokenAddress,
              metadata: item.metadata as Prisma.InputJsonValue | undefined,
            })),
          ],
        },
        history: {
          create: {
            userId: initiator.id,
            action: "CREATED",
            newStatus: "PENDING",
            metadata: {
              message: "Trade offer created",
              items: [
                ...initiatorItems.map((item) => ({
                  nftId: item.nftId,
                  side: "INITIATOR",
                  tokenAmount: item.tokenAmount,
                  metadata: item.metadata,
                })),
                ...(counterpartyItems || []).map((item) => ({
                  nftId: item.nftId,
                  side: "COUNTERPARTY",
                  tokenAmount: item.tokenAmount,
                  metadata: item.metadata,
                })),
              ],
            } as Prisma.InputJsonValue,
          },
        },
      },
      include: tradeDetailInclude,
    });

    return { success: true as const, trade };
  }),

  /**
   * Update a trade (counteroffer, accept, reject, cancel, or add message)
   */
  update: protectedProcedure.input(UpdateTradeInput).mutation(async ({ ctx, input }) => {
    const { id, action, userAddress, items, message, metadata: requestMetadata } = input;

    // Verify the caller matches the userAddress
    if (ctx.walletAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only update trades from your own wallet",
      });
    }

    let metadata = requestMetadata;

    // Find user
    const user = await auth.getUserByWallet(userAddress);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Get trade
    const trade = await ctx.prisma.trade.findUnique({
      where: { id },
      include: {
        initiator: true,
        counterparty: true,
        items: true,
      },
    });

    if (!trade) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trade not found",
      });
    }

    // Check if user is part of this trade
    if (trade.initiatorId !== user.id && trade.counterpartyId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not part of this trade",
      });
    }

    let newStatus = trade.status;
    const updateData: Prisma.TradeUpdateInput = {};

    // Handle different actions
    switch (action) {
      case "message":
        // Just add a message, don't change status
        if (!message) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Message is required",
          });
        }

        await ctx.prisma.tradeMessage.create({
          data: {
            tradeId: id,
            userId: user.id,
            message,
            messageType: "TEXT",
            metadata: metadata as Prisma.InputJsonValue | undefined,
          },
        });

        // Return the updated trade with messages
        const tradeWithMessages = await ctx.prisma.trade.findUnique({
          where: { id },
          include: tradeDetailInclude,
        });

        return { success: true as const, trade: tradeWithMessages };

      case "counteroffer":
        if (trade.status !== "PENDING" && trade.status !== "COUNTERED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot make counteroffer in current status",
          });
        }

        newStatus = "COUNTERED";

        // Save a snapshot of current items before updating
        const currentItemsSnapshot = trade.items.map((item) => ({
          nftId: item.nftId,
          side: item.side,
          tokenAmount: item.tokenAmount,
          metadata: item.metadata,
        }));

        // Update items if provided
        if (items) {
          // Delete existing items
          await ctx.prisma.tradeItem.deleteMany({
            where: { tradeId: id },
          });

          // Create new items
          await ctx.prisma.tradeItem.createMany({
            data: items.map((item) => ({
              tradeId: id,
              nftId: item.nftId,
              side: item.side,
              tokenAmount: item.tokenAmount,
              tokenAddress: item.tokenAddress,
              metadata: item.metadata as Prisma.InputJsonValue | undefined,
            })),
          });
        }

        // Store items snapshot in metadata for history
        metadata = {
          ...metadata,
          previousItems: currentItemsSnapshot,
          newItems: items,
        };
        break;

      case "accept":
        if (trade.status !== "PENDING" && trade.status !== "COUNTERED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot accept trade in current status",
          });
        }

        newStatus = "AGREED";
        updateData.agreedAt = new Date();
        break;

      case "reject":
        if (trade.status !== "PENDING" && trade.status !== "COUNTERED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot reject trade in current status",
          });
        }

        newStatus = "REJECTED";
        updateData.canceledAt = new Date();
        break;

      case "cancel":
        if (trade.initiatorId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the initiator can cancel the trade",
          });
        }

        if (
          trade.status === "FINALIZED" ||
          trade.status === "CANCELED" ||
          trade.status === "REJECTED"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot cancel trade in current status",
          });
        }

        newStatus = "CANCELED";
        updateData.canceledAt = new Date();
        break;

      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid action",
        });
    }

    // Update trade
    await ctx.prisma.trade.update({
      where: { id },
      data: {
        status: newStatus,
        ...updateData,
      },
    });

    // Add message if provided
    if (message) {
      await ctx.prisma.tradeMessage.create({
        data: {
          tradeId: id,
          userId: user.id,
          message,
          messageType:
            action === "counteroffer"
              ? "COUNTEROFFER"
              : action === "accept"
                ? "ACCEPTANCE"
                : action === "reject"
                  ? "REJECTION"
                  : "TEXT",
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      });
    }

    // Map action to TradeAction enum
    const actionMap = {
      counteroffer: "COUNTEROFFER",
      accept: "ACCEPTED",
      reject: "REJECTED",
      cancel: "CANCELED",
      message: "UPDATED",
    } as const;

    type ActionKey = keyof typeof actionMap;
    const historyAction = action in actionMap
      ? actionMap[action as ActionKey]
      : "UPDATED";

    // Add history entry
    await ctx.prisma.tradeHistory.create({
      data: {
        tradeId: id,
        userId: user.id,
        action: historyAction,
        oldStatus: trade.status,
        newStatus,
        metadata: { message: `Trade ${action}ed` } as Prisma.InputJsonValue,
      },
    });

    // Fetch the complete updated trade with all relations
    const completeUpdatedTrade = await ctx.prisma.trade.findUnique({
      where: { id },
      include: tradeDetailInclude,
    });

    return { success: true as const, trade: completeUpdatedTrade };
  }),

  /**
   * Finalize a trade after on-chain completion
   */
  finalize: protectedProcedure.input(FinalizeTradeInput).mutation(async ({ ctx, input }) => {
    const { id, userAddress, transactionHash } = input;

    // Verify the caller matches the userAddress
    if (ctx.walletAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only finalize trades from your own wallet",
      });
    }

    // Find user
    const user = await auth.getUserByWallet(userAddress);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Get trade
    const trade = await ctx.prisma.trade.findUnique({
      where: { id },
      include: {
        initiator: true,
        counterparty: true,
        items: true,
      },
    });

    if (!trade) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trade not found",
      });
    }

    // Check if user is part of this trade
    if (trade.initiatorId !== user.id && trade.counterpartyId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not part of this trade",
      });
    }

    // Check if trade is in DEPOSITED status
    if (trade.status !== "DEPOSITED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Trade must have all items deposited before finalization",
      });
    }

    // Update trade status to FINALIZED
    const updatedTrade = await ctx.prisma.trade.update({
      where: { id },
      data: {
        status: "FINALIZED",
        finalizedAt: new Date(),
        metadata: {
          ...(trade.metadata as object),
          finalizeTransactionHash: transactionHash,
        },
      },
      include: tradeDetailInclude,
    });

    // Add history entry
    await ctx.prisma.tradeHistory.create({
      data: {
        tradeId: id,
        userId: user.id,
        action: "FINALIZED",
        oldStatus: "DEPOSITED",
        newStatus: "FINALIZED",
        metadata: {
          transactionHash,
          message: "Trade finalized successfully",
        } as Prisma.InputJsonValue,
      },
    });

    // Add system message
    await ctx.prisma.tradeMessage.create({
      data: {
        tradeId: id,
        userId: user.id,
        message: "Trade has been finalized and assets have been swapped",
        messageType: "SYSTEM",
        metadata: {
          transactionHash,
        } as Prisma.InputJsonValue,
      },
    });

    return { success: true as const, trade: updatedTrade };
  }),
});

// =============================================================================
// Messages Router
// =============================================================================

const messagesRouter = router({
  /**
   * Get messages for a trade or between users
   */
  list: publicProcedure.input(GetMessagesInput).query(async ({ ctx, input }) => {
    const { userAddress, tradeId, partnerAddress, page, limit } = input;
    const skip = (page - 1) * limit;

    const user = await auth.getUserByWallet(userAddress);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    let where: Prisma.TradeMessageWhereInput = {};

    if (tradeId) {
      // Get messages for specific trade
      where.tradeId = tradeId;
    } else if (partnerAddress) {
      // Get all messages between two users across all trades
      const partner = await auth.getUserByWallet(partnerAddress);
      if (!partner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Partner not found",
        });
      }

      // Find all trades between these two users
      const trades = await ctx.prisma.trade.findMany({
        where: {
          OR: [
            { initiatorId: user.id, counterpartyId: partner.id },
            { initiatorId: partner.id, counterpartyId: user.id },
          ],
        },
        select: { id: true },
      });

      where.tradeId = { in: trades.map((t) => t.id) };
    } else {
      // Get all messages for the user
      const trades = await ctx.prisma.trade.findMany({
        where: {
          OR: [{ initiatorId: user.id }, { counterpartyId: user.id }],
        },
        select: { id: true },
      });

      where.tradeId = { in: trades.map((t) => t.id) };
    }

    const [messages, total] = await Promise.all([
      ctx.prisma.tradeMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              profilePicture: true,
            },
          },
          trade: {
            select: {
              id: true,
              status: true,
              initiatorId: true,
              counterpartyId: true,
              items: {
                select: {
                  id: true,
                  side: true,
                  metadata: true,
                  nft: {
                    select: {
                      name: true,
                      image: true,
                      tokenId: true,
                      collection: {
                        select: {
                          name: true,
                          symbol: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      ctx.prisma.tradeMessage.count({ where }),
    ]);

    return {
      success: true as const,
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Send a message in a trade
   */
  send: protectedProcedure.input(SendMessageInput).mutation(async ({ ctx, input }) => {
    const { userAddress, tradeId, message, messageType, metadata } = input;

    // Verify the caller matches the userAddress
    if (ctx.walletAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only send messages from your own wallet",
      });
    }

    const user = await auth.getUserByWallet(userAddress);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Find trade
    const trade = await ctx.prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        initiator: true,
        counterparty: true,
      },
    });

    if (!trade) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trade not found",
      });
    }

    // Verify user is part of this trade
    if (trade.initiatorId !== user.id && trade.counterpartyId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not part of this trade",
      });
    }

    // Create the message
    const newMessage = await ctx.prisma.tradeMessage.create({
      data: {
        tradeId: trade.id,
        userId: user.id,
        message,
        messageType,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            profilePicture: true,
          },
        },
        trade: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Update trade's updatedAt timestamp
    await ctx.prisma.trade.update({
      where: { id: trade.id },
      data: { updatedAt: new Date() },
    });

    return { success: true as const, message: newMessage };
  }),
});

// =============================================================================
// History Router
// =============================================================================

const historyRouter = router({
  /**
   * Get trade history
   */
  list: publicProcedure.input(GetHistoryInput).query(async ({ ctx, input }) => {
    const { tradeId, userAddress, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.TradeHistoryWhereInput = {};

    if (tradeId) {
      where.tradeId = tradeId;
    }

    if (userAddress) {
      const user = await auth.getUserByWallet(userAddress);
      if (user) {
        where.userId = user.id;
      }
    }

    const [history, total] = await Promise.all([
      ctx.prisma.tradeHistory.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              profilePicture: true,
            },
          },
          trade: {
            select: {
              id: true,
              status: true,
              initiator: {
                select: {
                  username: true,
                  walletAddress: true,
                },
              },
              counterparty: {
                select: {
                  username: true,
                  walletAddress: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      ctx.prisma.tradeHistory.count({ where }),
    ]);

    return {
      success: true as const,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),
});

// =============================================================================
// Traders Router
// =============================================================================

const tradersRouter = router({
  /**
   * Get trader information by wallet addresses
   * Used when selecting a trader for P2P trading
   */
  byAddresses: publicProcedure.input(GetTradersByAddressesInput).query(async ({ ctx, input }) => {
    const { addresses, nftId } = input;

    if (addresses.length === 0) {
      return { success: true as const, traders: [] };
    }

    // Normalize addresses
    const normalizedAddresses = addresses.map(a => a.toLowerCase());

    // Get users by addresses
    const users = await ctx.prisma.user.findMany({
      where: {
        walletAddress: { in: normalizedAddresses },
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePicture: true,
        _count: {
          select: {
            initiatedTrades: {
              where: { status: "FINALIZED" },
            },
            receivedTrades: {
              where: { status: "FINALIZED" },
            },
          },
        },
      },
    });

    // Calculate stats for each trader
    const traders = await Promise.all(
      users.map(async (user) => {
        // Get total completed trades
        const completedTrades = user._count.initiatedTrades + user._count.receivedTrades;

        // Get success rate (completed vs total)
        const totalTrades = await ctx.prisma.trade.count({
          where: {
            OR: [
              { initiatorId: user.id },
              { counterpartyId: user.id },
            ],
          },
        });

        const successRate = totalTrades > 0
          ? Math.round((completedTrades / totalTrades) * 100)
          : 100;

        // Get collection completion (if nftId provided)
        let collectionCompletion = 0;
        let availableCopies = 1;

        if (nftId) {
          // Check how many copies of this NFT the user owns
          const nftCount = await ctx.prisma.nft.count({
            where: {
              id: nftId,
              ownerAddress: user.walletAddress.toLowerCase(),
            },
          });
          availableCopies = Math.max(1, nftCount);
        }

        // Calculate tier based on completed trades
        let tier: "DIAMOND" | "GOLD" | "SILVER" | "BRONZE" = "BRONZE";
        if (completedTrades >= 100) tier = "DIAMOND";
        else if (completedTrades >= 50) tier = "GOLD";
        else if (completedTrades >= 10) tier = "SILVER";

        // Calculate rating (based on success rate and trades)
        const rating = Math.min(5, 3 + (successRate / 100) + (Math.min(completedTrades, 50) / 50));

        return {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username,
          avatar: user.profilePicture,
          rating: Math.round(rating * 10) / 10,
          completedTrades,
          successRate,
          collectionCompletion,
          availableCopies,
          tier,
        };
      })
    );

    return { success: true as const, traders };
  }),

  /**
   * List all available traders for P2P trading
   */
  list: publicProcedure.input(GetTradersListInput).query(async ({ ctx, input }) => {
    const { page, limit, search } = input;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: { OR?: Array<{ username?: { contains: string; mode: "insensitive" }; walletAddress?: { contains: string; mode: "insensitive" } }> } = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { walletAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users with trade history
    const [users, total] = await Promise.all([
      ctx.prisma.user.findMany({
        where: {
          ...where,
          // Only include users who have participated in trades
          OR: [
            { initiatedTrades: { some: {} } },
            { receivedTrades: { some: {} } },
          ],
        },
        select: {
          id: true,
          walletAddress: true,
          username: true,
          profilePicture: true,
          _count: {
            select: {
              initiatedTrades: {
                where: { status: "FINALIZED" },
              },
              receivedTrades: {
                where: { status: "FINALIZED" },
              },
            },
          },
        },
        orderBy: [
          { initiatedTrades: { _count: "desc" } },
          { receivedTrades: { _count: "desc" } },
        ],
        skip,
        take: limit,
      }),
      ctx.prisma.user.count({
        where: {
          ...where,
          OR: [
            { initiatedTrades: { some: {} } },
            { receivedTrades: { some: {} } },
          ],
        },
      }),
    ]);

    // Transform to trader format
    const traders = users.map((user) => {
      const completedTrades = user._count.initiatedTrades + user._count.receivedTrades;

      // Calculate tier based on completed trades
      let tier: "DIAMOND" | "GOLD" | "SILVER" | "BRONZE" = "BRONZE";
      if (completedTrades >= 100) tier = "DIAMOND";
      else if (completedTrades >= 50) tier = "GOLD";
      else if (completedTrades >= 10) tier = "SILVER";

      return {
        id: user.id,
        name: user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
        username: user.username,
        walletAddress: user.walletAddress,
        avatar: user.profilePicture || "/assets/img/default-avatar.png",
        rating: 4.5, // Default rating
        trades: completedTrades,
        successRate: 95, // Placeholder - would need more complex calculation
        isOnline: false, // Would need real-time tracking
        tier,
      };
    });

    return {
      success: true as const,
      traders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),
});

// =============================================================================
// Export Combined P2P Router
// =============================================================================

export const p2pRouter = router({
  trades: tradesRouter,
  messages: messagesRouter,
  history: historyRouter,
  traders: tradersRouter,
});
