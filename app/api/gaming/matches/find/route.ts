import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitCheck } from "@/lib/rate-limit";
import { z } from "zod";
import {
  elympicsClient,
  elympicsConfig,
  type MatchType,
} from "@/lib/elympics";

// ============ Zod Schemas ============

const FindMatchSchema = z.object({
  gameId: z.string().min(1, "gameId is required"),
  walletAddress: z
    .string()
    .min(1, "walletAddress is required")
    .transform((v) => v.toLowerCase()),
  matchType: z.enum(["ranked", "casual", "tournament"]).optional().default("casual"),
  wager: z
    .object({
      amount: z.string(),
      type: z.enum(["eth", "nft", "token"]),
    })
    .optional(),
});

// ============ POST Handler ============

// POST /api/gaming/matches/find - Request matchmaking
export async function POST(request: NextRequest) {
  // Rate limit: write operations (30 req/min)
  const rateCheck = await rateLimitCheck(request, "apiWrite");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const body = await request.json();

    // Validate input
    const parseResult = FindMatchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { gameId, walletAddress, matchType, wager } = parseResult.data;

    // Find game
    const game = await prisma.game.findFirst({
      where: { OR: [{ id: gameId }, { slug: gameId }] },
    });

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: `Player${walletAddress.slice(0, 6)}`,
        },
      });
    }

    // Get user's current rating for this game
    const playerStats = await prisma.playerStats.findUnique({
      where: { userId_gameId: { userId: user.id, gameId: game.id } },
    });

    // ============ Elympics Matchmaking ============
    // If game has Elympics integration, use Elympics matchmaking
    if (game.elympicsGameId && elympicsConfig.isConfigured) {
      try {
        const queueStatus = await elympicsClient.joinQueue({
          playerId: user.id,
          gameId: game.elympicsGameId,
          matchType: matchType as MatchType,
          wager,
          metadata: {
            walletAddress: user.walletAddress,
            username: user.username,
            rating: playerStats?.rating ?? 1000,
          },
        });

        // Create a placeholder match record
        const match = await prisma.match.create({
          data: {
            gameId: game.id,
            player1Id: user.id,
            status: "MATCHMAKING",
            wagerAmount: wager?.amount ? parseFloat(wager.amount) : null,
            wagerType: wager?.type || null,
          },
          include: {
            player1: {
              select: { id: true, username: true, profilePicture: true },
            },
            game: true,
          },
        });

        return NextResponse.json({
          success: true,
          status: "searching",
          matchmaker: "elympics",
          queueId: queueStatus.queueId,
          estimatedWaitTime: queueStatus.estimatedWaitTime,
          playersInQueue: queueStatus.playersInQueue,
          match: {
            ...match,
            wagerAmount: match.wagerAmount
              ? parseFloat(match.wagerAmount.toString())
              : null,
          },
          message: "Searching for opponent via Elympics...",
        });
      } catch (elympicsError) {
        console.warn(
          "[Matchmaking] Elympics queue failed, falling back to local:",
          elympicsError
        );
        // Fall through to local matchmaking
      }
    }

    // ============ Local Matchmaking ============
    // Fallback or primary matchmaking for games without Elympics

    // Check for existing pending match (simple FIFO queue)
    const existingMatch = await prisma.match.findFirst({
      where: {
        gameId: game.id,
        status: "MATCHMAKING",
        player2Id: null,
        player1Id: { not: user.id },
        // Match wager type if specified
        ...(wager
          ? {
              wagerType: wager.type,
              // Match within 10% of wager amount
              wagerAmount: {
                gte: parseFloat(wager.amount) * 0.9,
                lte: parseFloat(wager.amount) * 1.1,
              },
            }
          : { wagerAmount: null }),
      },
      orderBy: { createdAt: "asc" },
    });

    if (existingMatch) {
      // Join existing match
      const match = await prisma.match.update({
        where: { id: existingMatch.id },
        data: {
          player2Id: user.id,
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
        include: {
          player1: {
            select: { id: true, username: true, profilePicture: true },
          },
          player2: {
            select: { id: true, username: true, profilePicture: true },
          },
          game: true,
        },
      });

      return NextResponse.json({
        success: true,
        status: "matched",
        matchmaker: "local",
        match: {
          ...match,
          wagerAmount: match.wagerAmount
            ? parseFloat(match.wagerAmount.toString())
            : null,
        },
      });
    }

    // Create new match and wait for opponent
    const match = await prisma.match.create({
      data: {
        gameId: game.id,
        player1Id: user.id,
        status: "MATCHMAKING",
        wagerAmount: wager?.amount ? parseFloat(wager.amount) : null,
        wagerType: wager?.type || null,
      },
      include: {
        player1: {
          select: { id: true, username: true, profilePicture: true },
        },
        game: true,
      },
    });

    return NextResponse.json({
      success: true,
      status: "searching",
      matchmaker: "local",
      match: {
        ...match,
        wagerAmount: match.wagerAmount
          ? parseFloat(match.wagerAmount.toString())
          : null,
      },
      message: "Searching for opponent...",
    });
  } catch (error) {
    console.error("Error finding match:", error);
    return NextResponse.json(
      { success: false, error: "Failed to find match" },
      { status: 500 }
    );
  }
}

