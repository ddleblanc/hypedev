import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimitCheck } from "@/lib/rate-limit";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponseWithRateLimit } from "@/lib/api-utils";
import {
  validationError,
  notFoundError,
  databaseError,
  badRequestError,
  type AnyAppError,
} from "@/lib/errors";

import type { Prisma } from "@prisma/client";

// Zod schemas for validation
const TradeItemSchema = z.object({
  nftId: z.string().optional(),
  tokenAmount: z.number().optional(),
  tokenAddress: z.string().optional(),
  metadata: z.any().optional(),
});

// TradeStatus from Prisma enum
const TradeStatusValues = ["DRAFT", "PENDING", "COUNTERED", "AGREED", "ESCROW_DEPLOYED", "DEPOSITED", "FINALIZED", "CANCELED", "REJECTED"] as const;
type TradeStatusType = (typeof TradeStatusValues)[number];

const GetTradesQuerySchema = z.object({
  address: z.string().min(1),
  status: z.enum(TradeStatusValues).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const CreateTradeSchema = z.object({
  initiatorAddress: z.string().min(1),
  counterpartyAddress: z.string().min(1),
  initiatorItems: z.array(TradeItemSchema).min(1),
  counterpartyItems: z.array(TradeItemSchema).optional(),
  metadata: z.any().optional(),
});

// Trade include configuration
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

// GET /api/p2p/trades - List user's trades
export async function GET(request: NextRequest) {
  // Rate limit API reads
  const rateLimit = await rateLimitCheck(request, "api");
  if (rateLimit.blocked) return rateLimit.response;

  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const parseResult = GetTradesQuerySchema.safeParse({
    address: searchParams.get("address"),
    status: searchParams.get("status") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  });

  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const { address, status, page, limit } = parseResult.data;
  const skip = (page - 1) * limit;

  // Find user
  const userResult = await ResultAsync.fromPromise(
    auth.getUserByWallet(address),
    (e) => databaseError(e)
  );

  if (userResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(userResult.error), rateLimit);
  }

  const user = userResult.value;
  if (!user) {
    return resultToResponseWithRateLimit(err(notFoundError("User", address)), rateLimit);
  }

  // Build where clause
  const where: {
    OR: Array<{ initiatorId: string } | { counterpartyId: string }>;
    status?: TradeStatusType;
  } = {
    OR: [{ initiatorId: user.id }, { counterpartyId: user.id }],
  };

  if (status) {
    where.status = status;
  }

  // Execute query
  const result = await ResultAsync.fromPromise(
    Promise.all([
      prisma.trade.findMany({
        where,
        include: tradeInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.trade.count({ where }),
    ]),
    (e) => databaseError(e)
  );

  return resultToResponseWithRateLimit(
    result.map(([trades, totalCount]) => ({
      trades,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })),
    rateLimit
  );
}

// POST /api/p2p/trades - Create new trade offer
export async function POST(request: NextRequest) {
  // Rate limit API writes
  const rateLimitPost = await rateLimitCheck(request, "apiWrite");
  if (rateLimitPost.blocked) return rateLimitPost.response;

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(bodyResult.error), rateLimitPost);
  }

  // Validate input
  const parseResult = CreateTradeSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimitPost);
  }

  const { initiatorAddress, counterpartyAddress, initiatorItems, counterpartyItems, metadata } =
    parseResult.data;

  // Find both users
  const usersResult = await ResultAsync.fromPromise(
    Promise.all([
      auth.getUserByWallet(initiatorAddress),
      auth.getUserByWallet(counterpartyAddress),
    ]),
    (e) => databaseError(e)
  );

  if (usersResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(usersResult.error), rateLimitPost);
  }

  const [initiator, counterparty] = usersResult.value;

  if (!initiator || !counterparty) {
    return resultToResponseWithRateLimit(err(notFoundError("User", "one or both users")), rateLimitPost);
  }

  if (initiator.id === counterparty.id) {
    return resultToResponseWithRateLimit(err(badRequestError("Cannot trade with yourself")), rateLimitPost);
  }

  // Create trade with items
  const result = await ResultAsync.fromPromise(
    prisma.trade.create({
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
      include: {
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
      },
    }),
    (e) => databaseError(e)
  );

  return resultToResponseWithRateLimit(result.map((trade) => ({ trade })), rateLimitPost);
}