// ============ DELETE Handler ============

const CancelMatchSchema = z.object({
  matchId: z.string().min(1, "matchId is required"),
  walletAddress: z
    .string()
    .min(1, "walletAddress is required")
    .transform((v) => v.toLowerCase()),
  queueId: z.string().optional(), // Elympics queue ID if applicable
});

// DELETE /api/gaming/matches/find - Cancel matchmaking
export async function DELETE(request: NextRequest) {
  // Rate limit: write operations (30 req/min)
  const rateCheck = await rateLimitCheck(request, "apiWrite");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const { searchParams } = new URL(request.url);

    // Validate input
    const parseResult = CancelMatchSchema.safeParse({
      matchId: searchParams.get("matchId"),
      walletAddress: searchParams.get("walletAddress"),
      queueId: searchParams.get("queueId"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { matchId, walletAddress, queueId } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Cancel the match if user is player1 and still searching
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        player1Id: user.id,
        status: "MATCHMAKING",
      },
      include: {
        game: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match not found or cannot be cancelled" },
        { status: 404 }
      );
    }

    // Leave Elympics queue if applicable
    if (queueId && match.game.elympicsGameId) {
      try {
        await elympicsClient.leaveQueue(queueId);
      } catch (elympicsError) {
        console.warn("[Matchmaking] Failed to leave Elympics queue:", elympicsError);
        // Continue with local cancellation
      }
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Matchmaking cancelled",
    });
  } catch (error) {
    console.error("Error cancelling matchmaking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel matchmaking" },
      { status: 500 }
    );
  }
}

// ============ GET Handler ============

// GET /api/gaming/matches/find - Poll queue status
export async function GET(request: NextRequest) {
  // Rate limit: read operations (100 req/min)
  const rateCheck = await rateLimitCheck(request, "api");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");
    const queueId = searchParams.get("queueId");

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: "matchId is required" },
        { status: 400 }
      );
    }

    // Get match status from database
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          select: { id: true, username: true, profilePicture: true },
        },
        player2: {
          select: { id: true, username: true, profilePicture: true },
        },
        game: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    // If we have an Elympics queue ID, check its status
    let elympicsStatus = null;
    if (queueId && match.game.elympicsGameId && match.status === "MATCHMAKING") {
      try {
        elympicsStatus = await elympicsClient.getQueueStatus(queueId);

        // If matched via Elympics, update local match
        if (elympicsStatus.status === "matched" && elympicsStatus.matchId) {
          // The webhook handler will create the proper match record
          // For now, return the matched status
          return NextResponse.json({
            success: true,
            status: "matched",
            matchmaker: "elympics",
            elympicsMatchId: elympicsStatus.matchId,
            match: {
              ...match,
              status: "IN_PROGRESS",
              wagerAmount: match.wagerAmount
                ? parseFloat(match.wagerAmount.toString())
                : null,
            },
          });
        }
      } catch (elympicsError) {
        console.warn("[Matchmaking] Failed to get Elympics queue status:", elympicsError);
      }
    }

    return NextResponse.json({
      success: true,
      status: match.status === "MATCHMAKING" ? "searching" : match.status.toLowerCase(),
      matchmaker: match.game.elympicsGameId ? "elympics" : "local",
      queueStatus: elympicsStatus,
      match: {
        ...match,
        wagerAmount: match.wagerAmount
          ? parseFloat(match.wagerAmount.toString())
          : null,
      },
    });
  } catch (error) {
    console.error("Error polling match status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get match status" },
      { status: 500 }
    );
  }
}
